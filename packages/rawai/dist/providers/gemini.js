"use strict";
/**
 * Gemini AI Provider
 * Uses Google's new GenAI SDK (@google/genai)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const genai_1 = require("@google/genai");
const base_provider_1 = require("./base-provider");
class GeminiProvider extends base_provider_1.BaseProvider {
    constructor(config) {
        super({
            model: 'gemini-flash-latest',
            modelChain: ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'],
            ...config
        });
        this.genAI = new genai_1.GoogleGenAI({ apiKey: this.config.apiKey });
    }
    get providerName() {
        return 'gemini';
    }
    get defaultModelChain() {
        return ['gemini-flash-latest', 'gemini-flash-latest-lite', 'gemini-2.5-flash'];
    }
    async generateContent(prompt, customModelChain) {
        return this.generateWithRetry(async (modelName) => {
            const response = await this.genAI.models.generateContent({
                model: modelName,
                contents: prompt
            });
            return response.text || '';
        }, customModelChain);
    }
    async validateApiKey() {
        try {
            await this.genAI.models.generateContent({
                model: this.config.model || 'gemini-flash-latest',
                contents: 'Test'
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.GeminiProvider = GeminiProvider;
