import { userPersonas } from '../../utils/store.js';

export default {
    meta: {
        name: "persona",
        author: "1dev-hridoy",
        version: "1.0.0",
        description: "Switch the AI persona",
        guide: "/persona <name> (e.g. /persona Pirate)",
        cooldown: 0
    },



    setup: (bot) => {
        bot.command('persona', (ctx) => {
            const args = ctx.message.text.split(' ').slice(1).join(' ');

            const presets = {
                'cyberpunk': 'A futuristic, high-tech, low-life AI from 2077. Uses technical jargon and neon aesthetics.',
                'medieval': 'A poetic medieval bard. Speaks in old English and loves flowery metaphors.',
                'minimalist': 'A surgically minimal AI. Extremely concise, professional, and direct.',
                'creative': 'A boundless creative spirit. Loves ASCII art, metaphors, and wild ideas.'
            };



            if (!args) {
                let msg = `Current Persona: ${userPersonas[ctx.from.id] || 'Default'}\n\n`;
                msg += `**Presets**:\n`;
                Object.keys(presets).forEach(k => msg += `- /persona ${k}\n`);
                msg += `\nUsage: /persona <any custom persona>`;
                return ctx.reply(msg);
            }




            const persona = presets[args.toLowerCase()] || args;
            userPersonas[ctx.from.id] = persona;
            ctx.reply(`Persona updated to: ${args.toLowerCase() in presets ? args : 'Custom'}`);
        });
    }



};
