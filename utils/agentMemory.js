class AgentMemory {
    constructor() {
        this.sessions = new Map(); 
    }

    /**
     * initialize a new agent session
     */
    startSession(userId, userGoal) {
        this.sessions.set(userId, {
            goal: userGoal,
            iterations: [],
            startTime: Date.now(),
            status: 'active'
        });
    }



    addIteration(userId, iteration) {
        const session = this.sessions.get(userId);
        if (!session) return;

        session.iterations.push({
            ...iteration,
            timestamp: Date.now()
        });
    }


    getSession(userId) {
        return this.sessions.get(userId);
    }




    getContextForPrompt(userId) {
        const session = this.sessions.get(userId);
        if (!session || session.iterations.length === 0) {
            return '';
        }

        let context = `\n**AGENT CONTEXT** (Current Task Progress):\n`;
        context += `Goal: ${session.goal}\n\n`;

        session.iterations.forEach((iter, idx) => {
            context += `Iteration ${idx + 1}:\n`;
            if (iter.thought) context += `  Thought: ${iter.thought}\n`;
            if (iter.action) context += `  Action: ${iter.action}\n`;
            if (iter.observation) {
                const obs = iter.observation.length > 200
                    ? iter.observation.substring(0, 200) + '...'
                    : iter.observation;
                context += `  Observation: ${obs}\n`;
            }
            context += '\n';
        });

        return context;
    }



    /**
     * end the current session
     */
    endSession(userId, finalAnswer) {
        const session = this.sessions.get(userId);
        if (!session) return;

        session.status = 'completed';
        session.finalAnswer = finalAnswer;
        session.endTime = Date.now();
        session.duration = session.endTime - session.startTime;
    }



    /**
     * clear session (for cleanup)
     */
    clearSession(userId) {
        this.sessions.delete(userId);
    }




    getStats(userId) {
        const session = this.sessions.get(userId);
        if (!session) return null;

        return {
            iterations: session.iterations.length,
            duration: Date.now() - session.startTime,
            status: session.status,
            toolsUsed: session.iterations
                .filter(i => i.action && i.action !== 'Finish')
                .map(i => i.action)
        };
    }
}

const agentMemory = new AgentMemory();

export default agentMemory;
