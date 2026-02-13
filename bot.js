import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { loadPlugins } from './utils/pluginLoader.js';
import { loadCommands, loadEvents } from './utils/moduleLoader.js';
import { sendToAI } from './utils/ferro.js';
import { executePlugins, stripTechnicalLeaks } from './utils/pluginExecutor.js';
import { userPersonas } from './utils/store.js';
import { chatDb } from './utils/chatDb.js';
import agentMemory from './utils/agentMemory.js';
import intentRecognizer from './utils/intentRecognizer.js';
import toolSelector from './utils/toolSelector.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkReminders } from './plugins/reminder/plug.js';


import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatFerro } from "./utils/langchainAdapter.js";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.TELEGRAM_BOT_TOKEN) {
    logger.error('TELEGRAM_BOT_TOKEN is missing!');
    process.exit(1);
}

let systemConfig = {};
try {
    systemConfig = fs.readJsonSync(path.join(__dirname, 'config/systemInfo.json'));
} catch (e) {
    logger.error("Failed to load systemInfo.json");
}






const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
let plugins = [];

bot.catch((err, ctx) => {
    logger.error(`Telegraf Error: ${err}`);
    ctx.reply('An internal error occurred.');
});




function generateRequestId() {
    return Math.random().toString(36).substring(2, 8);
}


function isCasualConversation(text) {
    const normalized = text.toLowerCase().trim();




    const casualPatterns = [
        /^(hi|hello|hey|sup|yo|hiya|howdy|hola|bonjour|salaam|namaste)(\s|$|\!|\?)/,
        /^(what'?s?\s+up|wassup|whats\s+up)(\s|$|\!|\?)/,
        /^(how\s+(are|is)\s+(you|it)(\s+(doing|going|going on))?)(\s|$|\!|\?)/,
        /^(how's\s+it\s+going)(\s|$|\!|\?)/,
        /^(what\??)$/,
        /^(what'?s?\s+the\s+problem\??)(\s|$|\!|\?)/,
        /^\?+$/,
        /^(good\s+(morning|afternoon|evening|night))(\s|$|\!|\?)/,
        /^(thank(s| you)|thx|ty)(\s|$|\!|\?)/,
        /^(ok|okay|cool|nice|alright|got it)(\s|$|\!|\?)/,
        /^(bye|goodbye|see\s+ya|cya|later)(\s|$|\!|\?)/,
    ];

    return casualPatterns.some(pattern => pattern.test(normalized));
}





function generateToolsDescription(plugins) {
    let list = "";
    plugins.forEach(p => {
        const sys = p.system;
        list += `\n### ${sys.display_name || sys.name || p.meta.name}\n`;
        list += `Description: ${sys.description || p.meta.description}\n`;

        if (sys.functions) {
            Object.entries(sys.functions).forEach(([funcName, funcData]) => {
                const argTemplate = {};
                if (funcData.parameters?.properties) {
                    Object.keys(funcData.parameters.properties).forEach(key => {
                        argTemplate[key] = "...";
                    });
                }
                const argsStr = JSON.stringify(argTemplate);
                list += `- ${funcName}: {"plugin": "${sys.name}", "function": "${funcName}", "args": ${argsStr}}\n`;
                if (funcData.description) {
                    list += `  Purpose: ${funcData.description}\n`;
                }
            });
        }
    });
    return list;
}






const inactivityTimers = new Map();

async function handleProactiveReengagement(userId, ctx) {
    logger.info(`🕒 Proactive engagement triggered for user: ${userId}`);

    try {
        const history = await chatDb.getRecentContext(userId, 10);
        if (!history || history.length < 2) return;

        const historyText = history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n');

        const prompt = `You are a professional AI engagement assistant. \nAnalyze the following chat history and generate ONE short, curious follow-up question or helpful suggestion to re-engage the user. \n\nCHAT HISTORY:\n${historyText}\n\nRULES:\n1. Keep it under 20 words.\n2. Be specific to the history.\n3. Output ONLY the message text.`;

        const response = await sendToAI(prompt);


        const reengagementMsg = (typeof response === 'string' ? response : response?.text || '').trim();

        if (reengagementMsg) {
            await ctx.telegram.sendMessage(userId, reengagementMsg);
            await chatDb.saveMessage(userId, 'assistant', reengagementMsg);
            logger.success(`📤 Proactive message sent to ${userId}`);
        }
    } catch (error) {
        logger.error(`Proactive Error: ${error.message}`);
    }
}





function resetInactivityTimer(userId, ctx) {
    if (inactivityTimers.has(userId)) {
        clearTimeout(inactivityTimers.get(userId));
    }

    const timer = setTimeout(() => {
        handleProactiveReengagement(userId, ctx);
    }, 60 * 1000);

    inactivityTimers.set(userId, timer);
}




async function init() {
    await loadCommands(bot);
    await loadEvents(bot);
    plugins = await loadPlugins();
    logger.success(`Loaded ${plugins.length} plugins.`);


    intentRecognizer.loadFromPlugins(plugins);
    logger.success("Dynamic intent recognition initialized.");

    bot.on('text', async (ctx) => {
        if (ctx.message.text.startsWith('/')) return;

        const ownerUid = process.env.OWNER_UID;
        if (String(ctx.from.id) !== String(ownerUid)) {
            return ctx.reply("Access denied.");
        }

        const userId = ctx.from.id;
        const userText = ctx.message.text.trim();


        resetInactivityTimer(userId, ctx);
        const requestId = generateRequestId();
        const startTime = Date.now();

        const maxIterations = 10;
        logger.requestStart(requestId, userText, maxIterations);

        await chatDb.saveMessage(userId, 'user', ctx.message.text);


        if (userText.toLowerCase() === 'ping') {
            await ctx.reply('Pong! 🏓');
            await chatDb.saveMessage(userId, 'assistant', 'Pong! 🏓');
            logger.requestComplete(1, maxIterations, '0.1s', 'Quick Response');
            return;
        }

        let currentPersona = userPersonas[userId] || "Helpful Assistant";
        let identity = `Your name is ${systemConfig.agentName || 'AI'}. Owner: ${systemConfig.ownerName || 'User'}.`;




        /**
         * GENERATE ENHANCED DYNAMIC SYSTEM PROMPT (LangChain Version)
         */
        const getDynamicSystemPrompt = async (iteration = 1, currentStatus = "Thinking") => {
            const toolsDesc = generateToolsDescription(plugins);
            const memoryContext = agentMemory.getContextForPrompt(userId);

            const template = `You are {agentName}, a professional AI agent. 
CURRENT TIME: ${new Date().toLocaleString()}
OWNER: {ownerName}
PERSONA: {persona}
ITERATION: {iteration}

### 🛑 RULES
1. **ACTION FIRST**: If you need information or to perform a task, you MUST use a tool.
2. **ONE STEP AT A TIME**: Only perform one tool call per response.
3. **STRICT FORMAT**: You MUST output exactly in this format:
   [THOUGHT]
   Your reasoning here.
   
   [ACTION]
   {{"plugin": "...", "function": "...", "args": {{...}}}}
   
   -- OR --
   
   [THOUGHT]
   Task is complete or this is a greeting.
   
   [ANSWER]
   Your final message to the user here.

### 🛠️ TOOLS
{tools}

### ⏳ CONTEXT
{memory}

---
CRITICAL: You must use [ACTION] with a valid JSON block to run a tool. Do NOT use backticks around JSON. Never say "I will search", just do the [ACTION].`;

            const promptTemplate = ChatPromptTemplate.fromMessages([
                ["system", template],
            ]);

            const formatted = await promptTemplate.format({
                agentName: systemConfig.agentName || 'AI',
                ownerName: systemConfig.ownerName || 'User',
                persona: currentPersona,
                status: currentStatus,
                iteration: iteration,
                tools: toolsDesc,
                memory: memoryContext || "First iteration. Plan your first tool call or response."
            });

            return formatted;
        };






        let statusMsgId = null;
        const updateStatus = async (text) => {
            try {
                const formatted = `💎 **Agent Protocol**\n${text}`;
                if (!statusMsgId) {
                    const msg = await ctx.reply(formatted, { parse_mode: 'Markdown' });
                    statusMsgId = msg.message_id;
                } else {
                    await ctx.telegram.editMessageText(ctx.chat.id, statusMsgId, null, formatted, { parse_mode: 'Markdown' });
                }
            } catch (e) {

            }
        };




        const deleteStatus = async () => {
            if (statusMsgId) {
                try {
                    await ctx.telegram.deleteMessage(ctx.chat.id, statusMsgId);
                } catch (e) { }
                statusMsgId = null;
            }
        };






        const llm = new ChatFerro({});



        async function getAIResponse(iteration = 1, status = "Processing") {
            const context = await chatDb.getRecentContext(userId, 10);
            const dynamicSystem = await getDynamicSystemPrompt(iteration, status);


            const messages = [
                new SystemMessage(dynamicSystem)
            ];

            context.forEach(m => {




                if (m.role === 'user') {
                    messages.push(new HumanMessage(m.content));
                } else if (m.role === 'assistant') {
                    messages.push(new AIMessage(m.content));
                }
            });

            logger.debug(`Invoking LangChain with ${messages.length} messages`);

            const response = await llm.invoke(messages);
            const text = String(response.content || response.text || "");
            return { text };
        }







        let iteration = 0;
        try {
            // ============================================
            // AI-POWERED DECISION-MAKING
            // ============================================
            await updateStatus("🧠 *Analyzing request with AI...*");


            const recentContext = await chatDb.getRecentContext(userId, 5);
            const availableToolsMeta = plugins.map(p => ({
                name: p.system.name,
                description: p.system.description || p.meta.description
            }));





            const analysis = await toolSelector.analyzeWithAI(
                userText,
                { recentMessages: recentContext },
                availableToolsMeta
            );



            if (analysis.reasoning) {
                logger.info(`💭 AI Reasoning: ${analysis.reasoning}`);
            }
            if (analysis.contextReference) {
                logger.info(`🔗 Context Reference: ${analysis.contextReference}`);
            }



            if (analysis.strategy === 'CLARIFY' && analysis.clarifyingQuestion) {
                logger.info('⚠️ Request is ambiguous, asking for clarification');
                await ctx.reply(`❓ ${analysis.clarifyingQuestion}`);
                await chatDb.saveMessage(userId, 'assistant', analysis.clarifyingQuestion);
                await deleteStatus();
                logger.requestComplete(0, maxIterations, '0.2s', 'Clarification');
                return;
            }




            if (analysis.strategy === 'DIRECT_ANSWER' && analysis.directAnswer) {
                logger.success('✨ Providing direct answer (no tools needed)');
                await ctx.reply(analysis.directAnswer);
                await chatDb.saveMessage(userId, 'assistant', analysis.directAnswer);
                await deleteStatus();
                logger.requestComplete(0, maxIterations, '0.1s', 'Direct Answer');
                return;
            }




            if (analysis.strategy === 'CONVERSATIONAL' && !analysis.requiresTool) {
                logger.info('💬 Conversational response (no tools)');


            }







            // ============================================
            // AUTONOMOUS AGENT LOOP (AI-Enhanced)
            // ============================================
            // Adaptive iteration limit based on AI's complexity estimate
            const optimizedMaxIterations = Math.min(
                Math.max(analysis.estimatedIterations + 2, 5),
                maxIterations
            );



            logger.info(`🎯 Strategy: ${analysis.strategy}`);
            logger.info(`⏱️ Estimated iterations: ${analysis.estimatedIterations}`);
            logger.info(`🔄 Max iterations: ${optimizedMaxIterations}`);

            agentMemory.startSession(userId, userText);




            let currentIterationData = { thought: null, action: null, observation: null };
            let goalAchieved = false;

            await updateStatus("⏳ *Analyzing request...*");

            while (!goalAchieved && iteration < optimizedMaxIterations) {
                iteration++;
                await ctx.sendChatAction('typing');
                logger.info(`🤖 Agent Iteration ${iteration}/${optimizedMaxIterations}`);

                const aiResponse = await getAIResponse(iteration, "Reasoning...");
                let responseText = aiResponse.text;





                const thoughtMatch = responseText.match(/\[THOUGHT\]\s*([\s\S]*?)(?=\[ACTION\]|\[ANSWER\]|$)/i);
                const thought = thoughtMatch ? thoughtMatch[1].trim() : null;
                const actionMatch = responseText.match(/\[ACTION\]\s*([\s\S]*?)(?=\[ANSWER\]|$)/i);
                const actionText = actionMatch ? actionMatch[1].trim() : null;
                const answerMatch = responseText.match(/\[ANSWER\]\s*([\s\S]*)/i);
                const answerText = answerMatch ? answerMatch[1].trim() : null;



                const jsonMatch = responseText.match(/\{\s*"plugin"\s*:\s*"[^"]+"/);



                if (thought) {
                    logger.info(`💭 Thought: ${thought.substring(0, 100)}...`);
                    currentIterationData.thought = thought;
                }


                if (jsonMatch) {




                    const lastIter = agentMemory.getSession(userId)?.iterations.slice(-1)[0];
                    if (lastIter && lastIter.action === actionText && lastIter.observation && !lastIter.observation.includes("ERROR")) {
                        logger.warn("⚠️ AI tried to repeat the exact same successful action. Forcing completion.");
                        goalAchieved = true;
                    } else {
                        const executionData = await executePlugins(responseText, plugins, ctx);
                        if (executionData.status === "success") {
                            const results = [];
                            for (const res of executionData.results) {
                                const pName = res.pluginName || "Plugin";
                                await updateStatus(`📦 *Running ${pName}...*`);
                                let observation = res.error ? `ERROR: ${res.error}` : res.result;
                                if (typeof observation === 'object') {
                                    try { observation = JSON.stringify(observation); } catch (e) { observation = String(observation); }
                                }
                                results.push(observation);
                            }
                            currentIterationData.action = actionText || responseText.match(/\{[\s\S]*?\}/)?.[0] || "Unknown";
                            currentIterationData.observation = results.join('\n');
                            agentMemory.addIteration(userId, currentIterationData);
                            currentIterationData = { thought: null, action: null, observation: null };
                            logger.success(`📊 Observation received`);






                            if (!answerText) {
                                await new Promise(r => setTimeout(r, 800));
                                continue;
                            }
                        }
                    }
                }



                const isFinishing = !!answerText || goalAchieved || (!jsonMatch && iteration > 1);
                if (isFinishing) {
                    logger.success('✅ Agent decided to finish');
                    goalAchieved = true;

                    let finalAnswer = answerText || responseText;
                    const cleanAnswer = stripTechnicalLeaks(finalAnswer);

                    if (cleanAnswer) {
                        await deleteStatus();
                        await ctx.reply(cleanAnswer);
                        await chatDb.saveMessage(userId, 'assistant', cleanAnswer);
                    } else {
                        const fallbackText = "Task complete. What's next?";
                        await deleteStatus();
                        await ctx.reply(fallbackText);
                        await chatDb.saveMessage(userId, 'assistant', fallbackText);
                    }

                    agentMemory.addIteration(userId, { thought: "Task complete", observation: "Final response sent to user" });
                    agentMemory.endSession(userId, cleanAnswer || "Completed");
                    break;
                }





                if (iteration === 1 && !jsonMatch) {
                    const cleanAnswer = stripTechnicalLeaks(responseText);
                    if (cleanAnswer) {
                        await deleteStatus();
                        await ctx.reply(cleanAnswer);
                        await chatDb.saveMessage(userId, 'assistant', cleanAnswer);
                        goalAchieved = true;
                        agentMemory.endSession(userId, cleanAnswer);
                        break;
                    }
                }
            }

            if (!goalAchieved) {
                await deleteStatus();
                const fallback = "I've reached my limit for this task. Could you please rephrase or be more specific?";
                await ctx.reply(fallback);
                await chatDb.saveMessage(userId, 'assistant', fallback);
            }

            const stats = agentMemory.getStats(userId);
            logger.requestComplete(iteration, optimizedMaxIterations, `${((Date.now() - startTime) / 1000).toFixed(1)}s`, `${stats?.toolsUsed?.length || 0} tools used`);
            agentMemory.clearSession(userId);

        } catch (error) {
            logger.error(`AI Error: ${error.message}`);
            const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
            logger.requestComplete(iteration, iteration, duration, 'Error');
            await ctx.reply("I encountered an error.");
            agentMemory.clearSession(userId);
        }
    });





    try {
        await bot.launch();
        logger.success(`Agent ${systemConfig.agentName} is operational!`);




        setInterval(() => checkReminders(bot), 30000);
        logger.info('Background reminder checker started (30s interval)');
    } catch (error) {
        logger.error(`Launch Failure: ${error.message}`);
    }
}

init();
