import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { sendToAI } from "../../utils/ferro.js";
import { logger } from "../../utils/logger.js";
import { fileURLToPath } from "url";

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempBuildDir = path.join(__dirname, "../../temp_builds");

/**
 * enhanced prompting: expand the user's idea into a technical spec
 */
async function enhancePrompt(userPrompt) {
    const systemPrompt = `You are a Senior Web Architect and UI/UX Designer. Expand the following user request into a high-end technical specification.
Focus on visual excellence:
1. Define a sophisticated color palette (e.g., Deep Graphite & Electric Blue, or Cream & Obsidian).
2. Use modern layout theories (Glassmorphism, Bento Grid, or Hyper-Minimalism).
3. Specify typography (e.g., Inter, Montserrat, or Space Grotesque via Google Fonts).
4. Outline specific interactive elements (hover states, parallax, smooth transitions).
5. Ensure a professional structure with assets/css and assets/js.
Output ONLY the tech spec text.`;

    return await sendToAI(userPrompt, systemPrompt);
}





function attemptRepair(text) {
    if (!text) return null;



    let start = text.indexOf('{');
    let end = text.lastIndexOf('}');

    if (start === -1) return null;


    let jsonStr = text.substring(start, (end === -1 || end < start) ? text.length : end + 1);






    jsonStr = jsonStr
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")


        .trim();

    const tryParse = (str) => {
        try {
            return JSON.parse(str);
        } catch (e) {
            try {

                const noTrailing = str.replace(/,\s*([\}\]])/g, '$1');
                return JSON.parse(noTrailing);
            } catch (e2) {
                return null;
            }
        }
    };





    const balanceJson = (str) => {
        let balanced = str;


        let quoteCount = 0;
        let escaped = false;
        for (let i = 0; i < balanced.length; i++) {
            if (balanced[i] === '\\' && !escaped) {
                escaped = true;
                continue;
            }
            if (balanced[i] === '"' && !escaped) {
                quoteCount++;
            }
            escaped = false;
        }
        if (quoteCount % 2 !== 0) balanced += '"';


        const stack = [];
        for (let char of balanced) {
            if (char === '{') stack.push('}');
            else if (char === '[') stack.push(']');
            else if (char === '}' || char === ']') {
                if (stack.length > 0 && stack[stack.length - 1] === char) {
                    stack.pop();
                }
            }
        }
        while (stack.length > 0) {
            balanced += stack.pop();
        }
        return balanced;
    };


    let result = tryParse(jsonStr);
    if (result) return result;


    let balanced = balanceJson(jsonStr);
    result = tryParse(balanced);
    if (result) return result;

    return null;
}





function validateProjectData(data) {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.folder_name !== 'string') return false;
    if (!Array.isArray(data.files) || data.files.length === 0) return false;

    return data.files.every(f => typeof f.path === 'string' && typeof f.content === 'string');
}







function getEmergencyFallback(prompt) {
    return {
        folder_name: "emergency_website_" + Date.now(),
        files: [
            {
                path: "index.html",
                content: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Generated</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #0f172a; color: white; }
        .glass { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-8">
    <div class="max-w-2xl w-full glass p-12 rounded-3xl text-center">
        <h1 class="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Project Generated</h1>
        <p class="text-slate-400 text-lg mb-8">Ferro encountered high token pressure during generation, so I've built this professional baseline for you based on: "${prompt}"</p>
        <div class="p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-left mb-8">
            <h2 class="text-blue-400 font-bold mb-2">Technical Note:</h2>
            <p class="text-sm text-slate-300">The complex generation attempt was truncated. This recovery file ensures you have a working structure to start from. Try a more specific, shorter prompt for a detailed multi-file build.</p>
        </div>
        <button class="px-8 py-4 bg-blue-600 hover:bg-blue-700 transition rounded-xl font-bold">Install Now</button>
    </div>
</body>
</html>`
            }
        ]
    };
}







async function generateFiles(spec, retry = false) {
    const systemPrompt = retry
        ? `You are a Lead Frontend Engineer. Generate a MINIMAL but PREMIUM static website project.
           CRITICAL: Output ONLY raw JSON. No markdown, no text.
           REQUIRED FORMAT: { "folder_name": "...", "files": [{ "path": "index.html", "content": "..." }] }
           Embed all CSS/JS inside index.html.`
        : `You are a Lead Frontend Engineer. Based on the technical specification, generate a premium static website.
STRICT RULES:
1. Use Tailwind CSS via CDN in index.html.
2. Combine Tailwind with high-end CUSTOM CSS in assets/css/style.css for complex animations, gradients, and glassmorphism.
3. Use Google Fonts for typography.
4. Code must be strictly formatted, commented, and professional.
5. All assets must be linked correctly.
6. Output EXACTLY this JSON format (no markdown blocks, no extra text):

{
  "folder_name": "project_name_safe",
  "files": [
    { "path": "index.html", "content": "..." },
    { "path": "assets/css/style.css", "content": "..." },
    { "path": "assets/js/main.js", "content": "..." }
  ]
}`;








    try {
        const response = await sendToAI(spec, systemPrompt);
        const data = attemptRepair(response);

        if (validateProjectData(data)) {
            return data;
        }

        if (!retry) {
            logger.warn("Web Builder: Validation failed. Attempting COMPACT RETRY...");
            return await generateFiles(spec, true);
        }

        logger.error("Web Builder: All generation attempts failed. Falling back to emergency template.");
        return getEmergencyFallback(spec.substring(0, 100) + "...");
    } catch (error) {
        if (!retry) {
            logger.warn(`Web Builder Error: ${error.message}. Attempting compact retry...`);
            return await generateFiles(spec, true);
        }
        return getEmergencyFallback(spec.substring(0, 100) + "...");
    }
}





export default {
    build_site: async (ctx, args) => {
        const { prompt } = args;
        if (!prompt) return "Please provide a description for the website.";

        try {
            logger.info("🚀 Web Builder: Phase 1 - Enhancing Prompt...");
            const enhancedSpec = await enhancePrompt(prompt);

            logger.info("🚀 Web Builder: Phase 2 - Generating Code Files...");
            const projectData = await generateFiles(enhancedSpec);

            const projectName = projectData.folder_name || "web_project_" + Date.now();
            const projectDir = path.join(tempBuildDir, projectName);
            const zipFile = `${projectDir}.zip`;

            logger.info(`🚀 Web Builder: Phase 3 - Building Directory Structure: ${projectName}`);






            await fs.ensureDir(projectDir);


            for (const file of projectData.files) {
                const filePath = path.join(projectDir, file.path);
                await fs.ensureDir(path.dirname(filePath));
                await fs.writeFile(filePath, file.content);
            }




            logger.info("🚀 Web Builder: Phase 4 - Archiving Project...");

            const { stdout, stderr } = await execPromise(`cd "${tempBuildDir}" && zip -r "${projectName}.zip" "${projectName}"`);

            if (stderr && !stderr.includes("adding:")) {
                logger.error(`Zip Error: ${stderr}`);
            }

            logger.success(`🚀 Web Builder: Site Built! Sending ${projectName}.zip`);

            await ctx.reply(`✅ Website built successfully: **${projectName}**\n\nI've generated the structure, assets, and optimized the code. Downloading your project now...`, { parse_mode: 'Markdown' });

            await ctx.replyWithDocument({ source: zipFile, filename: `${projectName}.zip` });






            setTimeout(async () => {
                await fs.remove(projectDir);
                await fs.remove(zipFile);
                logger.debug(`Cleaned up build for ${projectName}`);
            }, 5000);

            return `Website build completed: ${projectName}`;
        } catch (error) {
            logger.error(`Web Builder Error: ${error.message}`);
            return `❌ Failed to build website: ${error.message}`;
        }
    }
};
