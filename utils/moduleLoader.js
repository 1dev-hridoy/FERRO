import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';




const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulesDir = path.join(__dirname, '../modules');





export async function loadCommands(bot) {
    const commandsDir = path.join(modulesDir, 'commands');
    await fs.ensureDir(commandsDir);
    const files = await fs.readdir(commandsDir);

    for (const file of files) {
        if (file.endsWith('.js')) {
            try {
                const module = await import(`file://${path.join(commandsDir, file)}`);
                if (module.default && module.default.setup) {
                    module.default.setup(bot);
                    logger.info(`Loaded command module: ${file}`);
                }
            } catch (error) {
                logger.error(`Failed to load command ${file}: ${error.message}`);
            }
        }
    }
}





export async function loadEvents(bot) {
    const eventsDir = path.join(modulesDir, 'events');
    await fs.ensureDir(eventsDir);
    const files = await fs.readdir(eventsDir);

    for (const file of files) {
        if (file.endsWith('.js')) {
            try {
                const module = await import(`file://${path.join(eventsDir, file)}`);
                if (module.default && module.default.setup) {
                    module.default.setup(bot);
                    logger.info(`Loaded event module: ${file}`);
                }
            } catch (error) {
                logger.error(`Failed to load event ${file}: ${error.message}`);
            }
        }
    }
}
