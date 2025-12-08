"use strict";
/**
 * HuggingFace AI Provider
 * Uses HuggingFace Inference API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingFaceProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const base_provider_1 = require("./base-provider");
class HuggingFaceProvider extends base_provider_1.BaseProvider {
    constructor(config) {
        super({
            model: 'deepseek-ai/DeepSeek-V3.2-Exp:novita',
            modelChain: [
                'deepseek-ai/DeepSeek-V3.2-Exp:novita',
                'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B'
            ],
            ...config
        });
        this.client = new openai_1.default({
            baseURL: 'https://router.huggingface.co/v1',
            apiKey: this.config.apiKey
        });
    }
    get providerName() {
        return 'huggingface';
    }
    get defaultModelChain() {
        return [
            'deepseek-ai/DeepSeek-V3.2-Exp:novita',
            'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B'
        ];
    }
    async generateContent(prompt) {
        try {
            const modelName = this.config.model || this.defaultModelChain[0];
            const completion = await this.client.chat.completions.create({
                model: modelName,
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1024,
                temperature: 0.7
            });
            const text = completion.choices[0]?.message?.content || '';
            return {
                success: true,
                content: text
            };
        }
        catch (error) {
            console.error('HuggingFace API Error:', error);
            throw error;
        }
    }
    async validateApiKey() {
        try {
            // Try a simple chat completion to validate the API key
            await this.client.chat.completions.create({
                model: this.config.model || 'deepseek-ai/DeepSeek-V3.2-Exp:novita',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 5
            });
            return true;
        }
        catch (error) {
            console.error('HuggingFace validation error:', error);
            return false;
        }
    }
}
exports.HuggingFaceProvider = HuggingFaceProvider;
