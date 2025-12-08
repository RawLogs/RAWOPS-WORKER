"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawAI = exports.getAvailableProviders = exports.createProvider = exports.HuggingFaceProvider = exports.DeepSeekProvider = exports.OpenAIProvider = exports.GeminiProvider = exports.BaseProvider = exports.EvaluationAI = exports.SelectionAI = exports.AnalysisAI = exports.ContentAI = exports.BaseAI = void 0;
// Import AI classes
const base_1 = require("./base");
Object.defineProperty(exports, "BaseAI", { enumerable: true, get: function () { return base_1.BaseAI; } });
const content_1 = require("./content");
Object.defineProperty(exports, "ContentAI", { enumerable: true, get: function () { return content_1.ContentAI; } });
const analysis_1 = require("./analysis");
Object.defineProperty(exports, "AnalysisAI", { enumerable: true, get: function () { return analysis_1.AnalysisAI; } });
const selection_1 = require("./selection");
Object.defineProperty(exports, "SelectionAI", { enumerable: true, get: function () { return selection_1.SelectionAI; } });
const evaluation_1 = require("./evaluation");
Object.defineProperty(exports, "EvaluationAI", { enumerable: true, get: function () { return evaluation_1.EvaluationAI; } });
// Import provider factory and types
const providers_1 = require("./providers");
Object.defineProperty(exports, "createProvider", { enumerable: true, get: function () { return providers_1.createProvider; } });
Object.defineProperty(exports, "getAvailableProviders", { enumerable: true, get: function () { return providers_1.getAvailableProviders; } });
Object.defineProperty(exports, "GeminiProvider", { enumerable: true, get: function () { return providers_1.GeminiProvider; } });
Object.defineProperty(exports, "OpenAIProvider", { enumerable: true, get: function () { return providers_1.OpenAIProvider; } });
Object.defineProperty(exports, "DeepSeekProvider", { enumerable: true, get: function () { return providers_1.DeepSeekProvider; } });
Object.defineProperty(exports, "HuggingFaceProvider", { enumerable: true, get: function () { return providers_1.HuggingFaceProvider; } });
Object.defineProperty(exports, "BaseProvider", { enumerable: true, get: function () { return providers_1.BaseProvider; } });
/**
 * Main RawAI class that combines all AI services
 */
class RawAI {
    constructor(config) {
        this.config = {
            provider: 'gemini',
            ...config
        };
        this.content = new content_1.ContentAI(this.config);
        this.analysis = new analysis_1.AnalysisAI(this.config);
        this.selection = new selection_1.SelectionAI(this.config);
        this.evaluation = new evaluation_1.EvaluationAI(this.config);
    }
    /**
     * Get current provider name
     */
    get providerName() {
        return this.content.providerName;
    }
    /**
     * Validate API key
     */
    async validateApiKey() {
        return await this.content.validateApiKey();
    }
    /**
     * Get AI service status
     */
    async getStatus() {
        const apiKeyValid = await this.validateApiKey();
        return {
            apiKeyValid,
            provider: this.providerName,
            services: ['content', 'analysis', 'selection', 'evaluation'],
            availableProviders: (0, providers_1.getAvailableProviders)()
        };
    }
}
exports.RawAI = RawAI;
