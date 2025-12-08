"use strict";
/**
 * Base Provider Interface
 * Abstract class that all AI providers must implement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProvider = void 0;
class BaseProvider {
    constructor(config) {
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            ...config
        };
    }
    /**
     * Delay execution
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Check if error is rate limit related
     */
    isRateLimitError(errorMessage) {
        return errorMessage.includes('503') ||
            errorMessage.includes('rate limit') ||
            errorMessage.includes('quota') ||
            errorMessage.includes('429') ||
            errorMessage.includes('overloaded') ||
            errorMessage.includes('Service Unavailable') ||
            errorMessage.includes('Too Many Requests');
    }
    /**
     * Generate with retry logic and model fallback
     */
    async generateWithRetry(generateFn, customModelChain) {
        const modelChain = customModelChain || this.config.modelChain || this.defaultModelChain;
        for (const modelName of modelChain) {
            for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
                try {
                    const content = await generateFn(modelName);
                    if (content && content.length > 0) {
                        return {
                            success: true,
                            content: content.trim(),
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
                    if (this.isRateLimitError(errorMessage) && attempt < this.config.maxRetries) {
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
}
exports.BaseProvider = BaseProvider;
