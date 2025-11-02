import { WebDriver } from 'selenium-webdriver';
import { BaseOps, InteractionResult, ClickOptions } from './base';
export interface PostOptions extends ClickOptions {
    content: string;
    scheduleTime?: Date;
    replyToTweetId?: string;
}
export declare class PostOps extends BaseOps {
    constructor(driver: WebDriver);
    /**
     * Post a direct tweet with anti-detection
     */
    postTweet(options: PostOptions): Promise<InteractionResult>;
    /**
     * Post a quote tweet
     */
    postQuoteTweet(originalTweetUrl: string, quoteContent: string): Promise<InteractionResult>;
    /**
     * Schedule a tweet for later posting
     */
    scheduleTweet(options: PostOptions): Promise<InteractionResult>;
    /**
     * Submit tweet with retry logic and anti-detection
     */
    private submitTweet;
}
