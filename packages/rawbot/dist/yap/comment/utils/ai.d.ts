import { YapCommentSettings } from '../cbp';
/**
 * Generate comment with user styles using available prompt styles
 */
export declare function generateCommentWithUserStyles(postContent: string, settings: YapCommentSettings, commentContent?: string, commentUsername?: string): Promise<string | null>;
/**
 * Select a random prompt style with weighted selection
 */
export declare function selectRandomPromptStyle(availableStyles: any[]): any;
/**
 * Generate comment using Gemini AI with model fallback
 */
export declare function generateCommentWithGemini(prompt: string, apiKey: string): Promise<string | null>;
/**
 * Clean comment for BMP compatibility and remove formatting
 */
export declare function cleanCommentForBMP(comment: string): string;
/**
 * Generate reply to a comment
 */
export declare function generateReplyToComment(originalComment: string, commenterUsername: string, originalTweetContent: string, settings: YapCommentSettings): Promise<string | null>;
/**
 * Generate reply to a tweet comment (enhanced version for comment-to-comment replies)
 * Now uses generateCommentWithUserStyles with comment content
 */
export declare function generateReplyToTweetComment(commentContent: string, commentUsername: string, originalTweetContent: string, settings: YapCommentSettings): Promise<string | null>;
//# sourceMappingURL=ai.d.ts.map