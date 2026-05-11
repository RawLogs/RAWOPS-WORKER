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
 * Marker inside a promotional row `description`. Any **active list row** whose
 * description contains this token contributes the text **after** the marker as
 * owner rules: they are **prepended** to the style prompt so the model reads them
 * first (e.g. “mọi comment phải có link shill”), including when no inject URL was
 * chosen for this reply. Text before the marker stays relevance-only for fit/inject;
 * http(s) URLs are stripped from segments sent to the model (URL is on the inject line).
 */
export declare const RAWOPS_IMPORTANT_PROMPT = "RAWOPS_IMPORTANT_PROMPT";
export declare function stripHttpUrlsFromText(text: string): string;
/**
 * Split optional owner prompt from CBL description; always strip http(s) URLs from
 * segments sent to the model (avoids duplicating the URL next to the dedicated inject line).
 */
export declare function splitPromotionalDescriptionForPipeline(description: string): {
    relevanceForInjectAndSelection: string;
    userPriorityAddon: string;
};
/**
 * True if posted text contains any active promotional list URL (substring), including
 * common variants (with/without https, www). Used to report shill stats when the
 * inject step returned null but the model still included a list URL.
 * X/Twitter: matches twitter.com vs x.com and ignores ?s=20 etc. when the status id matches.
 */
export declare function commentTextContainsPromotionalUrl(commentText: string | undefined, settings: YapCommentSettings): boolean;
/**
 * CBL: pick at most one promotional row that fits the post (Selenium-extracted text + optional reply snippet).
 */
export declare function resolvePromotionalInjectForCbl(postContent: string, replyContext: string | undefined, settings: YapCommentSettings): Promise<{
    url: string;
    description: string;
} | null>;
/**
 * When AI selection returns null (no “fit” row) but the list is non-empty, pick a row so
 * generation still gets PROMOTIONAL LINK lines. Prefers a row whose description contains
 * {@link RAWOPS_IMPORTANT_PROMPT}; otherwise the first active entry.
 */
export declare function getPromotionalInjectFallbackForCbl(settings: YapCommentSettings): {
    url: string;
    description: string;
} | null;
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
