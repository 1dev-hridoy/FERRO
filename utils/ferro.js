import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(__dirname, '../config');
const systemInfoPath = path.join(configDir, 'systemInfo.json');
const modelsInfoPath = path.join(configDir, 'modelsInfo.json');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function getSystemInfo() {
    return await fs.readJson(systemInfoPath);
}

async function getModelInfo(modelName) {
    const data = await fs.readJson(modelsInfoPath);
    return data.models.find(m => m.name === modelName);
}







export async function sendToAI(prompt, systemPrompt = '') {
    try {
        const systemInfo = await getSystemInfo();
        const modelInfo = await getModelInfo(systemInfo.modelName);

        if (!modelInfo) {
            throw new Error(`Model ${systemInfo.modelName} not found in configuration.`);
        }




        const modelsConfig = await fs.readJson(modelsInfoPath);
        const baseUrl = modelsConfig.baseUrl;
        const endpoint = modelInfo.endpoint;
        const url = `${baseUrl}${endpoint}`;

        const apiKey = process.env.FERRO_API_KEY;

        const payload = {
            prompt: prompt,
            apiKey: apiKey
        };



        if (systemPrompt) {
            payload.systemPrompt = systemPrompt;
        } else {




            payload.systemPrompt = `You are ${systemInfo.agentName}, an AI assistant owned by ${systemInfo.ownerName}. Your model is ${systemInfo.modelName}.`;
        }

        logger.debug(`Sending request to AI: ${url}`);

        const response = await axios.post(url, payload);

        if (response.data && response.data.data && typeof response.data.data.text === 'string') {
            return response.data.data.text;
        } else if (response.data && typeof response.data.data === 'string') {
            return response.data.data;
        } else {
            logger.error('Invalid response format:', JSON.stringify(response.data));
            throw new Error('Invalid response format from AI API');
        }




    } catch (error) {
        logger.error(`AI Request Failed: ${error.message}`);
        if (error.response) {
            logger.error(`Status: ${error.response.status}`);
            logger.error(`Data: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}
