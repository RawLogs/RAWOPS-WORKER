import { WebDriver } from 'selenium-webdriver';
import { BaseOps, InteractionResult, ClickOptions } from './base';
export interface CommentOptions extends ClickOptions {
    content: string;
    replyToTweetId?: string;
}
export interface TweetInteractionOptions {
    enableLike?: boolean;
    enableComment?: boolean;
    commentText?: string;
    useAntiDetection?: boolean;
    behavioralPattern?: 'reading' | 'browsing' | 'scanning' | 'casual' | 'focused';
    mouseIntensity?: 'low' | 'medium' | 'high';
}
export interface TweetInteractionResult {
    liked?: boolean;
    commented?: boolean;
}
export interface TweetInteractionData {
    element: any;
    link: string;
    statusId: string | null;
    cellInnerDiv: any;
}
export declare class CommentOps extends BaseOps {
    constructor(driver: WebDriver);
    /**
     * Comment on the first tweet on the page with anti-detection
     * This is the main method for commenting on tweets
     */
    commentOnFirstTweet(content: string, options?: Omit<CommentOptions, 'content'>): Promise<InteractionResult>;
    /**
     * Comment on a specific tweet by URL
     * Navigates to the tweet and then comments on it
     */
    commentOnTweetByUrl(tweetUrl: string, content: string, options?: Omit<CommentOptions, 'content'>): Promise<InteractionResult>;
    /**
     * Reply to a specific comment in a thread (enhanced with legacy logic)
     * This method handles replying to individual comments within a thread
     */
    replyToComment(commentElement: any, content: string, options?: Omit<CommentOptions, 'content'>): Promise<InteractionResult>;
    /**
     * Check if comment was posted successfully
     * This method verifies that a comment was successfully submitted using extraction methods
     */
    checkCommentSuccess(expectedContent?: string): Promise<InteractionResult>;
    /**
     * Submit comment with retry logic and anti-detection
     * This is the core method for submitting comments with comprehensive fallback strategies
     */
    private submitComment;
    /**
     * Process interaction with a specific tweet (like and comment)
     * Similar to processTweetInteractionWithArticle in cbp.ts
     */
    processTweetInteraction(tweetData: TweetInteractionData, options?: TweetInteractionOptions): Promise<TweetInteractionResult>;
}
//# sourceMappingURL=comment.d.ts.map