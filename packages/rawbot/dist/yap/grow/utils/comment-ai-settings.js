"use strict";
// packages/rawbot/src/yap/grow/utils/comment-ai-settings.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.yapGrowSettingsToCommentAiSettings = yapGrowSettingsToCommentAiSettings;
/**
 * Maps YapGrow AI/comment fields to YapCommentSettings so
 * {@link generateCommentWithUserStyles} runs the same multi-provider flow as
 * CommentByLink / CommentByProfile: keys from profile + legacy Gemini, and
 * `profileApiKeys.apiKeyPriority` as `providerPriority` on ContentAI.
 */
function yapGrowSettingsToCommentAiSettings(settings) {
    return {
        aiCommentEnabled: settings.aiCommentEnabled ?? false,
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
        promptStyleMode: settings.promptStyleMode,
        selectedPromptStyles: settings.selectedPromptStyles,
        promptStyleCategory: settings.promptStyleCategory,
        databasePrompt: settings.databasePrompt ?? undefined,
        profileId: settings.profileId
    };
}
