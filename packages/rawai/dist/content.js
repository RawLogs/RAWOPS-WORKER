"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentAI = void 0;
const base_1 = require("./base");
class ContentAI extends base_1.BaseAI {
    constructor(config) {
        super(config);
    }
    /**
     * Generate comment/reply content with optional custom prompt or database prompt
     */
    async generateComment(originalTweet, options = {}, customPrompt, databasePrompt) {
        const { style = 'friendly', length = 'short', includeHashtags = false, maxHashtags = 2, includeMentions = true, maxMentions = 1, language = 'English', commentContent, commentUsername } = options;
        // Get randomized length for comment diversity (70% original, 30% other)
        const randomizedLength = this.getRandomizedLength(length);
        const wordLimits = this.getWordCountLimits(randomizedLength);
        let prompt = '';
        // Priority 1: Use database prompt if provided (with or without custom prompt)
        if (databasePrompt) {
            // Use database prompt with dynamic replacements
            let finalPrompt = databasePrompt.finalPrompt;
            // Replace placeholders in the database prompt
            // {style} should be replaced with customPrompt (promptToUse) if provided, otherwise use style parameter
            if (customPrompt) {
                finalPrompt = finalPrompt.replace(/\{style\}/g, customPrompt);
            }
            else {
                finalPrompt = finalPrompt.replace(/\{style\}/g, style);
            }
            finalPrompt = finalPrompt.replace(/\{length\}/g, randomizedLength);
            finalPrompt = finalPrompt.replace(/\{originalTweet\}/g, originalTweet);
            finalPrompt = finalPrompt.replace(/\{language\}/g, language);
            finalPrompt = finalPrompt.replace(/\{lengthGuidelines\}/g, this.getLengthGuidelines(randomizedLength));
            finalPrompt = finalPrompt.replace(/\{wordLimits\}/g, `${wordLimits.min}-${wordLimits.max}`);
            // Handle comment context if provided
            if (commentContent) {
                finalPrompt = finalPrompt.replace(/\{commentContent\}/g, commentContent);
                finalPrompt = finalPrompt.replace(/\{commentUsername\}/g, commentUsername || '');
            }
            else {
                // Remove comment context section if no comment provided
                finalPrompt = finalPrompt.replace(/CONTEXT:[\s\S]*?Your task is to generate a reply that responds appropriately to BOTH the original tweet content AND the specific comment\. Show understanding of the conversation flow and add value to the discussion while maintaining relevance to both contexts\./g, '');
            }
            // Build requirements using database requirePrompt + settings
            const requirements = this.buildRequirementsFromDatabase(databasePrompt.requirePrompt, style, randomizedLength, language, wordLimits, includeHashtags, maxHashtags, includeMentions, maxMentions);
            // If custom prompt is also provided, combine them
            if (customPrompt) {
                // Replace ${postContent} placeholder in custom prompt
                const processedCustomPrompt = customPrompt.replace('${postContent}', originalTweet);
                // Combine database prompt with custom prompt and requirements
                prompt = `${finalPrompt}\n\n${requirements}\n\nADDITIONAL CUSTOM INSTRUCTIONS:\n${processedCustomPrompt}`;
            }
            else {
                // Combine database prompt with requirements
                prompt = `${finalPrompt}\n\n${requirements}`;
            }
        }
        else {
            // NO FALLBACK - All prompts must come from database
            throw new Error('No database prompt provided. All prompts must come from database - no hardcoded fallbacks allowed.');
        }
        console.log(`[ContentAI] Prompt =============================:`, prompt);
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            result.content = this.cleanContent(result.content);
            // Post-process to ensure user settings are respected
            if (!includeHashtags) {
                result.content = result.content.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
            }
            if (!includeMentions) {
                result.content = result.content.replace(/@\w+/g, '').replace(/\s+/g, ' ').trim();
            }
        }
        return result;
    }
    /**
     * Build requirements from database requirePrompt + settings
     */
    buildRequirementsFromDatabase(requirePrompt, style, length, language, wordLimits, includeHashtags, maxHashtags, includeMentions, maxMentions) {
        // Replace placeholders in the database requirePrompt
        let requirements = requirePrompt;
        requirements = requirements.replace(/\{style\}/g, style);
        requirements = requirements.replace(/\{length\}/g, length);
        requirements = requirements.replace(/\{language\}/g, language);
        requirements = requirements.replace(/\{lengthGuidelines\}/g, this.getLengthGuidelines(length));
        requirements = requirements.replace(/\{wordLimits\}/g, `${wordLimits.min}-${wordLimits.max}`);
        // Replace hashtag and mention instructions with database templates
        if (includeHashtags) {
            requirements = requirements.replace(/\{maxHashtags\}/g, maxHashtags.toString());
        }
        else {
            // Remove hashtag instructions section if disabled
            requirements = requirements.replace(/HASHTAG INSTRUCTIONS:[\s\S]*?(?=MENTION INSTRUCTIONS:|$)/g, '');
        }
        if (includeMentions) {
            requirements = requirements.replace(/\{maxMentions\}/g, maxMentions.toString());
        }
        else {
            // Remove mention instructions section if disabled
            requirements = requirements.replace(/MENTION INSTRUCTIONS:[\s\S]*?(?=Generate ONLY|$)/g, '');
        }
        return requirements;
    }
    /**
     * Get length guidelines for different content types
     */
    getLengthGuidelines(length) {
        switch (length) {
            case 'short':
                return '5-20 words, very concise';
            case 'medium':
                return '20-50 words, 1-2 sentences';
            case 'long':
                return '50-100 words, 2-3 sentences';
            default:
                return '20-50 words, 1-2 sentences';
        }
    }
    /**
     * Get word count limits for different content lengths
     */
    getWordCountLimits(length) {
        switch (length) {
            case 'short':
                return { min: 3, max: 25 };
            case 'medium':
                return { min: 15, max: 60 };
            case 'long':
                return { min: 40, max: 120 };
            default:
                return { min: 15, max: 60 };
        }
    }
    /**
     * Get randomized length setting for comment diversity
     */
    getRandomizedLength(originalLength) {
        const random = Math.random();
        if (random <= 0.7) {
            // 70% chance to use original setting
            return originalLength;
        }
        else {
            // 30% chance to use other settings
            const otherLengths = ['short', 'medium', 'long'].filter(l => l !== originalLength);
            const randomIndex = Math.floor(Math.random() * otherLengths.length);
            return otherLengths[randomIndex];
        }
    }
}
exports.ContentAI = ContentAI;
//# sourceMappingURL=content.js.map