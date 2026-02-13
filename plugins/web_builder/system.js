export default {
    name: "web_builder",
    display_name: "Web Builder",
    priority: 9,
    intent_patterns: [
        /\b(build|create|make|generate)\b.*\b(website|site|web\s*page|landing\s*page)\b/i,
        /\b(html|css|js|website|site)\b.*\b(builder|generator)\b/i
    ],
    description: "Generate complete static websites (HTML, CSS, JS) based on prompts. It handles prompt enhancement, file structuring, and delivery via ZIP.",
    functions: {
        build_site: {
            description: "Build a website based on a description.",
            parameters: {
                type: "object",
                properties: {
                    prompt: { type: "string", description: "The description of the website to build" }
                },
                required: ["prompt"]
            }
        }
    },
    instructions: "When the user asks to build a website, use this tool. You only need to provide the user's prompt; the tool will handle the AI enhancement and file generation internally."
};
