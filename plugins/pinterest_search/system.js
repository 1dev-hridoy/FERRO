export default {
    name: "pinterest_search",
    display_name: "Pinterest Search",
    priority: 8,
    intent_patterns: [
        /\b(pinterest|pin)\b.*\b(search|find|images?|pictures?)\b/i,
        /\b(search|find|get)\b.*\b(pinterest|pin)\b/i
    ],
    description: "Search for high-quality images on Pinterest. Use 'search' to get results.",
    functions: {
        search: {
            description: "Search for images on Pinterest based on a query.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "The image or topic to search for" },
                    count: { type: "number", description: "Number of images to return (max 20)" }
                },
                required: ["query"]
            }
        }
    },
    instructions: "To use this tool, output a JSON block like: { \"plugin\": \"pinterest_search\", \"function\": \"search\", \"args\": { \"query\": \"sunset aesthetic\" } }. The results will contain high-res image URLs."
};
