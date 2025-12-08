"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAI = void 0;
const providers_1 = require("./providers");
class BaseAI {
    constructor(config) {
        this.providers = new Map();
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            providerPriority: ['openai', 'gemini', 'deepseek', 'huggingface'],
            ...config
        };
        // Initialize providers
        this.initializeProviders();
        // Set primary provider
        this.primaryProvider = this.getPrimaryProvider();
    }
    initializeProviders() {
        // Handle legacy single provider config
        if (this.config.apiKey && this.config.provider) {
            this.addProvider(this.config.provider, this.config.apiKey);
        }
        // Handle multi-provider config
        if (this.config.apiKeys) {
            Object.entries(this.config.apiKeys).forEach(([provider, key]) => {
                if (key && typeof key === 'string') {
                    this.addProvider(provider, key);
                }
            });
        }
    }
    addProvider(type, apiKey) {
        try {
            const provider = (0, providers_1.createProvider)(type, {
                apiKey,
                maxRetries: this.config.maxRetries,
                retryDelay: this.config.retryDelay
            });
            this.providers.set(type, provider);
        }
        catch (error) {
            console.warn(`Failed to initialize provider ${type}:`, error);
        }
    }
    getPrimaryProvider() {
        // Try to find first available provider from priority list
        if (this.config.providerPriority) {
            for (const type of this.config.providerPriority) {
                if (this.providers.has(type)) {
                    return type;
                }
            }
        }
        // Fallback to any available provider
        if (this.providers.size > 0) {
            const first = this.providers.keys().next().value;
            if (first)
                return first;
        }
        // Default to configured provider if no providers initialized (will throw later)
        return this.config.provider || 'gemini';
    }
    /**
     * Get the current provider name
     */
    get providerName() {
        return this.primaryProvider;
    }
    /**
     * Generate content with retry logic and provider fallback
     */
    async generateWithRetry(prompt, customModelChain) {
        const priorityList = this.config.providerPriority || [];
        // Add any providers not in priority list to the end
        for (const type of this.providers.keys()) {
            if (!priorityList.includes(type)) {
                priorityList.push(type);
            }
        }
        let lastError;
        let totalAttempts = 0;
        // Iterate through providers in priority order
        for (const providerType of priorityList) {
            const provider = this.providers.get(providerType);
            if (!provider)
                continue;
            try {
                const result = await provider.generateContent(prompt, customModelChain);
                if (result.success) {
                    return {
                        ...result,
                        attempts: totalAttempts + (result.attempts || 1)
                    };
                }
                lastError = result.error;
                totalAttempts += (result.attempts || 0);
                // Log warning but continue to next provider
                console.warn(`Provider ${providerType} failed: ${result.error}. Trying next provider...`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                lastError = errorMessage;
                console.warn(`Provider ${providerType} error: ${errorMessage}. Trying next provider...`);
            }
        }
        return {
            success: false,
            error: lastError || 'All providers failed',
            attempts: totalAttempts
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
     * Checks if at least one provider is valid
     */
    async validateApiKey() {
        for (const provider of this.providers.values()) {
            if (await provider.validateApiKey()) {
                return true;
            }
        }
        return false;
    }
}
exports.BaseAI = BaseAI;
