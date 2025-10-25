import { WebDriver } from 'selenium-webdriver';
import { BaseOps } from './base';
export interface ExtractionOptions {
    includeEmojis?: boolean;
    cleanContent?: boolean;
    username?: string;
    debugMode?: boolean;
}
export interface TweetMetadata {
    username: string;
    content: string;
    likeCount: number;
    retweetCount: number;
    replyCount: number;
    isReply: boolean;
    index: number;
    timestamp: string;
    element: any;
    tweetUrl?: string;
}
export declare class ExtractionOps extends BaseOps {
    constructor(driver: WebDriver);
    /**
     * Extract post content from the first tweet on the page (legacy integration)
     * This is the main method for content extraction with comprehensive fallback
     */
    getPostContent(options?: ExtractionOptions): Promise<string | null>;
    /**
     * Extract metadata from a tweet element (legacy integration)
     * This is the main method for extracting comprehensive tweet metadata
     */
    /**
     * Extract metadata from a tweet element (like xaicommentReplyService.js)
     * @param tweetElement - The tweet element
     * @param index - Index of the tweet
     * @returns Tweet metadata object
     */
    extractTweetMetadata(tweetElement: any, index: number): Promise<TweetMetadata | null>;
    /**
     * Detect reply comments in the current tweet page (legacy integration)
     * This is the main method for detecting and filtering reply comments
     */
    /**
     * Detect reply comments in the current tweet page (like xaicommentReplyService.js)
     * @returns {Promise<TweetMetadata[]>} Array of reply comment objects with metadata
     */
    detectReplyComments(): Promise<TweetMetadata[]>;
    /**
     * Clean extracted content to remove usernames and image descriptions (legacy integration)
     */
    protected cleanExtractedContent(content: string, username?: string | null): string;
    /**
     * Check if a reply comment is worth responding to based on criteria (legacy integration)
     */
    isReplyWorthResponding(replyComment: TweetMetadata, criteria?: {
        minLikeCount?: number;
        minReplyCount?: number;
        maxContentLength?: number;
        minContentLength?: number;
        excludeKeywords?: string[];
        requireKeywords?: string[];
    }): boolean;
    /**
     * Extract all tweets from current page (main tweet + replies)
     */
    extractAllTweets(): Promise<TweetMetadata[]>;
    /**
     * Extract only the main tweet (first tweet) from current page
     */
    extractMainTweet(): Promise<TweetMetadata | null>;
    /**
     * Extract only reply tweets (excluding main tweet) from current page
     */
    extractReplyTweets(): Promise<TweetMetadata[]>;
    /**
     * Get tweet count on current page
     */
    getTweetCount(): Promise<number>;
    /**
     * Check if current page has replies
     */
    hasReplies(): Promise<boolean>;
    /**
     * Check if the last cellInnerDiv contains a tweet from the current profile handle
     * This helps determine if we should reply to a comment instead of the main post
     */
    checkLastCellForProfileHandle(currentProfileHandle: string): Promise<{
        isLastCellFromProfile: boolean;
        lastCellContent: string | null;
        lastCellUsername: string | null;
    }>;
    /**
     * Find a random tweet from OTHER users (not current profile)
     * This helps determine if we should reply to a comment instead of the main post
     */
    findRandomTweetFromOtherUsers(currentProfileHandle: string): Promise<{
        hasOtherUserTweet: boolean;
        randomTweetContent: string | null;
        randomTweetUsername: string | null;
        randomTweetElement: any | null;
    }>;
    /**
     * Find the last tweet from OTHER users (not current profile) - LEGACY METHOD
     * This helps determine if we should reply to a comment instead of the main post
     */
    findLastTweetFromOtherUsers(currentProfileHandle: string): Promise<{
        hasOtherUserTweet: boolean;
        lastTweetContent: string | null;
        lastTweetUsername: string | null;
        lastTweetElement: any | null;
    }>;
    /**
     * Extract comment content from a specific tweet element for reply generation
     */
    extractCommentContentForReply(tweetElement: any): Promise<{
        commentContent: string | null;
        commentUsername: string | null;
        commentUrl: string | null;
    }>;
    /**
     * Extract tweet URL from current page
     */
    getCurrentTweetUrl(): Promise<string | null>;
}
//# sourceMappingURL=extraction.d.ts.map