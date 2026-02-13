export default {
    meta: {
        name: "start",
        author: "1dev-hridoy",
        version: "1.0.0",
        description: "Starts the bot interaction",
        guide: "Send /start to begin",
        cooldown: 5
    },
    setup: (bot) => {
        bot.command('start', (ctx) => {
            ctx.reply('Hello! I am your AI Agent. usage: /help or just chat with me.');
        });
    }
};
