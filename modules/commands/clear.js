import { chatDb } from '../../utils/chatDb.js';

export default {
    meta: {
        name: "clear",
        author: "1dev-hridoy",
        version: "1.0.0",
        description: "Clear conversation history",
        guide: "/clear",
        cooldown: 0
    },
    setup: (bot) => {
        bot.command('clear', async (ctx) => {
            await chatDb.clearHistory(ctx.from.id);
            ctx.reply('Conversation history cleared.');
        });
    }
};
