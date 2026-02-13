export default {
    meta: {
        name: "restart",
        author: "1dev-hridoy",
        version: "1.0.0",
        description: "Restarts the bot process",
        guide: "Send /restart (Owner only)",
        cooldown: 10
    },
    setup: (bot) => {
        bot.command('restart', (ctx) => {
            if (String(ctx.from.id) !== process.env.OWNER_UID) return;
            ctx.reply('Restarting bot...');
            setTimeout(() => {
                process.exit(100);
            }, 1000);
        });
    }
};
