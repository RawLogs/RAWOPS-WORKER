import { BaseAI, AIConfig, ProviderType } from './base';
import { ContentAI } from './content';
import { AnalysisAI } from './analysis';
import { SelectionAI } from './selection';
import { EvaluationAI } from './evaluation';
import { createProvider, getAvailableProviders, GeminiProvider, OpenAIProvider, DeepSeekProvider, HuggingFaceProvider, BaseProvider } from './providers';
export { BaseAI, ContentAI, AnalysisAI, SelectionAI, EvaluationAI };
export { BaseProvider, GeminiProvider, OpenAIProvider, DeepSeekProvider, HuggingFaceProvider, createProvider, getAvailableProviders };
export type { AIResult, AIConfig, ProviderType } from './base';
export type { AIProviderResult, AIProviderConfig } from './providers';
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
    private readonly config;
    constructor(config: AIConfig);
    /**
     * Get current provider name
     */
    get providerName(): ProviderType;
    /**
     * Validate API key
     */
    validateApiKey(): Promise<boolean>;
    /**
     * Get AI service status
     */
    getStatus(): Promise<{
        apiKeyValid: boolean;
        provider: ProviderType;
        services: string[];
        availableProviders: ProviderType[];
    }>;
}
