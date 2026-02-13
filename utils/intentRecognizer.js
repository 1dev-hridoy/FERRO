class IntentRecognizer {
    constructor() {



        this.patterns = {};
    }


    registerIntent(name, data) {
        if (!this.patterns[name]) {
            this.patterns[name] = {
                patterns: [],
                priority: data.priority || 5,
                requiresTool: data.requiresTool || false,
                tools: data.tools || []
            };
        }




        // add unique patterns
        if (data.patterns) {
            data.patterns.forEach(p => {
                if (!this.patterns[name].patterns.some(existing => existing.toString() === p.toString())) {
                    this.patterns[name].patterns.push(p);
                }
            });
        }
    }





    /**
     * load intent patterns from plugin metadata
     * @param {Array} plugins - List of loaded plugins
     */
    loadFromPlugins(plugins) {
        plugins.forEach(plugin => {
            const sys = plugin.system;
            if (sys.intent_patterns) {
                this.registerIntent(sys.name.toUpperCase(), {
                    patterns: sys.intent_patterns,
                    priority: sys.priority || 8,
                    requiresTool: true,
                    tools: [sys.name]
                });
            }
        });


        this.registerIntent('SEARCH_WEB', {
            patterns: [/\b(search|find|google|bing)\b/i],
            priority: 8,
            requiresTool: true,
            tools: ['web_search']
        });





        this.registerIntent('CASUAL_CHAT', {
            patterns: [
                /\b(hi|hello|hey|hlo|greeting|yo|sup|howdy)\b/i,
                /\b(how\s+are\s+you|how\s+is\s+it\s+going|what's\s+up)\b/i,
                /\b(bye|goodbye|see\s+ya|quit|terminate|nope|no|done)\b/i,
                /\b(thanks?|thank\s+you|appreciation)\b/i
            ],
            priority: 4,
            requiresTool: false
        });
    }





    /**
     * classify user intent
     * @param {string} text - User message
     * @returns {Object} Intent classification result
     */
    classify(text) {
        const normalizedText = text.toLowerCase().trim();
        const matches = [];




        for (const [intentName, intentData] of Object.entries(this.patterns)) {
            for (const pattern of intentData.patterns) {
                if (pattern.test(normalizedText)) {
                    matches.push({
                        intent: intentName,
                        priority: intentData.priority,
                        requiresTool: intentData.requiresTool,
                        tools: intentData.tools || null,
                        confidence: this.calculateConfidence(normalizedText, pattern)
                    });
                    break;
                }
            }
        }




        // sort by priority and confidence
        matches.sort((a, b) => {
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }
            return b.confidence - a.confidence;
        });




        // return best match or UNKNOWN
        if (matches.length > 0) {
            return matches[0];
        }

        return {
            intent: 'UNKNOWN',
            priority: 0,
            requiresTool: false,
            tools: null,
            confidence: 0
        };
    }






    calculateConfidence(text, pattern) {
        const match = text.match(pattern);
        if (!match) return 0;


        const matchLength = match[0].length;
        const textLength = text.length;


        const coverage = matchLength / textLength;




        const positionBoost = match.index === 0 ? 0.2 : 0;

        return Math.min(coverage + positionBoost, 1.0);
    }





    /**
     * extract keywords from text
     * @param {string} text - User message
     * @returns {Array} Keywords
     */
    extractKeywords(text) {



        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'do', 'does'];
        const words = text.toLowerCase().split(/\s+/);

        return words.filter(word =>
            word.length > 2 &&
            !stopWords.includes(word) &&
            /^[a-z]+$/.test(word)
        );
    }
}






const intentRecognizer = new IntentRecognizer();
export default intentRecognizer;
