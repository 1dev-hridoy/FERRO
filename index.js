import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkAndSetup } from './utils/setup.js';
import { logger } from './utils/logger.js';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const botScript = path.join(__dirname, 'bot.js');

async function startBot() {
    logger.info('Starting Bot Process...');
    const botProcess = spawn('node', [botScript], {
        stdio: 'inherit',
        env: process.env
    });

    botProcess.on('close', (code) => {
        logger.warn(`Bot process exited with code ${code}`);
        if (code === 100) {


            logger.info('Restarting bot...');
            startBot();
        } else {
            logger.error('Bot crashed. Waiting 5s before restart...');
            setTimeout(startBot, 5000);
        }
    });
}




(async () => {

    try {
        const needsSetup = await checkAndSetup();


        startBot();

    } catch (error) {
        logger.error('Fatal Error during startup: ' + error.message);
    }
})();
