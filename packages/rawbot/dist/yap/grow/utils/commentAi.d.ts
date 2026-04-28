import { YapCommentSettings } from '../../comment/cbp';
import { YapGrowSettings } from '../types';
/**
 * Map grow settings to Yap Comment AI settings so generation matches yap comment
 * (including multi-provider keys and apiKeyPriority order).
 */
export declare function buildYapCommentSettingsFromGrow(settings: YapGrowSettings): YapCommentSettings;
/**
 * Log intended AI provider order (same semantics as Yap Comment / ContentAI).
 */
export declare function logGrowAiProviderPriority(settings: YapGrowSettings): void;
/**
 * Generate a comment for a post using the same pipeline as yap comment
 * (prompt priority, ContentAI, apiKeyPriority).
 */
export declare function generateGrowAiComment(postContent: string, settings: YapGrowSettings, commentContent?: string, commentUsername?: string): Promise<string | null>;
