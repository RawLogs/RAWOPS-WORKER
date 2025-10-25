import { WebDriver } from 'selenium-webdriver';
import { BaseOps, InteractionResult, ClickOptions } from './base';
export interface CommentOptions extends ClickOptions {
    content: string;
    replyToTweetId?: string;
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
}
//# sourceMappingURL=comment.d.ts.map