/**
 * Gemini AI Provider
 * Uses Google's new GenAI SDK (@google/genai)
 */
import { BaseProvider, AIProviderConfig, AIProviderResult, ProviderType } from './base-provider';
export interface GeminiConfig extends AIProviderConfig {
}
export declare class GeminiProvider extends BaseProvider {
    private genAI;
    constructor(config: GeminiConfig);
    get providerName(): ProviderType;
    get defaultModelChain(): string[];
    generateContent(prompt: string, customModelChain?: string[]): Promise<AIProviderResult>;
    validateApiKey(): Promise<boolean>;
}
