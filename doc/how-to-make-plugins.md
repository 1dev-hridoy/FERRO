# How to Create Plugins

Plugins are complex modules that the AI can use to perform specific tasks. They are located in the `plugins/` directory, with each plugin having its own folder.

## Plugin Directory Structure

Each plugin requires three essential files:

```text
plugins/my_plugin/
├── _meta.json    # Basic plugin metadata
├── system.js     # AI Reasoning metadata & tool definitions
└── plug.js       # Implementation logic
```

### 1. `_meta.json`
Provides basic information for the plugin loader.

```json
{
    "name": "my_plugin",
    "author": "your_name",
    "version": "1.0.0",
    "description": "What this plugin does",
    "enabled": true
}
```

### 2. `system.js`
Defines how the AI perceives and uses your plugin.

```javascript
export default {
    name: "my_plugin",
    display_name: "My Plugin",
    priority: 5, // 1-10 (higher = prioritized in intent matching)
    intent_patterns: [
        /\b(keyword1|keyword2)\b/i
    ],
    description: "Detailed description for the AI to understand usage.",
    functions: {
        my_function: {
            description: "Describe what this specific function does.",
            parameters: {
                type: "object",
                properties: {
                    arg1: { type: "string", description: "Argument description" }
                },
                required: ["arg1"]
            }
        }
    },
    instructions: "Specific rules for the AI when using this plugin."
};
```

### 3. `plug.js`
Contains the actual JavaScript logic.

```javascript
const myHandlers = {
    my_function: async (ctx, args) => {
        const { arg1 } = args;
        // Logic here
        return `Result: Received ${arg1}`;
    }
};

export default myHandlers;
```

## How It Works

1. **Intent Recognition**: When a user sends a message, the bot checks `intent_patterns` in `system.js` or uses AI reasoning to decide if this plugin is needed.
2. **AI Tool Call**: The AI generates a JSON tool call: `{"plugin": "my_plugin", "function": "my_function", "args": {"arg1": "value"}}`.
3. **Execution**: The `pluginExecutor` looks up the handler in `plug.js` and calls it with `ctx` (Telegraf context) and `args`.
4. **Response**: The string returned by the handler is sent back to the AI as an "Observation", which the AI then summarizes for the user.

## Best Practices
- **Return Strings**: Plugin functions should return strings (observations) for the AI to read.
- **Error Handling**: Use `try/catch` and return descriptive error messages so the AI can understand what went wrong.
- **Privacy**: Be careful not to leak sensitive internal data in return strings.
- **Data Persistence**: Use the `data/` directory for storing JSON or other files.
