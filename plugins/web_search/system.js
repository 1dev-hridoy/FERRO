export default {
    name: "web_search",
    display_name: "Web Search",
    priority: 8,
    intent_patterns: [
        /\b(search|find|look\s*up|google|bing)\b/i,
        /\b(what\s+is|who\s+is|where\s+is)\s+(?!your|my|the\s+owner)/i,
        /\b(news|information|info)\s+about\b/i
    ],
    description: "Search the internet for real-time information. You MUST respond with exactly a JSON block in backticks to use this tool.",
    functions: {
        search: {
            description: "Search for info. CRITICAL: Response must be ONLY the JSON block if you use this.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Search query" }
                },
                required: ["query"]
            }
        }
    },
    instructions: "To use this tool, you MUST output a json code block like this: \n```json\n{ \"plugin\": \"web_search\", \"function\": \"search\", \"args\": { \"query\": \"your search here\" } }\n```\nDo NOT add any text before or after the block."
};
