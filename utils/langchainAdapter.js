import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage } from "@langchain/core/messages";
import { sendToAI } from "./ferro.js";




/**
 * Custom LangChain ChatModel adapter for the Ferro API.
 */
export class ChatFerro extends BaseChatModel {
    static lc_name() {
        return "ChatFerro";
    }

    _llmType() {
        return "ferro";
    }




    async _generate(messages, options, runManager) {

        let systemPrompt = "";
        let userPrompt = "";




        for (const msg of messages) {
            const type = msg.getType();
            if (type === "system") {
                systemPrompt = msg.content;
            } else if (type === "human") {
                userPrompt += `USER: ${msg.content}\n`;
            } else if (type === "ai") {
                userPrompt += `ASSISTANT: ${msg.content}\n`;
            }
        }


        const responseText = await sendToAI(userPrompt, systemPrompt);

        return {
            generations: [
                {
                    text: responseText,
                    message: new AIMessage(responseText),
                },
            ],
        };
    }
}
