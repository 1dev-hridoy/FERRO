import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/chat_history.json');




fs.ensureFileSync(dbPath);
try {
    if (fs.readFileSync(dbPath, 'utf8').trim() === '') {
        fs.writeJsonSync(dbPath, {});
    }
} catch (e) {
    fs.writeJsonSync(dbPath, {});
}

async function getDB() {
    try {
        return await fs.readJson(dbPath);
    } catch {
        return {};
    }
}




async function saveDB(data) {
    await fs.writeJson(dbPath, data, { spaces: 2 });
}




export const chatDb = {
    saveMessage: async (userId, role, content) => {
        const db = await getDB();
        if (!db[userId]) db[userId] = [];

        db[userId].push({
            role,
            content,
            timestamp: new Date().toISOString()
        });



        if (db[userId].length > 100) {
            db[userId] = db[userId].slice(-100);
        }

        await saveDB(db);
    },





    getRecentContext: async (userId, limit = 20) => {
        const db = await getDB();
        const history = db[userId] || [];
        return history.slice(-limit).map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    },

    searchHistory: async (userId, query) => {
        const db = await getDB();
        const history = db[userId] || [];
        const lowerQuery = query.toLowerCase();

        return history.filter(msg =>
            msg.content.toLowerCase().includes(lowerQuery)
        ).map(msg => `[${msg.timestamp}] ${msg.role}: ${msg.content}`);
    },

    clearHistory: async (userId) => {
        const db = await getDB();
        db[userId] = [];
        await saveDB(db);
    }
};
