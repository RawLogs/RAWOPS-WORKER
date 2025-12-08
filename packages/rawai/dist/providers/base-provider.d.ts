/**
 * Base Provider Interface
 * Abstract class that all AI providers must implement
 */
export interface AIProviderResult {
    success: boolean;
    content?: string;
    error?: string;
    model?: string;
    attempts?: number;
}
export interface AIProviderConfig {
    apiKey: string;
    model?: string;
    modelChain?: string[];
    maxRetries?: number;
    retryDelay?: number;
    baseUrl?: string;
}
export type ProviderType = 'gemini' | 'openai' | 'deepseek' | 'huggingface';
export declare abstract class BaseProvider {
    protected config: AIProviderConfig;
    constructor(config: AIProviderConfig);
    /**
     * Generate content using the AI provider
     */
    abstract generateContent(prompt: string, customModelChain?: string[]): Promise<AIProviderResult>;
    /**
     * Validate the API key
     */
    abstract validateApiKey(): Promise<boolean>;
    /**
     * Get the provider name
     */
    abstract get providerName(): ProviderType;
    /**
     * Get default model chain for this provider
     */
    abstract get defaultModelChain(): string[];
    /**
     * Delay execution
     */
    protected delay(ms: number): Promise<void>;
    /**
     * Check if error is rate limit related
     */
    protected isRateLimitError(errorMessage: string): boolean;
    /**
     * Generate with retry logic and model fallback
     */
    protected generateWithRetry(generateFn: (model: string) => Promise<string>, customModelChain?: string[]): Promise<AIProviderResult>;
}
