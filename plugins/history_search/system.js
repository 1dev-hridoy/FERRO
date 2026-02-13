export default {
    name: "history_search",
    display_name: "Chat History Search",
    priority: 6,
    intent_patterns: [
        /\b(what\s+did\s+(i|we)|previous|earlier)\b/i,
        /\b(conversation\s+history|chat\s+history)\b/i,
        /\b(before|last\s+time)\b/i
    ],
    description: "Search the chat history for specific keywords or topics.",
    functions: {
        search: {
            description: "Searches the user's past messages.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "The keyword to search for" }
                },
                required: ["query"]
            }
        }
    }
};
