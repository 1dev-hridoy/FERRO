import { execSync } from 'child_process';
import vm from 'vm';


const SAFE_COMMANDS = ['ls', 'pwd', 'date', 'whoami', 'uptime', 'df', 'free', 'ps', 'echo', 'cat', 'head', 'tail', 'grep', 'wc', 'find'];

function isCommandSafe(command) {
    const cmd = command.trim().split(' ')[0];
    return SAFE_COMMANDS.includes(cmd);
}

async function run_js(ctx, args) {
    try {
        const { code } = args;

        if (!code) {
            return "Error: Code is required";
        }


        const sandbox = {
            console: {
                log: (...args) => args.join(' ')
            },
            Math,
            Date,
            JSON,
            Array,
            Object,
            String,
            Number
        };

        const context = vm.createContext(sandbox);


        const result = vm.runInContext(code, context, {
            timeout: 5000,
            displayErrors: true
        });

        return `**Code:**\n\`\`\`javascript\n${code}\n\`\`\`\n\n**Result:**\n${result}`;
    } catch (error) {
        return `**Code:**\n\`\`\`javascript\n${args.code}\n\`\`\`\n\n**Error:**\n${error.message}`;
    }
}




async function run_shell(ctx, args) {
    try {
        const { command } = args;

        if (!command) {
            return "Error: Command is required";
        }

        if (!isCommandSafe(command)) {
            return `Error: Command '${command.split(' ')[0]}' is not in the safe command list.\n\nAllowed commands: ${SAFE_COMMANDS.join(', ')}`;
        }

        const output = execSync(command, {
            timeout: 5000,
            maxBuffer: 1024 * 1024,
            encoding: 'utf-8'
        });

        return `**Command:**\n\`${command}\`\n\n**Output:**\n\`\`\`\n${output}\n\`\`\``;
    } catch (error) {
        return `**Command:**\n\`${args.command}\`\n\n**Error:**\n${error.message}`;
    }
}

export default {
    run_js,
    run_shell
};
