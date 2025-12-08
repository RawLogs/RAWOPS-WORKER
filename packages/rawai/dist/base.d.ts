import { BaseProvider, AIProviderResult, ProviderType } from './providers';
export type AIResult = AIProviderResult;
export interface AIConfig {
    apiKey?: string;
    provider?: ProviderType;
    apiKeys?: Partial<Record<ProviderType, string | null>>;
    providerPriority?: ProviderType[];
    model?: string;
    modelChain?: string[];
    maxRetries?: number;
    retryDelay?: number;
}
export declare class BaseAI {
    protected providers: Map<ProviderType, BaseProvider>;
    protected config: AIConfig;
    protected primaryProvider: ProviderType;
    constructor(config: AIConfig);
    private initializeProviders;
    private addProvider;
    private getPrimaryProvider;
    /**
     * Get the current provider name
     */
    get providerName(): ProviderType;
    /**
     * Generate content with retry logic and provider fallback
     */
    protected generateWithRetry(prompt: string, customModelChain?: string[]): Promise<AIResult>;
    /**
     * Clean content for Twitter compatibility
     */
    protected cleanContent(content: string): string;
    /**
     * Delay execution
     */
    protected delay(ms: number): Promise<void>;
    /**
     * Validate API key
     * Checks if at least one provider is valid
     */
    validateApiKey(): Promise<boolean>;
}
export { ProviderType } from './providers';
