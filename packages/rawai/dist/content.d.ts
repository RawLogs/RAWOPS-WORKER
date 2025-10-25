import { BaseAI, AIResult, AIConfig } from './base';
export interface PromptConfig {
    profileId: string;
    type: string;
    apiBaseUrl?: string;
    apiKey?: string;
}
export interface ContentOptions {
    style?: 'casual' | 'professional' | 'enthusiastic' | 'analytical' | 'friendly';
    length?: 'short' | 'medium' | 'long';
    includeHashtags?: boolean;
    maxHashtags?: number;
    includeMentions?: boolean;
    maxMentions?: number;
    language?: string;
    commentContent?: string;
    commentUsername?: string;
}
export interface TweetContentOptions extends ContentOptions {
    replyTo?: string;
    quoteTweet?: boolean;
    originalContent?: string;
}
export declare class ContentAI extends BaseAI {
    constructor(config: AIConfig);
    /**
     * Generate comment/reply content with optional custom prompt or database prompt
     */
    generateComment(originalTweet: string, options?: ContentOptions, customPrompt?: string, databasePrompt?: {
        finalPrompt: string;
        requirePrompt: string;
    }): Promise<AIResult>;
    /**
     * Build requirements from database requirePrompt + settings
     */
    private buildRequirementsFromDatabase;
    /**
     * Get length guidelines for different content types
     */
    private getLengthGuidelines;
    /**
     * Get word count limits for different content lengths
     */
    private getWordCountLimits;
    /**
     * Get randomized length setting for comment diversity
     */
    private getRandomizedLength;
}
//# sourceMappingURL=content.d.ts.map