import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(__dirname, '../config');
const systemInfoPath = path.join(configDir, 'systemInfo.json');
const modelsInfoPath = path.join(configDir, 'modelsInfo.json');
const envPath = path.join(__dirname, '../.env');

dotenv.config({ path: envPath });

async function loadModels() {
    try {
        const data = await fs.readJson(modelsInfoPath);
        return data.models || [];
    } catch (error) {
        logger.error(`Failed to load models: ${error.message}`);
        return [];
    }
}






export async function checkAndSetup() {
    let systemInfo = {};
    try {
        systemInfo = await fs.readJson(systemInfoPath);
    } catch (error) {



    }

    const envConfig = dotenv.parse(await fs.readFile(envPath, 'utf-8').catch(() => ''));

    const isSystemInfoMissing = !systemInfo.agentName || !systemInfo.modelName || !systemInfo.ownerName;
    const isEnvMissing = !process.env.FERRO_API_KEY || !process.env.TELEGRAM_BOT_TOKEN || !process.env.OWNER_UID;

    if (isSystemInfoMissing || isEnvMissing) {
        logger.info('Starting setup wizard...');

        const models = await loadModels();
        const modelChoices = models.map(m => ({
            name: `${m.name} - ${m.quickDescription}`,
            value: m.name
        }));




        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'agentName',
                message: 'Enter Agent Name:',
                default: systemInfo.agentName || 'MyAIBox',
                validate: input => input ? true : 'Agent Name is required'
            },
            {
                type: 'list',
                name: 'modelName',
                message: 'Select AI Model:',
                choices: modelChoices,
                default: systemInfo.modelName
            },
            {
                type: 'input',
                name: 'ownerName',
                message: 'Enter Owner Name:',
                default: systemInfo.ownerName,
                validate: input => input ? true : 'Owner Name is required'
            },
            {
                type: 'input',
                name: 'ownerUid',
                message: 'Enter Owner Telegram UID:',
                default: envConfig.OWNER_UID || process.env.OWNER_UID,
                validate: input => /^\d+$/.test(input) ? true : 'UID must be numeric'
            },
            {
                type: 'password',
                name: 'ferroApiKey',
                message: 'Enter Ferro API Key:',
                mask: '*',
                default: envConfig.FERRO_API_KEY || process.env.FERRO_API_KEY,
                validate: input => input ? true : 'API Key is required'
            },
            {
                type: 'password',
                name: 'telegramBotToken',
                message: 'Enter Telegram Bot Token:',
                mask: '*',
                default: envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN,
                validate: input => input ? true : 'Bot Token is required'
            }
        ]);





        const newSystemInfo = {
            agentName: answers.agentName,
            modelName: answers.modelName,
            ownerName: answers.ownerName
        };
        await fs.writeJson(systemInfoPath, newSystemInfo, { spaces: 2 });
        logger.success('System Info saved.');




        const newEnvContent = `FERRO_API_KEY=${answers.ferroApiKey}\nTELEGRAM_BOT_TOKEN=${answers.telegramBotToken}\nOWNER_UID=${answers.ownerUid}\n`;
        await fs.writeFile(envPath, newEnvContent);
        logger.success('.env file updated.');

        return true;
    }

    return false;
}
