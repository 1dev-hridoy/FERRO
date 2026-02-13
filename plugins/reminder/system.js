export default {
    name: "reminder",
    display_name: "Reminder",
    priority: 7,
    intent_patterns: [
        /\b(remind|reminder|remind me|set reminder|alert me)\b/i,
        /\b(in\s+\d+\s+(minute|hour|day)s?)\b/i,
        /\b(tomorrow|next week|later)\b.*\b(remind|remember)\b/i
    ],
    description: "Set time-based reminders with natural language. Supports 'in X minutes/hours/days', 'tomorrow', 'next week', etc.",
    functions: {
        set_reminder: {
            description: "Set a new reminder with a message and time.",
            parameters: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        description: "What to remind about"
                    },
                    time: {
                        type: "string",
                        description: "When to remind (e.g., 'in 5 minutes', 'tomorrow', 'in 2 hours')"
                    }
                },
                required: ["message", "time"]
            }
        },
        list_reminders: {
            description: "List all active reminders for the user.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        },
        delete_reminder: {
            description: "Delete a specific reminder by ID.",
            parameters: {
                type: "object",
                properties: {
                    id: {
                        type: "number",
                        description: "Reminder ID to delete"
                    }
                },
                required: ["id"]
            }
        },
        clear_reminders: {
            description: "Clear all active reminders for the user.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    instructions: "Use this plugin when users want to be reminded about something at a specific time. Parse natural language time expressions like 'in 30 minutes', 'tomorrow at 3pm', 'next week'."
};
