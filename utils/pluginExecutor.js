import { logger } from './logger.js';

export async function executePlugins(responseText, plugins, ctx) {
    const findings = [];




    let startIndex = responseText.indexOf('{');
    while (startIndex !== -1) {
        let braceCount = 0;
        let foundEnd = -1;
        let inString = false;
        let escape = false;

        for (let i = startIndex; i < responseText.length; i++) {
            const char = responseText[i];

            if (char === '"' && !escape) {
                inString = !inString;
            }

            if (!inString) {
                if (char === '{') braceCount++;
                else if (char === '}') braceCount--;
            }

            escape = char === '\\' && !escape;

            if (braceCount === 0) {
                foundEnd = i;
                break;
            }
        }




        if (foundEnd !== -1) {
            const potentialJson = responseText.substring(startIndex, foundEnd + 1);


            if (potentialJson.includes('"plugin"') || potentialJson.includes('"function"')) {
                findings.push({ json: potentialJson, start: startIndex, end: foundEnd });
            }
            startIndex = responseText.indexOf('{', foundEnd + 1);
        } else {
            startIndex = responseText.indexOf('{', startIndex + 1);
        }
    }

    if (findings.length === 0) {
        return { status: "not_found", count: 0 };
    }

    const results = [];




    for (const finding of findings) {





        try {

            const cleanedJson = finding.json
                .replace(/[\u201C\u201D]/g, '"')
                .replace(/,\s*\}/g, '}')
                .replace(/,\s*\]/g, ']')
                .replace(/\\n/g, ' ')
                .replace(/\n/g, ' ')
                .trim();

            const pluginCall = JSON.parse(cleanedJson);

            if (!pluginCall.plugin) continue;





            const plugin = plugins.find(p =>
                p.meta.name?.toLowerCase() === pluginCall.plugin.toLowerCase() ||
                p.meta.slug?.toLowerCase() === pluginCall.plugin.toLowerCase() ||
                p.system.name?.toLowerCase() === pluginCall.plugin.toLowerCase()
            );

            if (!plugin) {
                logger.error(`Plugin "${pluginCall.plugin}" not found`);
                results.push({
                    call: `${pluginCall.plugin}.${pluginCall.function || 'unknown'}`,
                    error: `Plugin "${pluginCall.plugin}" not found.`
                });
                continue;
            }






            let functionName = pluginCall.function;

            if (!functionName && plugin.plug) {
                const funcs = Object.keys(plugin.plug);
                if (funcs.length === 1) {
                    functionName = funcs[0];
                }
            }

            if (!functionName || !plugin.plug[functionName]) {
                const available = Object.keys(plugin.plug || {}).join(', ');
                logger.error(`Function "${functionName}" not found in ${pluginCall.plugin}. Available: ${available}`);
                results.push({
                    call: `${pluginCall.plugin}.${functionName || 'unknown'}`,
                    error: `Function "${functionName}" not found. Available: ${available}`
                });
                continue;
            }

            logger.toolExecution(
                `${pluginCall.plugin}.${functionName}`,
                pluginCall.args || {},
                'Executing...'
            );





            try {

                let finalArgs = pluginCall.args || {};
                const funcDef = plugin.system.functions?.[functionName];

                if (Array.isArray(finalArgs) && funcDef?.parameters?.properties) {
                    const keys = Object.keys(funcDef.parameters.properties);
                    const objArgs = {};
                    finalArgs.forEach((val, idx) => {
                        if (keys[idx]) objArgs[keys[idx]] = val;
                    });
                    finalArgs = objArgs;
                    logger.debug(`Mapped array args to object: ${JSON.stringify(finalArgs)}`);
                }

                const res = await plugin.plug[functionName](ctx, finalArgs);

                logger.toolResult('Success', pluginCall.plugin, {
                    'Function': functionName
                });






                results.push({
                    call: `${pluginCall.plugin}.${functionName}`,
                    result: res === undefined ? "Done" : res,
                    pluginName: plugin.system.display_name || plugin.meta.name
                });
            } catch (ex) {
                logger.error(`Execution error in ${pluginCall.plugin}.${functionName}: ${ex.message}`);
                results.push({
                    call: `${pluginCall.plugin}.${functionName}`,
                    error: ex.message,
                    pluginName: plugin.system.display_name || plugin.meta.name
                });
            }
        } catch (e) {












            // ============================================================
            // FALLBACK: regex extraction for malformed JSON
            // ============================================================
            logger.warn(`JSON Parse Error: ${e.message}. Attempting Regex Rescue...`);

            try {

                const pluginMatch = finding.json.match(/"plugin"\s*:\s*"([^"]+)"/);
                const funcMatch = finding.json.match(/"function"\s*:\s*"([^"]+)"/);

                if (pluginMatch && funcMatch) {
                    const pluginName = pluginMatch[1];
                    const functionName = funcMatch[1];


                    const argsStart = finding.json.indexOf('"args"');
                    let args = {};

                    if (argsStart !== -1) {
                        const argsBlock = finding.json.substring(argsStart);


                        const promptMatch = argsBlock.match(/"prompt"\s*:\s*(["'])([\s\S]*?)\1/);
                        if (promptMatch) {
                            args.prompt = promptMatch[2];
                        }



                        const queryMatch = argsBlock.match(/"query"\s*:\s*(["'])([\s\S]*?)\1/);
                        if (queryMatch) {
                            args.query = queryMatch[2];
                        }
                    }

                    if (Object.keys(args).length > 0) {
                        logger.success(`Regex Rescue Successful: ${pluginName}.${functionName}`);

                        const recoveredCall = { plugin: pluginName, function: functionName, args };





                        const plugin = plugins.find(p =>
                            p.meta.name?.toLowerCase() === pluginName.toLowerCase() ||
                            p.meta.slug?.toLowerCase() === pluginName.toLowerCase() ||
                            p.system.name?.toLowerCase() === pluginName.toLowerCase()
                        );

                        if (plugin && plugin.plug[functionName]) {
                            logger.toolExecution(`${pluginName}.${functionName}`, args, 'Executing (Recovered)...');
                            try {
                                const res = await plugin.plug[functionName](ctx, args);
                                results.push({
                                    call: `${pluginName}.${functionName}`,
                                    result: res === undefined ? "Done" : res,
                                    pluginName: plugin.system.display_name
                                });
                                continue;


                            } catch (ex) {
                                results.push({ call: `${pluginName}.${functionName}`, error: ex.message });
                            }
                        }
                    }
                }



            } catch (regexError) {
                logger.debug(`Regex Rescue Failed: ${regexError.message}`);
            }

            logger.error(`JSON Parse Error: ${e.message} in block: ${finding.json}`);
            continue;
        }
    }





    let strippedText = responseText;
    for (let i = findings.length - 1; i >= 0; i--) {
        strippedText = strippedText.substring(0, findings[i].start) + strippedText.substring(findings[i].end + 1);
    }

    return {
        status: results.length > 0 ? "success" : "not_found",
        results,
        strippedText: strippedText.trim()
    };
}

export function stripTechnicalLeaks(text) {
    if (!text) return "";



    return text



        .replace(/\[STEP\s*\d+:?\s*(PLANNING|EXECUTING|REPORTING|PLAN|EXECUTE|REPORT|STATUS)\]/gi, "")
        .replace(/\[PLANNING\]|\[EXECUTING\]|\[REPORTING\]/gi, "")
        .replace(/\[PLAN\]|\[EXECUTE\]|\[REPORT\]|\[STATUS\]/gi, "")



        .replace(/^(?:###\s+)?(Thought|Action|Observation|Final Answer):\s*/gmi, "")
        .replace(/^(USER|ASSISTANT|SYSTEM|THOUGHT|INTERNAL_.*?|TOOL_RESULT):\s*/gmi, "")

        .replace(/^###\s+(Thought|Action|Observation|Response|Final Answer)\s*$/gmi, "")


        .replace(/\[(THOUGHT|ACTION|ANSWER)\]/gi, "")


        .replace(/\[INTERNAL_.*?\]/gi, "")
        .replace(/\[AGENT_ACTION\]/gi, "")


        .replace(/\{\s*"plugin"\s*:[\s\S]*?\}/g, "")


        .replace(/STEP \d+ \s*:\s*/gi, "")




        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
