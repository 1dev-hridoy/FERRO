# How to Create Commands

Commands are registered as standalone modules in the `modules/commands/` directory. Each command is a separate `.js` file that connects directly to the Telegraf bot instance.

## Command Structure

A command file must export a default object with two main properties: `meta` and `setup`.

```javascript
export default {
    meta: {
        name: "command_name",
        author: "your_name",
        version: "1.0.0",
        description: "A brief description of the command",
        guide: "/command_name <args>",
        cooldown: 5 // Cooldown in seconds
    },
    setup: (bot) => {
        bot.command('command_name', async (ctx) => {
            // Your command logic here
            await ctx.reply('Hello from the new command!');
        });
    }
};
```

## Key Components

### 1. `meta`
- **name**: The unique identifier for the command.
- **author**: The creator of the command.
- **version**: Semantic versioning for the command.
- **description**: What the command does.
- **guide**: How to use the command (displayed in help).
- **cooldown**: Minimum time between uses per user.

### 2. `setup(bot)`
- This function is called when the bot starts.
- It provides the `bot` (Telegraf instance).
- Use `bot.command('name', handler)` to register the listener.

## Best Practices
- Use `async/await` for any asynchronous operations (like replying or database calls).
- Use `ctx.reply` or `ctx.replyWithMarkdown` for formatting.
- Log important events using the global `logger` utility.
- Ensure the filename matches the command name for consistency (e.g., `ping.js` for `/ping`).
