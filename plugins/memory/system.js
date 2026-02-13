export default {
    name: "memory",
    display_name: "Long-Term Memory",
    priority: 7,
    intent_patterns: [
        /\b(save|store|remember)\s+(this|that|it)\b/i,
        /\b(recall|retrieve|get)\s+(fact|memory|info)\b/i,
        /\b(what\s+do\s+you\s+remember)\b/i
    ],
    description: "Save and retrieve Important facts about the user or world.",
    functions: {
        save_fact: {
            description: "Saves a fact to long-term memory.",
            parameters: {
                type: "object",
                properties: {
                    key: { type: "string", description: "Topic/Key for the fact (e.g., 'user_birthday')" },
                    value: { type: "string", description: "The fact content" }
                },
                required: ["key", "value"]
            }
        },
        get_fact: {
            description: "Retrieves a fact from long-term memory.",
            parameters: {
                type: "object",
                properties: {
                    key: { type: "string", description: "Topic/Key to retrieve" }
                },
                required: ["key"]
            }
        },
        list_facts: {
            description: "Lists all stored memory keys.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    }
};
