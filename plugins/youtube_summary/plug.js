import axios from 'axios';
import { logger } from '../../utils/logger.js';

async function ytsummarizer(url) {
    try {
        if (!/youtube\.com|youtu\.be/.test(url)) {
            throw new Error('Invalid youtube url');
        }

        const { data } = await axios.post(
            'https://docsbot.ai/api/tools/youtube-prompter',
            {
                videoUrl: url,
                type: 'summary'
            },
            {
                headers: {
                    'content-type': 'application/json'
                }
            }
        );

        return data;
    } catch (error) {
        throw new Error(error.message);
    }
}




export default {
    summarize_video: async (ctx, args) => {
        const { url } = args;
        if (!url) return "Please provide a valid YouTube URL.";

        try {
            logger.info(`📺 Summarizing YouTube video: ${url}`);
            await ctx.reply("📺 Analyzing video content... please wait.");

            const data = await ytsummarizer(url);

            if (!data) throw new Error("No data returned from API");

            let response = `🎬 **${data.title}**\n\n`;
            if (data.summary) {
                response += `📝 **Summary**:\n${data.summary}\n\n`;
            }

            if (data.keyPoints && Array.isArray(data.keyPoints)) {
                response += `💡 **Key Points**:\n`;
                data.keyPoints.forEach(kp => {
                    response += `• *${kp.point}*: ${kp.summary}\n`;
                });
            }




            if (response.length > 4000) {
                const chunks = response.match(/.{1,4000}/g);
                for (const chunk of chunks) {
                    await ctx.reply(chunk, { parse_mode: 'Markdown' });
                }
            } else {
                await ctx.reply(response, { parse_mode: 'Markdown' });
            }

            return "Summary sent safely to user.";
        } catch (error) {
            logger.error(`YouTube Summary Error: ${error.message}`);
            return `❌ Failed to summarize video: ${error.message}`;
        }
    }
};
