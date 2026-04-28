import { YapCommentSettings } from '../../comment/cbp';
import { YapGrowSettings } from '../types';
/**
 * Build profileApiKeys + gemini root the same way CommentByLink expects from API:
 * merge `settings.profileApiKeys`, root-level keys some payloads use, then fill gemini from legacy root.
 * Filters `apiKeyPriority` to providers that actually have keys (so OpenAI is used when configured).
 */
export declare function normalizeGrowSettingsLikeCommentByLink(settings: YapGrowSettings): YapGrowSettings;
/**
 * Map grow settings to Yap Comment AI settings so generation matches yap comment
 * (including multi-provider keys and apiKeyPriority order).
 */
export declare function buildYapCommentSettingsFromGrow(settings: YapGrowSettings): YapCommentSettings;
/**
 * Log intended AI provider order after the same normalization as CommentByLink.
 */
export declare function logGrowAiProviderPriority(settings: YapGrowSettings): void;
/**
 * Generate a comment for a post using the same pipeline as yap comment
 * (prompt priority, ContentAI, apiKeyPriority).
 */
export declare function generateGrowAiComment(postContent: string, settings: YapGrowSettings, commentContent?: string, commentUsername?: string): Promise<string | null>;
