export default {
    name: "file_ops",
    display_name: "File Operations",
    priority: 8,
    intent_patterns: [
        /\b(read|write|create|delete|list)\s+(file|directory|folder)\b/i,
        /\b(show|display)\s+(files|directories|folders)\b/i,
        /\b(file\s+content|directory\s+listing)\b/i
    ],
    description: "File operations for reading, writing, and managing files safely",
    functions: {
        read_file: {
            description: "Read contents of a file",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "File path to read" }
                },
                required: ["path"]
            }
        },
        list_dir: {
            description: "List contents of a directory",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Directory path to list (default: current directory)" }
                },
                required: []
            }
        },
        write_file: {
            description: "Write content to a file",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "File path to write" },
                    content: { type: "string", description: "Content to write" }
                },
                required: ["path", "content"]
            }
        }
    },
    instructions: "Examples:\n- Read: {\"plugin\": \"file_ops\", \"function\": \"read_file\", \"args\": {\"path\": \"file.txt\"}}\n- List: {\"plugin\": \"file_ops\", \"function\": \"list_dir\", \"args\": {\"path\": \".\"}}"
};
