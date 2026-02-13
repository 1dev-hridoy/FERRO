export default {
    name: "youtube_summary",
    display_name: "YouTube Summarizer",
    priority: 10,
    intent_patterns: [
        /\b(summarize|summary|explain|tl;dr)\b.*(youtube|youtu\.be)/i,
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i
    ],
    description: "Summarize YouTube videos using the docsbot.ai API. CRITICAL: Use ONLY for YouTube URLs (youtube.com or youtu.be). For other websites, use 'web_extractor' or 'web_search'.",
    functions: {
        summarize_video: {
            description: "Get a detailed summary and key points for a YouTube video.",
            parameters: {
                type: "object",
                properties: {
                    url: { type: "string", description: "The YouTube video URL" }
                },
                required: ["url"]
            }
        }
    }
};
