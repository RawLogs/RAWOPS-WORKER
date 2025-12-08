/**
 * DeepSeek AI Provider
 * Uses OpenAI SDK with custom base URL (DeepSeek API is OpenAI-compatible)
 */
import { BaseProvider, AIProviderConfig, AIProviderResult, ProviderType } from './base-provider';
export interface DeepSeekConfig extends AIProviderConfig {
}
export declare class DeepSeekProvider extends BaseProvider {
    private client;
    constructor(config: DeepSeekConfig);
    get providerName(): ProviderType;
    get defaultModelChain(): string[];
    generateContent(prompt: string, customModelChain?: string[]): Promise<AIProviderResult>;
    validateApiKey(): Promise<boolean>;
}
