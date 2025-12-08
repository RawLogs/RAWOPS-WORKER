"use strict";
/**
 * OpenAI Provider
 * Uses OpenAI official SDK
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const base_provider_1 = require("./base-provider");
class OpenAIProvider extends base_provider_1.BaseProvider {
    constructor(config) {
        super({
            model: 'gpt-4.1-mini',
            modelChain: ['gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o-mini', 'gpt-4o-nano'],
            ...config
        });
        this.client = new openai_1.default({
            apiKey: this.config.apiKey,
            ...(config.organizationId && { organization: config.organizationId })
        });
    }
    get providerName() {
        return 'openai';
    }
    get defaultModelChain() {
        return ['gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o-mini', 'gpt-4o-nano'];
    }
    async generateContent(prompt, customModelChain) {
        return this.generateWithRetry(async (modelName) => {
            const response = await this.client.chat.completions.create({
                model: modelName,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2048
            });
            return response.choices[0]?.message?.content || '';
        }, customModelChain);
    }
    async validateApiKey() {
        try {
            await this.client.models.list();
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.OpenAIProvider = OpenAIProvider;
