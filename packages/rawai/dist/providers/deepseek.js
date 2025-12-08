"use strict";
/**
 * DeepSeek AI Provider
 * Uses OpenAI SDK with custom base URL (DeepSeek API is OpenAI-compatible)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepSeekProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const base_provider_1 = require("./base-provider");
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
class DeepSeekProvider extends base_provider_1.BaseProvider {
    constructor(config) {
        super({
            model: 'deepseek-chat',
            modelChain: ['deepseek-chat', 'deepseek-coder'],
            baseUrl: DEEPSEEK_BASE_URL,
            ...config
        });
        this.client = new openai_1.default({
            apiKey: this.config.apiKey,
            baseURL: this.config.baseUrl || DEEPSEEK_BASE_URL
        });
    }
    get providerName() {
        return 'deepseek';
    }
    get defaultModelChain() {
        return ['deepseek-chat', 'deepseek-coder'];
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
            // DeepSeek uses OpenAI-compatible API, try a simple completion
            await this.client.chat.completions.create({
                model: this.config.model || 'deepseek-chat',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 5
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.DeepSeekProvider = DeepSeekProvider;
