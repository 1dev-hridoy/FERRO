export default {
    meta: {
        name: "ping",
        author: "1dev-hridoy",
        version: "1.0.0",
        description: "Check bot latency",
        guide: "/ping",
        cooldown: 5
    },
    setup: (bot) => {
        bot.command('ping', async (ctx) => {
            const start = Date.now();
            const msg = await ctx.reply('Pong!');
            const end = Date.now();
            ctx.telegram.editMessageText(msg.chat.id, msg.message_id, null, `Pong! Latency: ${end - start}ms`);
        });
    }
};
