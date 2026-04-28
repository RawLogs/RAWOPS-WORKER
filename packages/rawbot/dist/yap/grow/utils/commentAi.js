"use strict";
// packages/rawbot/src/yap/grow/utils/commentAi.ts
// Grow AI comments reuse the same ContentAI / provider-priority path as Yap Comment.
// Normalization mirrors CommentByLink (cbl.ts) key + apiKeyPriority assembly so
// generateCommentWithUserStyles receives the same shape as the comment workflow.
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeGrowSettingsLikeCommentByLink = normalizeGrowSettingsLikeCommentByLink;
exports.buildYapCommentSettingsFromGrow = buildYapCommentSettingsFromGrow;
exports.logGrowAiProviderPriority = logGrowAiProviderPriority;
exports.generateGrowAiComment = generateGrowAiComment;
const utils_1 = require("../../comment/utils");
/** Same default order as comment-settings / grow-settings API when profile has no custom order. */
const DEFAULT_API_KEY_PRIORITY = ['gemini', 'openai', 'deepseek', 'huggingface'];
function pickNonEmpty(...candidates) {
    for (const c of candidates) {
        if (c == null)
            continue;
        const s = typeof c === 'string' ? c : String(c);
        if (s.trim().length > 0)
            return s.trim();
    }
    return undefined;
}
/**
 * Build profileApiKeys + gemini root the same way CommentByLink expects from API:
 * merge `settings.profileApiKeys`, root-level keys some payloads use, then fill gemini from legacy root.
 * Filters `apiKeyPriority` to providers that actually have keys (so OpenAI is used when configured).
 */
function normalizeGrowSettingsLikeCommentByLink(settings) {
    const bag = settings;
    const pk = (settings.profileApiKeys || {});
    const geminiApiKey = pickNonEmpty(pk.geminiApiKey, settings.geminiApiKey, bag.geminiApiKey);
    const openaiApiKey = pickNonEmpty(pk.openaiApiKey, bag.openaiApiKey);
    const deepseekApiKey = pickNonEmpty(pk.deepseekApiKey, bag.deepseekApiKey);
    const huggingfaceApiKey = pickNonEmpty(pk.huggingfaceApiKey, bag.huggingfaceApiKey);
    const has = {
        gemini: !!geminiApiKey,
        openai: !!openaiApiKey,
        deepseek: !!deepseekApiKey,
        huggingface: !!huggingfaceApiKey
    };
    const anyProvider = has.gemini || has.openai || has.deepseek || has.huggingface;
    if (!anyProvider) {
        return settings;
    }
    const rawPriority = Array.isArray(pk.apiKeyPriority)
        ? pk.apiKeyPriority
        : Array.isArray(bag.apiKeyPriority)
            ? bag.apiKeyPriority
            : [...DEFAULT_API_KEY_PRIORITY];
    let apiKeyPriority = rawPriority.filter((p) => has[p]);
    if (apiKeyPriority.length === 0) {
        apiKeyPriority = [...DEFAULT_API_KEY_PRIORITY].filter((p) => has[p]);
    }
    if (apiKeyPriority.length === 0 && has.gemini) {
        apiKeyPriority = ['gemini'];
    }
    const profileApiKeys = {
        geminiApiKey: geminiApiKey ?? null,
        openaiApiKey: openaiApiKey ?? null,
        deepseekApiKey: deepseekApiKey ?? null,
        huggingfaceApiKey: huggingfaceApiKey ?? null,
        apiKeyPriority
    };
    return {
        ...settings,
        geminiApiKey: geminiApiKey ?? settings.geminiApiKey,
        profileApiKeys
    };
}
/**
 * Map grow settings to Yap Comment AI settings so generation matches yap comment
 * (including multi-provider keys and apiKeyPriority order).
 */
function buildYapCommentSettingsFromGrow(settings) {
    const s = normalizeGrowSettingsLikeCommentByLink(settings);
    return {
        aiCommentEnabled: !!s.aiCommentEnabled,
        aiCommentPrompt: s.aiCommentPrompt || '',
        geminiApiKey: s.geminiApiKey || '',
        profileApiKeys: s.profileApiKeys,
        delayRange: { min: 0, max: 0 },
        links: [],
        aiModel: s.aiModel,
        aiLanguage: s.aiLanguage,
        commentStyle: s.commentStyle,
        commentLength: s.commentLength,
        includeHashtags: s.includeHashtags,
        maxHashtags: s.maxHashtags,
        includeMentions: s.includeMentions,
        maxMentions: s.maxMentions,
        promptStyles: s.promptStyles,
        promptStyleMode: s.promptStyleMode,
        selectedPromptStyles: s.selectedPromptStyles,
        promptStyleCategory: s.promptStyleCategory,
        availablePromptStyles: s.availablePromptStyles,
        databasePrompt: s.databasePrompt ?? undefined,
        profileId: s.profileId
    };
}
/**
 * Log intended AI provider order after the same normalization as CommentByLink.
 */
function logGrowAiProviderPriority(settings) {
    const s = normalizeGrowSettingsLikeCommentByLink(settings);
    const order = s.profileApiKeys?.apiKeyPriority;
    if (order?.length) {
        console.log(`[YapGrow] AI provider priority order: ${order.join(' → ')}`);
        return;
    }
    const keys = s.profileApiKeys;
    const hasAny = !!s.geminiApiKey ||
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
