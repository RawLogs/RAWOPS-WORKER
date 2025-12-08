/**
 * OpenAI Provider
 * Uses OpenAI official SDK
 */
import { BaseProvider, AIProviderConfig, AIProviderResult, ProviderType } from './base-provider';
export interface OpenAIConfig extends AIProviderConfig {
    organizationId?: string;
}
export declare class OpenAIProvider extends BaseProvider {
    private client;
    constructor(config: OpenAIConfig);
    get providerName(): ProviderType;
    get defaultModelChain(): string[];
    generateContent(prompt: string, customModelChain?: string[]): Promise<AIProviderResult>;
    validateApiKey(): Promise<boolean>;
}
