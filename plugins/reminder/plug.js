import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/reminders.json');


await fs.ensureDir(path.join(__dirname, '../../data'));

async function getDB() {
    try {
        const db = await fs.readJson(dbPath);
        return Array.isArray(db) ? db : [];
    } catch {
        return [];
    }
}

async function saveDB(data) {
    await fs.writeJson(dbPath, data, { spaces: 2 });
}


function parseReminderTime(timeStr) {
    const now = new Date();
    const lower = timeStr.toLowerCase().trim();

    // "in X minutes/hours/days"
    const inMatch = lower.match(/in\s+(\d+)\s+(minute|minutes|min|hour|hours|hr|day|days)/);
    if (inMatch) {
        const amount = parseInt(inMatch[1]);
        const unit = inMatch[2];

        if (unit.startsWith('min')) {
            return new Date(now.getTime() + amount * 60 * 1000);
        } else if (unit.startsWith('hour') || unit.startsWith('hr')) {
            return new Date(now.getTime() + amount * 60 * 60 * 1000);
        } else if (unit.startsWith('day')) {
            return new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
        }
    }



    // "tomorrow"
    if (lower.includes('tomorrow')) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM
        return tomorrow;
    }

    // "next week"
    if (lower.includes('next week')) {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(9, 0, 0, 0);
        return nextWeek;
    }

    // try to parse as ISO date or standard date format
    try {
        const parsed = new Date(timeStr);
        if (!isNaN(parsed.getTime()) && parsed > now) {
            return parsed;
        }
    } catch (e) {

    }

    return null;
}




const reminderHandlers = {
    set_reminder: async (ctx, args) => {
        const { message, time } = args;

        if (!message) {
            return "❌ Please provide a reminder message.";
        }

        if (!time) {
            return "❌ Please specify when to remind you (e.g., 'in 5 minutes', 'tomorrow', 'in 2 hours').";
        }

        const reminderTime = parseReminderTime(time);

        if (!reminderTime) {
            return `❌ Could not understand time: "${time}". Try formats like "in 5 minutes", "tomorrow", "in 2 hours".`;
        }

        const db = await getDB();
        const newReminder = {
            id: db.length > 0 ? Math.max(...db.map(r => r.id || 0)) + 1 : 1,
            userId: ctx.from.id,
            chatId: ctx.chat.id,
            message: message,
            time: reminderTime.toISOString(),
            createdAt: new Date().toISOString(),
            triggered: false
        };




        db.push(newReminder);
        await saveDB(db);

        const timeStr = reminderTime.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `✅ Reminder set!\n📝 Message: ${message}\n⏰ Time: ${timeStr}`;
    },







    list_reminders: async (ctx, args) => {
        const db = await getDB();
        const userId = ctx.from.id;
        const userReminders = db.filter(r => r.userId === userId && !r.triggered);

        if (userReminders.length === 0) {
            return "📭 You have no active reminders.";
        }

        let response = `📋 Your Reminders (${userReminders.length}):\n\n`;
        userReminders.forEach(r => {
            const time = new Date(r.time);
            const timeStr = time.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            response += `🔔 ID ${r.id}: ${r.message}\n   ⏰ ${timeStr}\n\n`;
        });

        return response.trim();
    },

    delete_reminder: async (ctx, args) => {
        const { id } = args;

        if (!id) {
            return "❌ Please provide the reminder ID to delete.";
        }

        const db = await getDB();
        const userId = ctx.from.id;
        const index = db.findIndex(r => r.id === parseInt(id) && r.userId === userId);

        if (index === -1) {
            return `❌ Reminder ID ${id} not found or doesn't belong to you.`;
        }

        const deleted = db.splice(index, 1)[0];
        await saveDB(db);

        return `✅ Deleted reminder: "${deleted.message}"`;
    },






    clear_reminders: async (ctx, args) => {
        const db = await getDB();
        const userId = ctx.from.id;
        const userReminders = db.filter(r => r.userId === userId && !r.triggered);

        if (userReminders.length === 0) {
            return "📭 You have no active reminders to clear.";
        }

        const newDB = db.filter(r => r.userId !== userId || r.triggered);
        await saveDB(newDB);

        return `✅ Cleared ${userReminders.length} reminder(s).`;
    }
};

export default reminderHandlers;





/**
 * background checker for due reminders
 * this should be called periodically by the bot
 */
export async function checkReminders(bot) {
    try {
        const db = await getDB();
        const now = new Date();
        const dueReminders = db.filter(r => !r.triggered && new Date(r.time) <= now);

        for (const reminder of dueReminders) {
            try {
                await bot.telegram.sendMessage(
                    reminder.chatId,
                    `🔔 **Reminder!**\n\n${reminder.message}`,
                    { parse_mode: 'Markdown' }
                );


                reminder.triggered = true;
                logger.info(`Triggered reminder ${reminder.id} for user ${reminder.userId}`);
            } catch (error) {
                logger.error(`Failed to send reminder ${reminder.id}: ${error.message}`);
            }
        }


        if (dueReminders.length > 0) {
            await saveDB(db);
        }
    } catch (error) {
        logger.error(`Reminder check failed: ${error.message}`);
    }
}
