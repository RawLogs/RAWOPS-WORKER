"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAI = void 0;
const generative_ai_1 = require("@google/generative-ai");
class BaseAI {
    constructor(config) {
        this.config = {
            model: 'gemini-flash-latest',
            modelChain: ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'],
            maxRetries: 3,
            retryDelay: 1000,
            ...config
        };
        this.genAI = new generative_ai_1.GoogleGenerativeAI(this.config.apiKey);
    }
    /**
     * Generate content with retry logic and model fallback
     */
    async generateWithRetry(prompt, customModelChain) {
        const modelChain = customModelChain || this.config.modelChain || [this.config.model];
        for (const modelName of modelChain) {
            for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
                try {
                    const model = this.genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const content = response.text().trim();
                    if (content && content.length > 0) {
                        return {
                            success: true,
                            content,
                            model: modelName,
                            attempts: attempt
                        };
                    }
                    // If content is empty, retry
                    if (attempt < this.config.maxRetries) {
                        await this.delay(this.config.retryDelay * attempt);
                    }
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    // Check if it's a rate limit or quota error
                    const isRateLimit = errorMessage.includes('503') ||
                        errorMessage.includes('rate limit') ||
                        errorMessage.includes('quota') ||
                        errorMessage.includes('429') ||
                        errorMessage.includes('overloaded') ||
                        errorMessage.includes('Service Unavailable');
                    if (isRateLimit && attempt < this.config.maxRetries) {
                        const waitTime = this.config.retryDelay * Math.pow(2, attempt - 1);
                        await this.delay(waitTime);
                        continue;
                    }
                    // If it's the last attempt for this model, try next model
                    if (attempt === this.config.maxRetries) {
                        break;
                    }
                    await this.delay(this.config.retryDelay * attempt);
                }
            }
        }
        return {
            success: false,
            error: 'All models and retry attempts failed',
            attempts: this.config.maxRetries * modelChain.length
        };
    }
    /**
     * Clean content for Twitter compatibility
     */
    cleanContent(content) {
        if (!content)
            return '';
        return content
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&lt;/g, '<') // Decode HTML entities
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/[\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F\uFEFF]/g, '') // Remove formatting chars
            .replace(/[\uD800-\uDFFF]/g, '') // Remove surrogate pairs
            .replace(/[\uFFFD]/g, '') // Remove replacement characters
            .trim();
    }
    /**
     * Delay execution
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Validate API key
     */
    async validateApiKey() {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.config.model });
            await model.generateContent('Test');
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.BaseAI = BaseAI;
