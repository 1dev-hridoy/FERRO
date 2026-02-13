export default {
    name: "code_exec",
    display_name: "Code Execution",
    priority: 7,
    intent_patterns: [
        /\b(run|execute|eval|calculate|compute)\b/i,
        /\b(what\s+is|calculate)\s+\d+/i,
        /\b(shell|command|script)\b/i
    ],
    description: "Execute JavaScript code snippets and shell commands with safety limits",
    functions: {
        run_js: {
            description: "Execute JavaScript code snippet",
            parameters: {
                type: "object",
                properties: {
                    code: { type: "string", description: "JavaScript code to execute" }
                },
                required: ["code"]
            }
        },
        run_shell: {
            description: "Execute shell command (limited to safe commands)",
            parameters: {
                type: "object",
                properties: {
                    command: { type: "string", description: "Shell command to execute" }
                },
                required: ["command"]
            }
        }
    },
    instructions: "Examples:\n- JS: {\"plugin\": \"code_exec\", \"function\": \"run_js\", \"args\": {\"code\": \"2 + 2\"}}\n- Shell: {\"plugin\": \"code_exec\", \"function\": \"run_shell\", \"args\": {\"command\": \"ls -la\"}}"
};
