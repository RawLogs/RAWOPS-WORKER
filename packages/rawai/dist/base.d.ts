import { GoogleGenerativeAI } from '@google/generative-ai';
export interface AIResult {
    success: boolean;
    content?: string;
    error?: string;
    model?: string;
    attempts?: number;
}
export interface AIConfig {
    apiKey: string;
    model?: string;
    modelChain?: string[];
    maxRetries?: number;
    retryDelay?: number;
}
export declare class BaseAI {
    protected genAI: GoogleGenerativeAI;
    protected config: AIConfig;
    constructor(config: AIConfig);
    /**
     * Generate content with retry logic and model fallback
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
     */
    validateApiKey(): Promise<boolean>;
}
