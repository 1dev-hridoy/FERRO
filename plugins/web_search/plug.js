import axios from "axios";
import { load } from "cheerio";

const BING_SEARCH_URL = "https://www.bing.com/search";




async function fetchSearchResults(query) {
    const { data: html } = await axios.get(BING_SEARCH_URL, {
        params: { q: query },
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
    });

    const $ = load(html);

    return $("li.b_algo")
        .slice(0, 10)
        .map((_, el) => ({
            title: $(el).find("h2").text().trim(),
            description: $(el)
                .find(".b_caption p")
                .text()
                .replace(/WEB/g, "")
                .trim(),
            url: $(el).find("h2 a").attr("href"),
        }))
        .get();
}





/**
 * Web Search Plugin using Bing Scraper
 */
export default {
    search: async (ctx, args) => {
        const query = args.query;
        if (!query) return "Error: No query provided.";




        await ctx.reply(`🔍 Searching for "${query}"...`);

        try {
            const results = await fetchSearchResults(query);

            if (!results || results.length === 0) {
                return `No web results found for "${query}" on Bing.`;
            }



            const formattedResults = results.map((res, index) => (
                `${index + 1}. ${res.title}\nLink: ${res.url}\nInfo: ${res.description}`
            )).join('\n\n');

            return `Bing Search Results for "${query}":\n\n${formattedResults}`;
        } catch (error) {
            console.error(`Bing Search Error: ${error.message}`);
            return `Failed to search Bing: ${error.message}`;
        }
    }
};
