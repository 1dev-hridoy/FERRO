export default {
    name: "image_search",
    display_name: "Image Search",
    priority: 8,
    intent_patterns: [
        /\b(show|find|send|search)\b.*\b(image|picture|photo|pic)\b/i,
        /\b(look\s*up|search)\b.*\b(images|pictures|photos|pics)\b/i
    ],
    description: "Search for images on Bing. To use, call function 'quick_search' (e.g. image_search.quick_search).",
    functions: {
        search: {
            description: "Search for image URLs on Google based on a query.",
            parameters: {
                type: "object",
                properties: {
                    searchTerm: { type: "string", description: "The image to search for" },
                    count: { type: "number", description: "Number of image results to fetch (default 10, max 40)" }
                },
                required: ["searchTerm"]
            }
        },
        send_images: {
            description: "Send selected image URLs to the user chat.",
            parameters: {
                type: "object",
                properties: {
                    urls: {
                        type: "array",
                        items: { type: "string" },
                        description: "List of 1-5 image URLs to send"
                    }
                },
                required: ["urls"]
            }
        },
        quick_search: {
            description: "Search and immediately send 1-5 images to the user in one step.",
            parameters: {
                type: "object",
                properties: {
                    searchTerm: { type: "string", description: "The image to search for" },
                    count: { type: "number", description: "Number of images to send (1-5, default 3)" }
                },
                required: ["searchTerm"]
            }
        }
    },
    instructions: "For simple 'show me pictures' requests, use 'quick_search'. For complex tasks, use 'search' then 'send_images'."
};
