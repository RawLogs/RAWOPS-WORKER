/**
 * Provider exports and factory
 */
export { BaseProvider, AIProviderResult, AIProviderConfig, ProviderType } from './base-provider';
export { GeminiProvider, GeminiConfig } from './gemini';
export { OpenAIProvider, OpenAIConfig } from './openai';
export { DeepSeekProvider, DeepSeekConfig } from './deepseek';
export { HuggingFaceProvider, HuggingFaceConfig } from './huggingface';
import { BaseProvider, AIProviderConfig, ProviderType } from './base-provider';
/**
 * Factory function to create AI provider based on type
 */
export declare function createProvider(provider: ProviderType, config: AIProviderConfig): BaseProvider;
/**
 * Get all available provider types
 */
export declare function getAvailableProviders(): ProviderType[];
