export default {
    name: "web_extractor",
    display_name: "Web Extractor",
    priority: 8,
    intent_patterns: [
        /\b(extract|scrape|metadata|og\s*tags|site\s*info)\b/i,
        /https?:\/\/[^\s]+/i
    ],
    description: "Extract metadata, title, and site info from any URL. Use this for general websites, blogs, or articles (NOT for YouTube).",
    functions: {
        extract_metadata: {
            description: "Scrape and extract metadata (title, description, OG tags) from a URL.",
            parameters: {
                type: "object",
                properties: {
                    url: { type: "string", description: "The full URL of the webpage to extract info from" }
                },
                required: ["url"]
            }
        }
    },
    instructions: "To use this tool, provide a valid URL. The results will include page title, description, keywords, and OpenGraph metadata."
};
