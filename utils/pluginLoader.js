import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginsDir = path.join(__dirname, '../plugins');




export async function loadPlugins() {
    await fs.ensureDir(pluginsDir);
    const plugins = [];
    const dirs = await fs.readdir(pluginsDir);




    for (const dir of dirs) {
        const pluginPath = path.join(pluginsDir, dir);
        if ((await fs.stat(pluginPath)).isDirectory()) {




            try {
                const metaPath = path.join(pluginPath, '_meta.json');
                const systemPath = path.join(pluginPath, 'system.js');
                const plugPath = path.join(pluginPath, 'plug.js');



                if (await fs.pathExists(metaPath) && await fs.pathExists(systemPath) && await fs.pathExists(plugPath)) {
                    const meta = await fs.readJson(metaPath);
                    const system = await import(`file://${systemPath}`);
                    const plug = await import(`file://${plugPath}`);




                    plugins.push({
                        meta,
                        system: system.default || system,
                        plug: plug.default || plug,
                        path: pluginPath
                    });



                    logger.info(`Loaded plugin: ${meta.name} v${meta.version}`);
                } else {
                    logger.warn(`Skipping incomplete plugin in ${dir}`);
                }
            } catch (error) {
                logger.error(`Failed to load plugin ${dir}: ${error.message}`);
            }
        }
    }



    return plugins;
}
