/**
 * HuggingFace AI Provider
 * Uses HuggingFace Inference API
 */
import { BaseProvider, AIProviderConfig, AIProviderResult, ProviderType } from './base-provider';
export interface HuggingFaceConfig extends AIProviderConfig {
    apiKey: string;
}
export declare class HuggingFaceProvider extends BaseProvider {
    private client;
    constructor(config: HuggingFaceConfig);
    get providerName(): ProviderType;
    get defaultModelChain(): string[];
    generateContent(prompt: string): Promise<AIProviderResult>;
    validateApiKey(): Promise<boolean>;
}
