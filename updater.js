import { exec } from 'child_process';
import util from 'util';
import { logger } from './utils/logger.js';
import fs from 'fs-extra';
import path from 'path';

const execPromise = util.promisify(exec);

export async function checkUpdate() {
    try {
        const { stdout } = await execPromise('git fetch && git status -uno');
        return stdout.includes('Your branch is behind');
    } catch (error) {
        logger.error(`Update check failed: ${error.message}`);
        return false;
    }
}



export async function performUpdate() {
    try {
        logger.info('Starting update process...');


        const backupDir = `../backup_${Date.now()}`;
        await fs.copy('.', backupDir, { filter: (src) => !src.includes('node_modules') });
        logger.info(`Backup created at ${backupDir}`);


        await execPromise('git pull');
        logger.success('Git pull successful.');

        return true;
    } catch (error) {
        logger.error(`Update failed: ${error.message}`);
        return false;
    }
}
