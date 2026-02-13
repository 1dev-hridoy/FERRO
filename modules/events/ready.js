import { logger } from '../../utils/logger.js';

export default {
    setup: (bot) => {
        bot.on('ready', () => {
            logger.success(`Bot is ready and running as @${bot.botInfo.username}`);
        });





        logger.info('Ready event module loaded.');
    }
};
