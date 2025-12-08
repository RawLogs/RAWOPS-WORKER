"use strict";
/**
 * Provider exports and factory
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingFaceProvider = exports.DeepSeekProvider = exports.OpenAIProvider = exports.GeminiProvider = exports.BaseProvider = void 0;
exports.createProvider = createProvider;
exports.getAvailableProviders = getAvailableProviders;
var base_provider_1 = require("./base-provider");
Object.defineProperty(exports, "BaseProvider", { enumerable: true, get: function () { return base_provider_1.BaseProvider; } });
var gemini_1 = require("./gemini");
Object.defineProperty(exports, "GeminiProvider", { enumerable: true, get: function () { return gemini_1.GeminiProvider; } });
var openai_1 = require("./openai");
Object.defineProperty(exports, "OpenAIProvider", { enumerable: true, get: function () { return openai_1.OpenAIProvider; } });
var deepseek_1 = require("./deepseek");
Object.defineProperty(exports, "DeepSeekProvider", { enumerable: true, get: function () { return deepseek_1.DeepSeekProvider; } });
var huggingface_1 = require("./huggingface");
Object.defineProperty(exports, "HuggingFaceProvider", { enumerable: true, get: function () { return huggingface_1.HuggingFaceProvider; } });
const gemini_2 = require("./gemini");
const openai_2 = require("./openai");
const deepseek_2 = require("./deepseek");
const huggingface_2 = require("./huggingface");
/**
 * Factory function to create AI provider based on type
 */
function createProvider(provider, config) {
    switch (provider) {
        case 'gemini':
            return new gemini_2.GeminiProvider(config);
        case 'openai':
            return new openai_2.OpenAIProvider(config);
        case 'deepseek':
            return new deepseek_2.DeepSeekProvider(config);
        case 'huggingface':
            return new huggingface_2.HuggingFaceProvider(config);
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}
/**
 * Get all available provider types
 */
function getAvailableProviders() {
    return ['gemini', 'openai', 'deepseek', 'huggingface'];
}
