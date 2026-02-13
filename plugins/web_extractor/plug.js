import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../../utils/logger.js';

export default {
    extract_metadata: async (ctx, args) => {
        const { url } = args;

        if (!url) {
            return "Error: No URL provided.";
        }




        try {
            logger.info(`🌐 Extracting metadata from: ${url}`);

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);

            const metadata = {
                title: $('title').text() || $('meta[property="og:title"]').attr('content') || 'N/A',
                description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || 'N/A',
                keywords: $('meta[name="keywords"]').attr('content') || 'N/A',
                og_site_name: $('meta[property="og:site_name"]').attr('content') || 'N/A',
                og_type: $('meta[property="og:type"]').attr('content') || 'N/A',
                og_image: $('meta[property="og:image"]').attr('content') || 'N/A',
                h1: $('h1').first().text().trim() || 'N/A',
                canonical: $('link[rel="canonical"]').attr('href') || url
            };




            let readableFormat = `📄 **Page Info: ${metadata.title}**\n\n`;
            readableFormat += `🔗 **URL**: ${url}\n`;
            readableFormat += `📝 **Description**: ${metadata.description}\n`;
            if (metadata.keywords !== 'N/A') readableFormat += `🔑 **Keywords**: ${metadata.keywords}\n`;
            if (metadata.h1 !== 'N/A') readableFormat += `🔝 **Primary Heading**: ${metadata.h1}\n`;
            if (metadata.og_site_name !== 'N/A') readableFormat += `🏢 **Site Name**: ${metadata.og_site_name}\n`;




            return readableFormat;
        } catch (error) {
            logger.error(`Scraping Error: ${error.message}`);
            return `Error fetching page: ${error.message}. Make sure the URL is valid and accessible.`;
        }
    }
};
