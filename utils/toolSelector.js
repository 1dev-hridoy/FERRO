/**
 * Smart Tool Selector
 */

import intentRecognizer from './intentRecognizer.js';
import aiReasoner from './aiReasoner.js';
import { logger } from './logger.js';

class ToolSelector {
    constructor() {

        this.directAnswers = {
            IDENTITY: (systemConfig) => {
                return {
                    shouldAnswer: true,
                    answer: `You are ${systemConfig.ownerName || 'my owner'}, and I am ${systemConfig.agentName || 'your AI assistant'}.`
                };
            }
        };
    }




    /**
     * @param {string} userMessage - User's message
     * @param {Object} context - Conversation context
     * @param {Array} availableTools - Available tools
     * @returns {Promise<Object>} AI-powered analysis
     */
    async analyzeWithAI(userMessage, context = {}, availableTools = []) {
        logger.debug('🧠 Starting AI-powered analysis...');


        const ambiguityCheck = await aiReasoner.detectAmbiguity(userMessage);
        if (ambiguityCheck.isAmbiguous && ambiguityCheck.confidence > 0.7) {
            logger.info(`⚠️ Ambiguity detected: ${ambiguityCheck.reason}`);
            return {
                intent: 'AMBIGUOUS',
                confidence: ambiguityCheck.confidence,
                strategy: 'CLARIFY',
                requiresTool: false,
                tools: null,
                directAnswer: null,
                clarifyingQuestion: ambiguityCheck.suggestion,
                reasoning: ambiguityCheck.reason,
                estimatedIterations: 0
            };
        }


        const intentAnalysis = await aiReasoner.analyzeIntent(userMessage, context);
        logger.info(`💭 AI Reasoning: ${intentAnalysis.reasoning}`);
        logger.info(`🎯 Intent: ${intentAnalysis.intent} (${(intentAnalysis.confidence * 100).toFixed(0)}% confidence)`);




        if (intentAnalysis.isAmbiguous) {
            return {
                intent: intentAnalysis.intent,
                confidence: intentAnalysis.confidence,
                strategy: 'CLARIFY',
                requiresTool: false,
                tools: null,
                directAnswer: null,
                clarifyingQuestion: intentAnalysis.clarifyingQuestion,
                reasoning: intentAnalysis.reasoning,
                estimatedIterations: 0
            };
        }




        if (!intentAnalysis.requiresTools) {
            return {
                intent: intentAnalysis.intent,
                confidence: intentAnalysis.confidence,
                strategy: 'CONVERSATIONAL',
                requiresTool: false,
                tools: null,
                directAnswer: null,
                reasoning: intentAnalysis.reasoning,
                estimatedIterations: 0
            };
        }




        const plan = await aiReasoner.planStrategy(intentAnalysis, availableTools);
        logger.info(`📋 Strategy: ${plan.strategy} (${plan.estimatedIterations} iterations)`);
        logger.debug(`🔧 Plan reasoning: ${plan.reasoning}`);

        return {
            intent: intentAnalysis.intent,
            confidence: intentAnalysis.confidence,
            strategy: plan.strategy,
            requiresTool: true,
            tools: intentAnalysis.suggestedTools,
            directAnswer: null,
            reasoning: intentAnalysis.reasoning,
            plan: plan,
            estimatedIterations: plan.estimatedIterations,
            contextDependent: intentAnalysis.contextDependent,
            contextReference: intentAnalysis.contextReference
        };
    }




    /**
     * plan tool chain for multi-step tasks
     * @param {Object} analysis - AI analysis result
     * @returns {Array} Ordered list of tool calls
     */
    planToolChain(analysis) {
        if (!analysis.plan || !analysis.plan.steps) {
            return [];
        }

        return analysis.plan.steps.map(step => ({
            stepNumber: step.step_number,
            action: step.action,
            purpose: step.purpose,
            dependencies: step.depends_on || []
        }));
    }






    analyze(userMessage, systemConfig = {}) {

        const intent = intentRecognizer.classify(userMessage);


        if (this.directAnswers[intent.intent]) {
            const directAnswer = this.directAnswers[intent.intent](systemConfig);
            return {
                intent: intent.intent,
                confidence: intent.confidence,
                strategy: 'DIRECT_ANSWER',
                requiresTool: false,
                tools: null,
                directAnswer: directAnswer.answer,
                estimatedIterations: 0
            };
        }



        if (!intent.requiresTool || !intent.tools) {
            return {
                intent: intent.intent,
                confidence: intent.confidence,
                strategy: 'CONVERSATIONAL',
                requiresTool: false,
                tools: null,
                directAnswer: null,
                estimatedIterations: 0
            };
        }


        const isMultiTool = this.detectMultiToolTask(userMessage);

        return {
            intent: intent.intent,
            confidence: intent.confidence,
            strategy: isMultiTool ? 'MULTI_TOOL' : 'SINGLE_TOOL',
            requiresTool: true,
            tools: intent.tools,
            directAnswer: null,
            estimatedIterations: isMultiTool ? intent.tools.length + 1 : 2
        };
    }




    /**
     * detect if task requires multiple tools
     * @param {string} text - User message
     * @returns {boolean} True if multi-tool task
     */
    detectMultiToolTask(text) {
        const multiToolIndicators = [
            /\b(and|then|after|also)\b/i,
            /\b(save|store|remember)\s+(it|that|this|the\s+result)\b/i,
            /\b(create|add)\s+(task|todo|reminder)\b/i
        ];

        return multiToolIndicators.some(pattern => pattern.test(text));
    }




    /**
     * get suggested prompt enhancement based on intent
     * @param {string} intent - Detected intent
     * @param {string} userMessage - Original message
     * @returns {string} Enhanced prompt guidance
     */
    getPromptGuidance(intent, userMessage) {
        const guidance = {
            SEARCH_WEB: `User wants to search the web. Use web_search immediately with query: "${this.extractSearchQuery(userMessage)}"`,
            SYSTEM_INFO: `User wants system information. Use system_stats immediately.`,
            FILE_OPS: `User wants file operations. Use file_ops with appropriate function.`,
            CODE_EXEC: `User wants to execute code. Use code_exec carefully.`,
            TODO: `User wants todo management. Use todo plugin.`,
            MEMORY: `User wants to save/retrieve information. Use memory plugin.`,
            SEARCH_HISTORY: `User wants to search conversation history. Use history_search.`
        };

        return guidance[intent] || 'Analyze the request and choose appropriate tool.';
    }







    /**
     * extract search query from user message
     * @param {string} text - User message
     * @returns {string} Extracted query
     */
    extractSearchQuery(text) {




        let query = text
            .replace(/^(search|find|look\s*up|google|bing)\s+(for|about)?\s*/i, '')
            .replace(/^(what|who|where)\s+is\s+/i, '')
            .trim();

        return query || text;
    }
}




const toolSelector = new ToolSelector();
export default toolSelector;
