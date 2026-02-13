import inquirer from 'inquirer';
import chalk from 'chalk';
import gradient from 'gradient-string';

const titleGradient = gradient(['#ff6ec7', '#7873f5', '#4facfe']);



export const cli = {


    /**
     * ask a yes/no question
     */
    confirm: async (message, defaultValue = true) => {
        const { confirmed } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmed',
                message: chalk.cyan(message),
                default: defaultValue
            }
        ]);
        return confirmed;
    },





    /**
     * ask for text input
     */
    input: async (message, defaultValue = '') => {
        const { answer } = await inquirer.prompt([
            {
                type: 'input',
                name: 'answer',
                message: chalk.cyan(message),
                default: defaultValue
            }
        ]);
        return answer;
    },







    /**
     * ask for password/secret input
     */
    password: async (message) => {
        const { answer } = await inquirer.prompt([
            {
                type: 'password',
                name: 'answer',
                message: chalk.cyan(message),
                mask: '*'
            }
        ]);
        return answer;
    },






    /**
     * select from a list
     */
    select: async (message, choices) => {
        const { selected } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selected',
                message: chalk.cyan(message),
                choices: choices
            }
        ]);
        return selected;
    },



    /**
     * select multiple from a list
     */
    multiSelect: async (message, choices) => {
        const { selected } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'selected',
                message: chalk.cyan(message),
                choices: choices
            }
        ]);
        return selected;
    },






    /**
     * display a welcome banner
     */
    banner: (title, subtitle = '') => {
        console.log('\n');
        console.log(titleGradient('═'.repeat(50)));
        console.log(titleGradient(`  ${title}`));
        if (subtitle) {
            console.log(chalk.gray(`  ${subtitle}`));
        }
        console.log(titleGradient('═'.repeat(50)));
        console.log('\n');
    },




    menu: async (title, options) => {
        console.log('\n' + chalk.bold.cyan(title) + '\n');
        const { choice } = await inquirer.prompt([
            {
                type: 'list',
                name: 'choice',
                message: 'Select an option:',
                choices: options
            }
        ]);
        return choice;
    }
};
