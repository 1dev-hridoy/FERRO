import axios from "axios";
import * as cheerio from "cheerio";
import { logger } from "../../utils/logger.js";

async function scrapeBingImages(q) {
    if (!q) {
        throw new Error('"q" nya isi mas');
    }
    try {
        const { data: html } = await axios.get(`https://www.bing.com/images/search?q=${q}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        const $ = cheerio.load(html);

        const searchQuery = $('#sb_form_q').val();

        const images = $('.iuscp').map((_, el) => {
            const container = $(el);
            const linkElement = container.find('a.iusc');
            const metadataAttr = linkElement.attr('m');

            if (!metadataAttr) return null;

            try {
                const metadata = JSON.parse(metadataAttr);
                const detailPageUrl = 'https://www.bing.com' + linkElement.attr('href');

                return {
                    title: metadata.t || container.find('.infpd a').attr('title') || "Image",
                    url: metadata.murl,
                    mediaUrl: metadata.murl,
                    sourceUrl: metadata.purl,
                    sourceDomain: container.find('.lnkw a').text().trim(),
                    detailPageUrl
                };
            } catch (e) {
                return null;
            }
        }).get().filter(Boolean);

        return {
            searchQuery,
            imageCount: images.length,
            images,
        };
    } catch (error) {
        throw new Error(`error: ${error.message}`);
    }
}

export default {
    search: async (ctx, args) => {
        const { searchTerm, count = 10 } = args;
        try {
            logger.info(`🔍 Searching Bing Images for: ${searchTerm}`);
            const data = await scrapeBingImages(searchTerm);
            const limitedImages = data.images.slice(0, Math.min(count, 40));

            return {
                status: "success",
                query: searchTerm,
                count: limitedImages.length,
                images: limitedImages
            };
        } catch (error) {
            logger.error(`Image Search Error: ${error.message}`);
            return { status: "error", message: error.message };
        }
    },

    send_images: async (ctx, args) => {
        const { urls } = args;
        if (!urls || !Array.isArray(urls)) {
            return "Error: No URLs provided or invalid format.";
        }

        const limitedUrls = urls.slice(0, 5);
        let successCount = 0;

        for (const url of limitedUrls) {
            try {
                await ctx.replyWithPhoto(url);
                successCount++;
            } catch (error) {
                logger.error(`Failed to send image ${url}: ${error.message}`);
            }
        }

        return `Successfully sent ${successCount}/${limitedUrls.length} images.`;
    },

    quick_search: async (ctx, args) => {
        const { searchTerm, count = 3 } = args;
        try {
            logger.info(`🔍 Quick Searching Bing Images for: ${searchTerm}`);
            const data = await scrapeBingImages(searchTerm);
            const limitedImages = data.images.slice(0, Math.min(count, 5));

            if (limitedImages.length === 0) return "No images found.";

            let successCount = 0;
            for (const img of limitedImages) {
                try {
                    await ctx.replyWithPhoto(img.mediaUrl);
                    successCount++;
                } catch (e) {
                    logger.error(`Failed to send image ${img.mediaUrl}: ${e.message}`);
                }
            }
            return `Found and sent ${successCount} images for "${searchTerm}".`;
        } catch (error) {
            logger.error(`Quick Image Search Error: ${error.message}`);
            return { status: "error", message: error.message };
        }
    }
};
