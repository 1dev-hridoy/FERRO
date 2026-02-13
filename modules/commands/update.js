import { checkUpdate, performUpdate } from '../../updater.js';
import { Markup } from 'telegraf';

export default {
    meta: {
        name: "update",
        author: "1dev-hridoy",
        version: "1.0.0",
        description: "Checks for updates and installs them",
        guide: "Send /update to check. Click button to install. (Owner only)",
        cooldown: 60
    },
    setup: (bot) => {
        bot.command('update', async (ctx) => {
            if (String(ctx.from.id) !== process.env.OWNER_UID) return;

            ctx.reply('Checking for updates...');
            const hasUpdate = await checkUpdate();

            if (hasUpdate) {
                ctx.reply('Update available!', Markup.inlineKeyboard([
                    Markup.button.callback('Download & Update', 'do_update')
                ]));
            } else {
                ctx.reply('Bot is up to date.');
            }
        });

        bot.action('do_update', async (ctx) => {
            if (String(ctx.from.id) !== process.env.OWNER_UID) return;

            ctx.reply('Starting update process... This may take a moment.');
            const success = await performUpdate();

            if (success) {
                ctx.reply('Update downloaded. Restart to apply changes?', Markup.inlineKeyboard([
                    Markup.button.callback('Restart Now', 'do_restart')
                ]));
            } else {
                ctx.reply('Update failed. Check logs.');
            }
        });

        bot.action('do_restart', (ctx) => {
            if (String(ctx.from.id) !== process.env.OWNER_UID) return;
            ctx.reply('Restarting...');
            setTimeout(() => {
                process.exit(100);
            }, 1000);
        });
    }
};
