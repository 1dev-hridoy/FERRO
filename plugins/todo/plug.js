import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/todo.json');

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

const todoHandlers = {
    add_task: async (ctx, args) => {
        const db = await getDB();




        const tasksToAdd = Array.isArray(args.tasks) ? args.tasks : [args.task || args.tasks];

        let addedCount = 0;
        for (const taskStr of tasksToAdd) {
            if (!taskStr) continue;
            const newTask = {
                id: db.length > 0 ? Math.max(...db.map(t => t.id || 0)) + 1 : 1,
                task: String(taskStr),
                status: "not started",
                createdAt: new Date().toISOString()
            };
            db.push(newTask);
            addedCount++;
        }

        await saveDB(db);
        return `Added ${addedCount} task(s) successfully.`;
    },

    update_task: async (ctx, args) => {
        const db = await getDB();
        const id = parseInt(args.id);
        const index = db.findIndex(t => t.id === id);

        if (index === -1) return `Error: Task ID ${id} not found.`;

        const oldStatus = db[index].status;
        db[index].status = args.status || oldStatus;
        db[index].updatedAt = new Date().toISOString();

        await saveDB(db);
        return `Task #${id} status updated to ${db[index].status}.`;
    },




    list_tasks: async (ctx, args) => {
        const db = await getDB();
        if (db.length === 0) return "Your to-do list is empty.";

        const filter = args.filter || "all";
        const filtered = filter === "all" ? db : db.filter(t => t.status === filter);

        if (filtered.length === 0) return `No tasks found with status "${filter}".`;

        const list = filtered.map(t => {
            const icon = t.status === "complete" ? "✅" : (t.status === "in progress" ? "⏳" : "📝");
            return `[ID: ${t.id}] ${icon} ${t.task} (${t.status})`;
        }).join('\n');

        return `To-Do List:\n${list}`;
    },

    remove_task: async (ctx, args) => {
        const db = await getDB();
        const id = parseInt(args.id);
        const index = db.findIndex(t => t.id === id);

        if (index === -1) return `Error: Task ID ${id} not found.`;

        const removed = db.splice(index, 1);
        await saveDB(db);
        return `Removed task: "${removed[0].task}" (ID: ${id})`;
    }
};






todoHandlers.add = todoHandlers.add_task;
todoHandlers.list = todoHandlers.list_tasks;
todoHandlers.remove = todoHandlers.remove_task;
todoHandlers.update = todoHandlers.update_task;

export default todoHandlers;
