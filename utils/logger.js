import chalk from 'chalk';
import gradient from 'gradient-string';
import ora from 'ora';

const pastelGradient = gradient(['#ff6ec7', '#7873f5', '#4facfe']);
const successGradient = gradient(['#00f260', '#0575e6']);
const errorGradient = gradient(['#ff0844', '#ffb199']);
const infoGradient = gradient(['#4facfe', '#00f2fe']);

const LINE = '────────────────────────────────────────────';





const spinners = new Map();

export const logger = {



    info: (msg) => console.log(chalk.blue('ℹ'), pastelGradient(msg)),
    success: (msg) => console.log(chalk.green('✓'), successGradient(msg)),
    error: (msg) => console.log(chalk.red('✗'), errorGradient(msg)),
    warn: (msg) => console.log(chalk.yellow('⚠'), chalk.yellow(msg)),
    debug: (msg) => console.log(chalk.gray('⚙'), chalk.gray(msg)),


    ai: (msg) => console.log(chalk.magenta('🤖'), infoGradient(msg)),
    tool: (msg) => console.log(chalk.cyan('🔧'), pastelGradient(msg)),
    state: (msg) => console.log(chalk.blue('📊'), chalk.blue(msg)),
    json: (obj) => console.log(chalk.cyan('📦'), chalk.cyan(JSON.stringify(obj, null, 2))),





    spinner: {
        start: (id, text) => {
            const spinner = ora({
                text: chalk.cyan(text),
                color: 'cyan',
                spinner: 'dots'
            }).start();
            spinners.set(id, spinner);
            return spinner;
        },

        update: (id, text) => {
            const spinner = spinners.get(id);
            if (spinner) {
                spinner.text = chalk.cyan(text);
            }
        },





        succeed: (id, text) => {
            const spinner = spinners.get(id);
            if (spinner) {
                spinner.succeed(successGradient(text));
                spinners.delete(id);
            }
        },

        fail: (id, text) => {
            const spinner = spinners.get(id);
            if (spinner) {
                spinner.fail(errorGradient(text));
                spinners.delete(id);
            }
        },





        stop: (id) => {
            const spinner = spinners.get(id);
            if (spinner) {
                spinner.stop();
                spinners.delete(id);
            }
        }
    },






    section: (title, emoji = '📋') => {
        console.log('\n' + chalk.gray(LINE));
        console.log(successGradient(`${emoji} ${title.toUpperCase()}`));
        console.log(chalk.gray(LINE));
    },

    field: (label, value, indent = 0) => {
        const spaces = '  '.repeat(indent);
        const maxLabelWidth = 15;
        const paddedLabel = label.padEnd(maxLabelWidth);
        console.log(`${spaces}${chalk.cyan(paddedLabel)} : ${chalk.white(value)}`);
    },

    bullet: (text, indent = 0) => {
        const spaces = '  '.repeat(indent);
        console.log(`${spaces}${chalk.yellow('•')} ${chalk.white(text)}`);
    },

    subField: (label, value) => {
        console.log(`  ${chalk.gray('└─')} ${chalk.cyan(label.padEnd(12))} : ${chalk.white(value)}`);
    },




    divider: () => {
        console.log(chalk.gray(LINE));
    },




    // request lifecycle
    requestStart: (requestId, userInput, maxLoops) => {
        console.log('\n' + chalk.gray(LINE));
        console.log(successGradient('🚀 REQUEST START'));
        console.log(chalk.gray(LINE));
        logger.field('🆔 Request ID', requestId);
        logger.field('👤 User Input', `"${userInput}"`);
        logger.field('🔁 Max Loops', maxLoops.toString());
    },




    planning: (strategy, details = {}) => {
        console.log('\n' + chalk.gray(LINE));
        console.log(infoGradient('🧠 AI PLANNING'));
        console.log(chalk.gray(LINE));
        logger.field('✔ Strategy', strategy);
        Object.entries(details).forEach(([key, value]) => {
            logger.field(`✔ ${key}`, value);
        });
    },







    toolExecution: (toolName, args, status = 'Executing...') => {
        console.log('\n' + chalk.gray(LINE));
        console.log(pastelGradient('🔌 TOOL EXECUTION'));
        console.log(chalk.gray(LINE));
        logger.field('🛠 Tool Name', toolName);
        console.log(chalk.cyan('📦 Arguments   :'));
        Object.entries(args).forEach(([key, value]) => {
            logger.subField(key, `"${value}"`);
        });
        console.log('');
        logger.field('⏳ Status', status);
    },






    toolResult: (status, source, details = {}) => {
        logger.field('✅ Result', status);
        if (source) logger.field('📄 Source', source);
        Object.entries(details).forEach(([key, value]) => {
            logger.field(`📌 ${key}`, value);
        });
    },






    toolSummary: (summary) => {
        console.log('\n' + chalk.gray(LINE));
        console.log(successGradient('📊 TOOL OUTPUT SUMMARY'));
        console.log(chalk.gray(LINE));
        Object.entries(summary).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                logger.field(key, '');
                value.forEach(item => logger.bullet(item, 1));
            } else {
                logger.field(key, value);
            }
        });
    },







    finalResponse: (response) => {
        console.log('\n' + chalk.gray(LINE));
        console.log(infoGradient('📝 FINAL AI RESPONSE'));
        console.log(chalk.gray(LINE));
        const wrapped = response.match(/.{1,60}(\s|$)/g) || [response];
        wrapped.forEach(line => console.log(chalk.white(line.trim())));
    },

    requestComplete: (loopsUsed, maxLoops, duration, status = 'Success') => {
        console.log('\n' + chalk.gray(LINE));
        console.log(successGradient('✅ REQUEST COMPLETED'));
        console.log(chalk.gray(LINE));
        logger.field('🔁 Loops Used', `${loopsUsed} / ${maxLoops}`);
        logger.field('⏱ Duration', duration);
        logger.field('📤 Status', status);
        console.log(chalk.gray(LINE) + '\n');
    }
};
