import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/memory.json');

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

export default {
    save_fact: async (ctx, args) => {
        const db = await getDB();
        db[args.key] = args.value;
        await saveDB(db);
        return `Saved fact: [${args.key}] = ${args.value}`;
    },
    get_fact: async (ctx, args) => {
        const db = await getDB();
        const val = db[args.key];
        return val ? `Memory [${args.key}]: ${val}` : `No memory found for key: ${args.key}`;
    },
    list_facts: async (ctx, args) => {
        const db = await getDB();
        const keys = Object.keys(db);
        return keys.length > 0 ? `Known topics: ${keys.join(', ')}` : "Memory is empty.";
    }
};
