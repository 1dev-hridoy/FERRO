import axios from "axios";
import * as cheerio from "cheerio";
import { logger } from "../../utils/logger.js";


async function pinterestSearch(query) {
    try {
        const url = `https://id.pinterest.com/search/pins/?autologin=true&q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                "cookie": "_auth=1; _b=\"AXOtdcLOEbxD+qMFO7SaKFUCRcmtAznLCZY9V3z9tcTqWH7bPo637K4f9xlJCfn3rl4=\"; _pinterest_sess=TWc9PSZWcnpkblM5U1pkNkZ0dzZ6NUc5WDZqZEpGd2pVY3A0Y2VJOGg0a0J0c2JFWVpQalhWeG5iTTRJTmI5R08zZVNhRUZ4SmsvMG1CbjBWUWpLWVFDcWNnNUhYL3NHT1EvN3RBMkFYVUU0T0dIRldqVVBrenVpbGo5Q1lONHRlMzBxQTBjRGFSZnFBcTdDQVgrWVJwM0JtN3VRNEQyeUpsdDYreXpYTktRVjlxb0xNanBodUR1VFN4c2JUek1DajJXbTVuLzNCUDVwMmRlZW5VZVpBeFQ5ZC9oc2RnTGpEMmg4M0Y2N2RJeVo2aGNBYllUYjRnM05VeERzZXVRUVVYNnNyMGpBNUdmQ1dmM2s2M0txUHRuZTBHVFJEMEE1SnIyY2FTTm9DUEVTeWxKb3V0SW13bkV3TldyOUdrdUZaWGpzWmdaT0JlVnhWb29xWTZOTnNVM1NQSzViMkFUTjBpRitRRVMxaUFxMEJqell1bVduTDJid2l3a012RUgxQWhZT1M3STViSVkxV0dSb1p0NTBYcXlqRU5nPT0ma25kRitQYjZJNTVPb2tyVnVxSWlleEdTTkFRPQ==; _ir=0"
            }
        });

        const $ = cheerio.load(data);
        const results = [];

        $('div > a').each((i, elem) => {
            const link = $(elem).find('img').attr('src');
            if (link && link.includes('236')) {
                results.push(link.replace(/236/g, '736'));
            }
        });

        return results.slice(1);
    } catch (error) {
        logger.error(`Pinterest Search Logic Error: ${error.message}`);
        throw error;
    }
}




export default {
    search: async (ctx, args) => {
        const { query, count = 5 } = args;
        if (!query) return "Please provide a search query.";

        try {
            logger.info(`📌 Searching Pinterest for: ${query}`);
            const images = await pinterestSearch(query);

            if (images.length === 0) {
                return "No results found on Pinterest.";
            }

            const limitedImages = images.slice(0, Math.min(count, 10));

            // send images directly to the user
            let successCount = 0;
            for (const imageUrl of limitedImages) {
                try {
                    await ctx.replyWithPhoto(imageUrl);
                    successCount++;
                } catch (e) {
                    logger.error(`Failed to send Pinterest image ${imageUrl}: ${e.message}`);
                }
            }

            return `Found and sent ${successCount} high-res images from Pinterest for "${query}".`;
        } catch (error) {
            logger.error(`Pinterest Plugin Error: ${error.message}`);
            return `Failed to search Pinterest: ${error.message}`;
        }
    }
};
