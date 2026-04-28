import { YapCommentSettings } from '../../comment/cbp';
import { YapGrowSettings } from '../types';
/**
 * Maps YapGrow AI/comment fields to YapCommentSettings so
 * {@link generateCommentWithUserStyles} runs the same multi-provider flow as
 * CommentByLink / CommentByProfile: keys from profile + legacy Gemini, and
 * `profileApiKeys.apiKeyPriority` as `providerPriority` on ContentAI.
 */
export declare function yapGrowSettingsToCommentAiSettings(settings: YapGrowSettings): YapCommentSettings;
