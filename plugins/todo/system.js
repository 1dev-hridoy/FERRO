export default {
    name: "todo",
    display_name: "To-Do List",
    priority: 8,
    intent_patterns: [
        /\b(add\s+task|create\s+todo|new\s+task)\b/i,
        /\b(todo|task)\s+(list|show|display)\b/i,
        /\b(remind\s+me|reminder)\b/i
    ],
    description: "Manage a list of tasks with status tracking (not started, in progress, complete).",
    functions: {
        add_task: {
            description: "Adds a new task to the list.",
            parameters: {
                type: "object",
                properties: {
                    task: { type: "string", description: "The task description or title" }
                },
                required: ["task"]
            }
        },
        update_task: {
            description: "Updates the status of an existing task by its ID.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "integer", description: "The task ID (from the list)" },
                    status: {
                        type: "string",
                        enum: ["not started", "in progress", "complete"],
                        description: "The new status of the task"
                    }
                },
                required: ["id", "status"]
            }
        },
        list_tasks: {
            description: "Lists all tasks with their current status and IDs.",
            parameters: {
                type: "object",
                properties: {
                    filter: {
                        type: "string",
                        enum: ["all", "not started", "in progress", "complete"],
                        description: "Optional filter by status"
                    }
                }
            }
        },
        remove_task: {
            description: "Deletes a task from the list using its ID.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "integer", description: "The ID of the task to remove" }
                },
                required: ["id"]
            }
        }
    }
};
