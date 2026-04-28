"use strict";
// packages/rawbot/src/yap/comment/utils/ai.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContentAI = buildContentAI;
exports.generateCommentWithUserStyles = generateCommentWithUserStyles;
exports.selectRandomPromptStyle = selectRandomPromptStyle;
exports.cleanCommentForBMP = cleanCommentForBMP;
exports.generateReplyToComment = generateReplyToComment;
exports.generateReplyToTweetComment = generateReplyToTweetComment;
const rawai_1 = require("@rawops/rawai");
/**
 * Build a ContentAI instance from YapCommentSettings.
 * Same logic as CBP/CBL runYapCommentWorkflow — single source of truth.
 */
function buildContentAI(settings) {
    const hasGeminiKey = !!settings.geminiApiKey;
    const hasProfileKeys = settings.profileApiKeys && (settings.profileApiKeys.geminiApiKey ||
        settings.profileApiKeys.openaiApiKey ||
        settings.profileApiKeys.deepseekApiKey ||
        settings.profileApiKeys.huggingfaceApiKey);
    if (!hasGeminiKey && !hasProfileKeys) {
        return null;
    }
    const aiConfig = {
        model: settings.aiModel || 'gemini-flash-latest',
        maxRetries: 3,
        retryDelay: 2000
    };
    const apiKeys = {};
    if (settings.profileApiKeys) {
        apiKeys.gemini = settings.profileApiKeys.geminiApiKey;
        apiKeys.openai = settings.profileApiKeys.openaiApiKey;
        apiKeys.deepseek = settings.profileApiKeys.deepseekApiKey;
        apiKeys.huggingface = settings.profileApiKeys.huggingfaceApiKey;
        if (settings.profileApiKeys.apiKeyPriority) {
            aiConfig.providerPriority = settings.profileApiKeys.apiKeyPriority;
            console.log(`[YapComment] Provider priority: ${settings.profileApiKeys.apiKeyPriority.join(', ')}`);
        }
    }
    if (settings.geminiApiKey && !apiKeys.gemini) {
        console.log('[YapComment] Mapping legacy Gemini key to multi-provider config');
        apiKeys.gemini = settings.geminiApiKey;
    }
    aiConfig.apiKeys = apiKeys;
    // providerPriority is either set from profileApiKeys.apiKeyPriority, or left unset
    // so BaseAI falls back to its default ['openai','gemini','deepseek','huggingface'].
    // Never force ['gemini'] — that would ignore the user's configured priority.
    return new rawai_1.ContentAI(aiConfig);
}
/**
 * Generate comment with user styles using available prompt styles.
 *
 * Pass `existingAI` (e.g. `this.contentAI` from the workflow class) to reuse the
 * already-initialised instance — that instance has the correct `providerPriority`
 * from `profileApiKeys.apiKeyPriority`.  When omitted the function builds a fresh
 * instance from `settings` (legacy behaviour).
 */
async function generateCommentWithUserStyles(postContent, settings, commentContent, commentUsername, existingAI) {
    try {
        console.log('[YapComment] Starting comment generation...');
        console.log(`[YapComment] Post content length: ${postContent.length}`);
        console.log(`[YapComment] AI enabled: ${settings.aiCommentEnabled}`);
        console.log(`[YapComment] Comment content provided: ${!!commentContent}`);
        // Check if AI is enabled first
        if (!settings.aiCommentEnabled) {
            console.log('[YapComment] AI comment generation is disabled');
            return null;
        }
        // Check if we have any API keys
        const hasGeminiKey = !!settings.geminiApiKey;
        const hasProfileKeys = settings.profileApiKeys && (settings.profileApiKeys.geminiApiKey ||
            settings.profileApiKeys.openaiApiKey ||
            settings.profileApiKeys.deepseekApiKey ||
            settings.profileApiKeys.huggingfaceApiKey);
        if (!hasGeminiKey && !hasProfileKeys && !existingAI) {
            console.log('[YapComment] No API keys provided (Gemini or Profile Keys)');
            return null;
        }
        // Determine which prompt to use
        let selectedPromptStyle = null;
        let promptToUse = '';
        // Priority 1: Use custom aiCommentPrompt if provided
        if (settings.aiCommentPrompt && settings.aiCommentPrompt.trim()) {
            promptToUse = settings.aiCommentPrompt;
            console.log('[YapComment] Using custom AI comment prompt');
        }
        // Priority 2: Use selected prompt styles from prompt settings
        else if (settings.selectedPromptStyles && settings.selectedPromptStyles.length > 0) {
            const stylesToUse = settings.selectedPromptStyles;
            if (stylesToUse.length > 0) {
                selectedPromptStyle = selectRandomPromptStyle(stylesToUse);
                if (selectedPromptStyle && selectedPromptStyle.prompt) {
                    promptToUse = selectedPromptStyle.prompt;
                    console.log(`[YapComment] Using prompt style: ${selectedPromptStyle.displayName} (${selectedPromptStyle.name})`);
                }
            }
        }
        // Priority 3: Use selected prompt styles from availablePromptStyles (fallback)
        else if (settings.availablePromptStyles && settings.availablePromptStyles.length > 0) {
            let stylesToUse = settings.availablePromptStyles;
            if (settings.selectedPromptStyles && settings.selectedPromptStyles.length > 0) {
                const firstItem = settings.selectedPromptStyles[0];
                if (typeof firstItem === 'string') {
                    const stringArray = settings.selectedPromptStyles;
                    stylesToUse = settings.availablePromptStyles.filter(style => stringArray.includes(style.id));
                }
                else {
                    stylesToUse = settings.selectedPromptStyles;
                }
            }
            if (stylesToUse.length > 0) {
                selectedPromptStyle = selectRandomPromptStyle(stylesToUse);
                if (selectedPromptStyle && selectedPromptStyle.prompt) {
                    promptToUse = selectedPromptStyle.prompt;
                    console.log(`[YapComment] Using prompt style: ${selectedPromptStyle.displayName} (${selectedPromptStyle.name})`);
                }
            }
        }
        // Use pre-initialised ContentAI when available (carries correct providerPriority)
        // otherwise build a fresh one from settings.
        const contentAI = existingAI ?? buildContentAI(settings);
        console.log(`[YapComment] Prioritizing provider: ${contentAI.providerName}`);
        // Determine style from selectedPromptStyle or fallback to settings
        let commentStyle = 'friendly'; // Default fallback
        if (selectedPromptStyle && selectedPromptStyle.name) {
            // Use style name directly as requested - no mapping logic
            commentStyle = selectedPromptStyle.name;
            console.log(`[YapComment] Using style from prompt style name: ${commentStyle}`);
        }
        else {
            // Fallback to settings.commentStyle if no prompt style selected
            commentStyle = settings.commentStyle || 'friendly';
            console.log(`[YapComment] Using fallback style from settings: ${commentStyle}`);
        }
        // Use ContentAI with custom prompt or database prompt
        const result = await contentAI.generateComment(postContent, {
            style: commentStyle,
            length: settings.commentLength || 'short',
            includeHashtags: settings.includeHashtags || false,
            maxHashtags: settings.maxHashtags || 2,
            includeMentions: settings.includeMentions || false,
            maxMentions: settings.maxMentions || 1,
            language: settings.aiLanguage || 'English',
            commentContent: commentContent,
            commentUsername: commentUsername
        }, promptToUse, settings.databasePrompt || undefined);
        if (result.success && result.content) {
            console.log(`[YapComment] Generated comment: "${result.content}"`);
            return result.content;
        }
        else {
            console.log('[YapComment] Failed to generate comment');
            return null;
        }
    }
    catch (error) {
        console.error('[YapComment] Error generating comment with user styles:', error);
        return null;
    }
}
/**
 * Select a random prompt style with weighted selection
 */
function selectRandomPromptStyle(availableStyles) {
    if (!availableStyles || availableStyles.length === 0)
        return null;
    // Weighted random selection based on the weight field
    const totalWeight = availableStyles.reduce((sum, style) => sum + (style.weight || 1), 0);
    let randomWeight = Math.random() * totalWeight;
    for (const style of availableStyles) {
        randomWeight -= (style.weight || 1);
        if (randomWeight <= 0) {
            return style;
        }
    }
    // Fallback to simple random selection
    const randomIndex = Math.floor(Math.random() * availableStyles.length);
    return availableStyles[randomIndex];
}
/**
 * Clean comment for BMP compatibility and remove formatting
 */
function cleanCommentForBMP(comment) {
    // Remove non-BMP characters (like legacy)
    let cleaned = comment.replace(/[\uD800-\uDFFF]/g, '');
    // Remove markdown formatting
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove **bold**
    cleaned = cleaned.replace(/\*(.*?)\*/g, '$1'); // Remove *italic*
    cleaned = cleaned.replace(/__(.*?)__/g, '$1'); // Remove __bold__
    cleaned = cleaned.replace(/_(.*?)_/g, '$1'); // Remove _italic_
    cleaned = cleaned.replace(/~~(.*?)~~/g, '$1'); // Remove ~~strikethrough~~
    cleaned = cleaned.replace(/`(.*?)`/g, '$1'); // Remove `code`
    cleaned = cleaned.replace(/```[\s\S]*?```/g, ''); // Remove code blocks
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove [link](url) -> link text only
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
}
/**
 * Generate reply to a comment
 */
async function generateReplyToComment(originalComment, commenterUsername, originalTweetContent, settings) {
    try {
        console.log('[YapComment] Generating reply to comment...');
        console.log(`[YapComment] Original tweet: "${originalTweetContent?.substring(0, 100)}..."`);
        console.log(`[YapComment] Comment to reply to: "${originalComment?.substring(0, 100)}..."`);
        console.log(`[YapComment] Commenter: @${commenterUsername}`);
        // Use the updated generateCommentWithUserStyles with comment content
        // This will properly handle both contexts and user settings
        const result = await generateCommentWithUserStyles(originalTweetContent, settings, originalComment, commenterUsername);
        if (result) {
            console.log(`[YapComment] Generated reply to comment: "${result}"`);
        }
        else {
            console.log('[YapComment] Failed to generate reply to comment');
        }
        return result;
    }
    catch (error) {
        console.error('[YapComment] Error generating reply:', error);
        return null;
    }
}
/**
 * Generate reply to a tweet comment (enhanced version for comment-to-comment replies)
 * Now uses generateCommentWithUserStyles with comment content
 */
async function generateReplyToTweetComment(commentContent, commentUsername, originalTweetContent, settings) {
    try {
        console.log('[YapComment] Generating reply to tweet comment...');
        console.log(`[YapComment] Comment content: "${commentContent?.substring(0, 100)}..."`);
        console.log(`[YapComment] Comment username: ${commentUsername}`);
        console.log(`[YapComment] Original tweet: "${originalTweetContent?.substring(0, 100)}..."`);
        // Use the updated generateCommentWithUserStyles with comment content
        const result = await generateCommentWithUserStyles(originalTweetContent, settings, commentContent, commentUsername);
        if (result) {
            console.log(`[YapComment] Generated reply to comment: "${result}"`);
        }
        else {
            console.log('[YapComment] Failed to generate reply to comment');
        }
        return result;
    }
    catch (error) {
        console.error('[YapComment] Error generating reply to tweet comment:', error);
        return null;
    }
}
