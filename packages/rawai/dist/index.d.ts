import { BaseAI, AIConfig } from './base';
import { ContentAI } from './content';
import { AnalysisAI } from './analysis';
import { SelectionAI } from './selection';
import { EvaluationAI } from './evaluation';
export { BaseAI, ContentAI, AnalysisAI, SelectionAI, EvaluationAI };
export type { AIResult, AIConfig } from './base';
export type { ContentOptions, TweetContentOptions, PromptConfig } from './content';
export type { AnalysisOptions, TweetAnalysis } from './analysis';
export type { SelectionOptions, TweetSelection } from './selection';
export type { EvaluationOptions, TweetEvaluation } from './evaluation';
/**
 * Main RawAI class that combines all AI services
 */
export declare class RawAI {
    readonly content: ContentAI;
    readonly analysis: AnalysisAI;
    readonly selection: SelectionAI;
    readonly evaluation: EvaluationAI;
    constructor(config: AIConfig);
    /**
     * Validate API key
     */
    validateApiKey(): Promise<boolean>;
    /**
     * Get AI service status
     */
    getStatus(): Promise<{
        apiKeyValid: boolean;
        services: string[];
        models: string[];
    }>;
}
//# sourceMappingURL=index.d.ts.map