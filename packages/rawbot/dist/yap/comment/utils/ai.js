"use strict";
// packages/rawbot/src/yap/comment/utils/ai.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommentWithUserStyles = generateCommentWithUserStyles;
exports.selectRandomPromptStyle = selectRandomPromptStyle;
exports.cleanCommentForBMP = cleanCommentForBMP;
exports.generateReplyToComment = generateReplyToComment;
exports.generateReplyToTweetComment = generateReplyToTweetComment;
const rawai_1 = require("@rawops/rawai");
/**
 * Generate comment with user styles using available prompt styles
 */
async function generateCommentWithUserStyles(postContent, settings, commentContent, commentUsername) {
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
        if (!hasGeminiKey && !hasProfileKeys) {
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
            // Use selectedPromptStyles directly from prompt settings (already contains full data)
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
            // Filter availablePromptStyles based on selectedPromptStyles IDs
            let stylesToUse = settings.availablePromptStyles;
            // Note: This fallback assumes selectedPromptStyles is still string[] for backward compatibility
            // In the new system, selectedPromptStyles should be full objects from prompt settings
            if (settings.selectedPromptStyles && settings.selectedPromptStyles.length > 0) {
                // Check if selectedPromptStyles contains objects or strings
                const firstItem = settings.selectedPromptStyles[0];
                if (typeof firstItem === 'string') {
                    // Legacy string array - filter by IDs
                    const stringArray = settings.selectedPromptStyles;
                    stylesToUse = settings.availablePromptStyles.filter(style => stringArray.includes(style.id));
                }
                else {
                    // New object array - use directly (should not reach here due to Priority 2)
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
        // Initialize ContentAI with multi-provider config
        const aiConfig = {
            model: settings.aiModel || 'gemini-flash-latest'
        };
        if (settings.profileApiKeys) {
            console.log('[YapComment] Using multi-provider AI config');
            aiConfig.apiKeys = {
                gemini: settings.profileApiKeys.geminiApiKey,
                openai: settings.profileApiKeys.openaiApiKey,
                deepseek: settings.profileApiKeys.deepseekApiKey,
                huggingface: settings.profileApiKeys.huggingfaceApiKey
            };
            if (settings.profileApiKeys.apiKeyPriority) {
                aiConfig.providerPriority = settings.profileApiKeys.apiKeyPriority;
                console.log(`[YapComment] Provider priority: ${settings.profileApiKeys.apiKeyPriority.join(', ')}`);
            }
        }
        else {
            // Initialize empty apiKeys object if no profileApiKeys
            aiConfig.apiKeys = {};
        }
        // Map legacy geminiApiKey if not already present
        if (settings.geminiApiKey && !aiConfig.apiKeys.gemini) {
            console.log('[YapComment] Mapping legacy Gemini key to multi-provider config');
            aiConfig.apiKeys.gemini = settings.geminiApiKey;
        }
        // Ensure we have at least one provider if priority list is empty or missing
        if (!aiConfig.providerPriority && aiConfig.apiKeys.gemini) {
            aiConfig.providerPriority = ['gemini'];
        }
        const contentAI = new rawai_1.ContentAI(aiConfig);
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
