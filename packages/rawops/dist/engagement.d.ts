import { WebDriver } from 'selenium-webdriver';
import { BaseOps, InteractionResult, ClickOptions } from './base';
export interface EngagementOptions extends ClickOptions {
}
export declare class EngagementOps extends BaseOps {
    constructor(driver: WebDriver);
    /**
     * Retweet the first tweet on the page with anti-detection
     */
    retweetFirstTweet(options?: EngagementOptions): Promise<InteractionResult>;
    /**
     * Bookmark the first tweet on the page with anti-detection
     */
    bookmarkFirstTweet(options?: EngagementOptions): Promise<InteractionResult>;
    /**
     * Share the first tweet on the page
     */
    shareFirstTweet(): Promise<InteractionResult>;
    /**
     * Follow a user from their profile with anti-detection
     */
    followUser(options?: EngagementOptions): Promise<InteractionResult>;
    /**
     * Unfollow a user
     */
    unfollowUser(): Promise<InteractionResult>;
    /**
     * Check if user is already followed
     */
    isUserFollowed(): Promise<boolean>;
    /**
     * Get engagement stats for first tweet
     */
    getTweetEngagement(): Promise<InteractionResult>;
}
//# sourceMappingURL=engagement.d.ts.map