import { chatDb } from '../../utils/chatDb.js';

export default {
    search: async (ctx, args) => {
        const userId = ctx.from.id;
        const results = await chatDb.searchHistory(userId, args.query);

        if (results.length === 0) return `No matches found for "${args.query}".`;


        return `Found matches:\n${results.slice(0, 5).join('\n')}`;
    }
};
