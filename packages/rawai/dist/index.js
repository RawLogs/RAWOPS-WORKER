"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawAI = exports.EvaluationAI = exports.SelectionAI = exports.AnalysisAI = exports.ContentAI = exports.BaseAI = void 0;
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
/**
 * Main RawAI class that combines all AI services
 */
class RawAI {
    constructor(config) {
        this.content = new content_1.ContentAI(config);
        this.analysis = new analysis_1.AnalysisAI(config);
        this.selection = new selection_1.SelectionAI(config);
        this.evaluation = new evaluation_1.EvaluationAI(config);
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
            services: ['content', 'analysis', 'selection', 'evaluation'],
            models: ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite']
        };
    }
}
exports.RawAI = RawAI;
