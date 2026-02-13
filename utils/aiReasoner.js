import { sendToAI } from './ferro.js';
import { logger } from './logger.js';

class AIReasoner {
    constructor() {
        this.reasoningCache = new Map();
        this.cacheTimeout = 60000;
    }


    async analyzeIntent(userMessage, context = {}) {
        const cacheKey = `intent_${userMessage}_${JSON.stringify(context.recentMessages || [])}`;




        if (this.reasoningCache.has(cacheKey)) {
            const cached = this.reasoningCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                logger.debug('Using cached intent analysis');
                return cached.result;
            }
        }

        const systemPrompt = `You are an expert at understanding user intent. Analyze the user's message and provide a structured analysis.

CRITICAL: Respond ONLY with valid JSON. No markdown, no explanations outside JSON.

Required JSON format:
{
  "primary_intent": "SEARCH_WEB|CREATE_CONTENT|SAVE_INFO|EXECUTE_CODE|GET_INFO|CASUAL_CHAT|AMBIGUOUS",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why you classified this way",
  "is_ambiguous": true/false,
  "ambiguity_reason": "What is unclear (if ambiguous)",
  "clarifying_question": "Question to ask user (if ambiguous)",
  "requires_tools": true/false,
  "suggested_tools": ["tool1", "tool2"],
  "is_multi_step": true/false,
  "context_dependent": true/false,
  "context_reference": "What from context is being referenced (if applicable)"
}`;



        const userPrompt = `User message: "${userMessage}"

Recent context (last 3 messages):
${context.recentMessages?.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n') || 'No context'}

Analyze this message and respond with the JSON structure.`;

        try {
            const response = await sendToAI(userPrompt, systemPrompt);


            let analysis;
            try {

                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                logger.warn(`Failed to parse AI reasoning response: ${parseError.message}`);



                return this._fallbackAnalysis(userMessage);
            }




            const result = {
                intent: analysis.primary_intent || 'UNKNOWN',
                confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
                reasoning: analysis.reasoning || 'No reasoning provided',
                isAmbiguous: analysis.is_ambiguous || false,
                ambiguityReason: analysis.ambiguity_reason || null,
                clarifyingQuestion: analysis.clarifying_question || null,
                requiresTools: analysis.requires_tools || false,
                suggestedTools: analysis.suggested_tools || [],
                isMultiStep: analysis.is_multi_step || false,
                contextDependent: analysis.context_dependent || false,
                contextReference: analysis.context_reference || null
            };





            this.reasoningCache.set(cacheKey, {
                result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            logger.error(`AI reasoning failed: ${error.message}`);
            return this._fallbackAnalysis(userMessage);
        }
    }

    /**
     * Plan strategy for achieving user's goal
     * @param {Object} intent - Intent analysis result
     * @param {Array} availableTools - List of available tools
     * @returns {Promise<Object>} Strategic plan
     */
    async planStrategy(intent, availableTools = []) {
        if (!intent.requiresTools || intent.isAmbiguous) {
            return {
                strategy: intent.isAmbiguous ? 'CLARIFY' : 'DIRECT_RESPONSE',
                steps: [],
                estimatedIterations: 0,
                reasoning: intent.isAmbiguous ? 'Need clarification first' : 'No tools needed'
            };
        }

        const toolsList = availableTools.map(t => `- ${t.name}: ${t.description}`).join('\n');

        const systemPrompt = `You are a strategic planner for an AI agent. Given a user intent and available tools, create an optimal execution plan.

CRITICAL: Respond ONLY with valid JSON.

Required JSON format:
{
  "strategy": "SINGLE_TOOL|MULTI_TOOL|SEQUENTIAL|PARALLEL",
  "steps": [
    {
      "step_number": 1,
      "action": "tool_name.function_name",
      "purpose": "Why this step",
      "depends_on": [previous step numbers] or []
    }
  ],
  "estimated_iterations": 1-10,
  "reasoning": "Why this plan is optimal",
  "alternative_approaches": ["Other possible approaches"],
  "risks": ["Potential issues to watch for"]
}`;

        const userPrompt = `Intent: ${intent.intent}
Confidence: ${intent.confidence}
Reasoning: ${intent.reasoning}
Suggested tools: ${intent.suggestedTools.join(', ')}
Is multi-step: ${intent.isMultiStep}

Available tools:
${toolsList}

Create an optimal execution plan.`;

        try {
            const response = await sendToAI(userPrompt, systemPrompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const plan = JSON.parse(jsonMatch[0]);
                return {
                    strategy: plan.strategy || 'SINGLE_TOOL',
                    steps: plan.steps || [],
                    estimatedIterations: plan.estimated_iterations || 2,
                    reasoning: plan.reasoning || 'Default plan',
                    alternatives: plan.alternative_approaches || [],
                    risks: plan.risks || []
                };
            }
        } catch (error) {
            logger.error(`Strategy planning failed: ${error.message}`);
        }





        return {
            strategy: intent.isMultiStep ? 'MULTI_TOOL' : 'SINGLE_TOOL',
            steps: intent.suggestedTools.map((tool, idx) => ({
                step_number: idx + 1,
                action: tool,
                purpose: 'Execute tool',
                depends_on: idx > 0 ? [idx] : []
            })),
            estimatedIterations: intent.suggestedTools.length + 1,
            reasoning: 'Fallback sequential plan',
            alternatives: [],
            risks: []
        };
    }




    /**
     * Evaluate how well a tool fits the current intent
     * @param {Object} tool - Tool metadata
     * @param {Object} intent - Intent analysis
     * @param {Object} context - Current context
     * @returns {Promise<number>} Relevance score 0-1
     */

    async evaluateToolFit(tool, intent, context = {}) {

        let score = 0.5;


        if (intent.suggestedTools.includes(tool.name)) {
            score += 0.3;
        }


        const intentToolMap = {
            'SEARCH_WEB': ['web_search', 'web_extractor'],
            'CREATE_CONTENT': ['web_builder', 'code_exec'],
            'SAVE_INFO': ['memory', 'todo'],
            'GET_INFO': ['system_stats', 'history_search'],
            'IMAGE_SEARCH': ['image_search', 'pinterest_search'],
            'VIDEO_SUMMARY': ['youtube_summary']
        };

        if (intentToolMap[intent.intent]?.includes(tool.name)) {
            score += 0.2;
        }

        return Math.min(1.0, score);
    }



    /**
     * detect if user message is ambiguous and needs clarification
     * @param {string} userMessage - User's message
     * @returns {Promise<Object>} Ambiguity detection result
     */

    async detectAmbiguity(userMessage) {

        const ambiguousPatterns = [
            /\b(it|that|this|them|those)\b/i,
            /^(do|can you|please)\s+(it|that|this)$/i,
            /\b(more|again|same)\b.*(?!about|for|of)/i
        ];

        const hasAmbiguousPronouns = ambiguousPatterns.some(p => p.test(userMessage));
        const isTooShort = userMessage.trim().split(/\s+/).length < 3;

        if (!hasAmbiguousPronouns && !isTooShort) {
            return {
                isAmbiguous: false,
                confidence: 0.9,
                reason: null,
                suggestion: null
            };
        }




        const systemPrompt = `Determine if this user message is ambiguous and needs clarification.

Respond ONLY with JSON:
{
  "is_ambiguous": true/false,
  "confidence": 0.0-1.0,
  "reason": "What is unclear",
  "suggested_clarification": "Question to ask user"
}`;


        try {
            const response = await sendToAI(`Message: "${userMessage}"`, systemPrompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    isAmbiguous: result.is_ambiguous || false,
                    confidence: result.confidence || 0.5,
                    reason: result.reason || null,
                    suggestion: result.suggested_clarification || null
                };
            }


        } catch (error) {
            logger.debug(`Ambiguity detection failed: ${error.message}`);
        }


        return {
            isAmbiguous: hasAmbiguousPronouns || isTooShort,
            confidence: 0.6,
            reason: hasAmbiguousPronouns ? 'Contains ambiguous pronouns' : 'Message too short',
            suggestion: 'Could you provide more details?'
        };
    }





    _fallbackAnalysis(userMessage) {
        const lower = userMessage.toLowerCase();



        // simple keyword matching as fallback
        if (/search|find|look|google/i.test(lower)) {
            return {
                intent: 'SEARCH_WEB',
                confidence: 0.6,
                reasoning: 'Keyword-based fallback detection',
                isAmbiguous: false,
                requiresTools: true,
                suggestedTools: ['web_search'],
                isMultiStep: false
            };
        }





        return {
            intent: 'UNKNOWN',
            confidence: 0.3,
            reasoning: 'Fallback analysis - AI unavailable',
            isAmbiguous: true,
            requiresTools: false,
            suggestedTools: [],
            isMultiStep: false
        };
    }


    clearCache() {
        this.reasoningCache.clear();
    }
}




const aiReasoner = new AIReasoner();
export default aiReasoner;
