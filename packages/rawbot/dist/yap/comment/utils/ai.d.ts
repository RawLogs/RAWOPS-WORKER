import { YapCommentSettings } from '../cbp';
import { ContentAI, AnalysisAI } from '@rawops/rawai';
/**
 * Build a ContentAI instance from YapCommentSettings.
 * Same logic as CBP/CBL runYapCommentWorkflow — single source of truth.
 */
export declare function buildContentAI(settings: YapCommentSettings): ContentAI | null;
/** Same keys as ContentAI; used for CBL promotional-list matching without touching comment prompts. */
export declare function buildAnalysisAI(settings: YapCommentSettings): AnalysisAI | null;
export declare function getActivePromotionalUrlEntries(settings: YapCommentSettings): Array<{
    url: string;
    description: string;
}>;
/**
 * CBL: pick at most one promotional row that fits the post (Selenium-extracted text + optional reply snippet).
 */
export declare function resolvePromotionalInjectForCbl(postContent: string, replyContext: string | undefined, settings: YapCommentSettings): Promise<{
    url: string;
    description: string;
} | null>;
/**
 * Generate comment with user styles using available prompt styles.
 *
 * Pass `existingAI` (e.g. `this.contentAI` from the workflow class) to reuse the
 * already-initialised instance — that instance has the correct `providerPriority`
 * from `profileApiKeys.apiKeyPriority`.  When omitted the function builds a fresh
 * instance from `settings` (legacy behaviour).
 */
export declare function generateCommentWithUserStyles(postContent: string, settings: YapCommentSettings, commentContent?: string, commentUsername?: string, existingAI?: ContentAI | null, promotionalInject?: {
    url: string;
    description: string;
} | null): Promise<string | null>;
/**
 * Select a random prompt style with weighted selection
 */
export declare function selectRandomPromptStyle(availableStyles: any[]): any;
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
