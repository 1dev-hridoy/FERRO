import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    meta: {
        name: "help",
        author: "1dev-hridoy",
        version: "1.0.0",
        description: "List commands and plugins",
        guide: "/help",
        cooldown: 5
    },


    setup: (bot) => {
        bot.command('help', async (ctx) => {
            let helpText = "*🤖 AI Agent Help*\n\n*Commands:*\n";



            const commandsDir = path.join(__dirname, '../');
            const commandFiles = await fs.readdir(commandsDir);

            for (const file of commandFiles) {
                if (file.endsWith('.js')) {
                    const module = await import(`file://${path.join(commandsDir, file)}`);
                    if (module.default && module.default.meta) {
                        helpText += `/${module.default.meta.name} - ${module.default.meta.description}\n`;
                    }
                }
            }





            helpText += "\n*Plugins (AI access only):*\n";
            const pluginsDir = path.join(__dirname, '../../../plugins');
            if (await fs.pathExists(pluginsDir)) {
                const pluginDirs = await fs.readdir(pluginsDir);
                for (const dir of pluginDirs) {
                    const metaPath = path.join(pluginsDir, dir, '_meta.json');
                    if (await fs.pathExists(metaPath)) {
                        const meta = await fs.readJson(metaPath);
                        helpText += `• ${meta.display_name || meta.name} - ${meta.description}\n`;
                    }
                }
            }

            ctx.replyWithMarkdown(helpText);
        });
    }
};
