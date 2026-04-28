"use strict";
// packages/rawbot/src/yap/grow/utils/commentAi.ts
// Grow AI comments reuse the same ContentAI / provider-priority path as Yap Comment.
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildYapCommentSettingsFromGrow = buildYapCommentSettingsFromGrow;
exports.logGrowAiProviderPriority = logGrowAiProviderPriority;
exports.generateGrowAiComment = generateGrowAiComment;
const utils_1 = require("../../comment/utils");
/**
 * Map grow settings to Yap Comment AI settings so generation matches yap comment
 * (including multi-provider keys and apiKeyPriority order).
 */
function buildYapCommentSettingsFromGrow(settings) {
    return {
        aiCommentEnabled: !!settings.aiCommentEnabled,
        aiCommentPrompt: settings.aiCommentPrompt || '',
        geminiApiKey: settings.geminiApiKey || '',
        profileApiKeys: settings.profileApiKeys,
        delayRange: { min: 0, max: 0 },
        links: [],
        aiModel: settings.aiModel,
        aiLanguage: settings.aiLanguage,
        commentStyle: settings.commentStyle,
        commentLength: settings.commentLength,
        includeHashtags: settings.includeHashtags,
        maxHashtags: settings.maxHashtags,
        includeMentions: settings.includeMentions,
        maxMentions: settings.maxMentions,
        promptStyles: settings.promptStyles,
        promptStyleMode: settings.promptStyleMode,
        selectedPromptStyles: settings.selectedPromptStyles,
        promptStyleCategory: settings.promptStyleCategory,
        availablePromptStyles: settings.availablePromptStyles,
        databasePrompt: settings.databasePrompt ?? undefined,
        profileId: settings.profileId
    };
}
/**
 * Log intended AI provider order (same semantics as Yap Comment / ContentAI).
 */
function logGrowAiProviderPriority(settings) {
    const order = settings.profileApiKeys?.apiKeyPriority;
    if (order?.length) {
        console.log(`[YapGrow] AI provider priority order: ${order.join(' → ')}`);
        return;
    }
    const keys = settings.profileApiKeys;
    const hasAny = !!settings.geminiApiKey ||
        !!keys?.geminiApiKey ||
        !!keys?.openaiApiKey ||
        !!keys?.deepseekApiKey ||
        !!keys?.huggingfaceApiKey;
    if (hasAny) {
        console.log('[YapGrow] AI provider priority: implicit (ContentAI defaults, e.g. gemini when only Gemini key)');
    }
}
/**
 * Generate a comment for a post using the same pipeline as yap comment
 * (prompt priority, ContentAI, apiKeyPriority).
 */
async function generateGrowAiComment(postContent, settings, commentContent, commentUsername) {
    logGrowAiProviderPriority(settings);
    const commentSettings = buildYapCommentSettingsFromGrow(settings);
    return (0, utils_1.generateCommentWithUserStyles)(postContent, commentSettings, commentContent, commentUsername);
}
