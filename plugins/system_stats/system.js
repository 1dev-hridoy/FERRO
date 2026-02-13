export default {
    name: "system_stats",
    display_name: "System Stats",
    priority: 9,
    intent_patterns: [
        /\b(system\s+)?(stats|statistics|status)\b/i,
        /\b(cpu|memory|ram|disk|storage)\s*(usage|info|stats)?\b/i,
        /\b(how\s+(much|many)|check)\s+(cpu|memory|ram|disk)\b/i,
        /\b(performance|resources)\b/i
    ],
    description: "Get comprehensive system statistics and health information",
    functions: {
        get_stats: {
            description: "Get current system statistics including CPU, memory, disk, and process info",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    instructions: "To use this tool, output: {\"plugin\": \"system_stats\", \"function\": \"get_stats\", \"args\": {}}"
};
