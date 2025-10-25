import { WebDriver } from 'selenium-webdriver';
import { BaseOps, InteractionResult, ClickOptions } from './base';
export interface LikeOptions extends ClickOptions {
}
export declare class LikeOps extends BaseOps {
    constructor(driver: WebDriver);
    /**
     * Like a tweet by targeting the first tweet on the page with anti-detection
     */
    likeFirstTweet(options?: LikeOptions): Promise<InteractionResult>;
    /**
     * Like a specific tweet by its element with anti-detection
     */
    likeTweetByElement(tweetElement: any, options?: LikeOptions): Promise<InteractionResult>;
    /**
     * Check if a tweet is already liked
     */
    isTweetLiked(): Promise<boolean>;
    /**
     * Unlike a tweet if it's currently liked with anti-detection
     */
    unlikeFirstTweet(options?: LikeOptions): Promise<InteractionResult>;
}
//# sourceMappingURL=like.d.ts.map