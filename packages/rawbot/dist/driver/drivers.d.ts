import { WebDriver } from 'selenium-webdriver';
import { CommentOps, LikeOps, ScrollOps, ExtractionOps, UsernameExtractionOps, ProfileOps, CommentOptions, LikeOptions, ScrollOptions, ExtractionOptions, UsernameExtractionOptions, ExtractProfileOps, FollowOps, InteractionResult, TweetMetadata, UsernameSearchResult, ProfileData, FollowRatioResult } from '@rawops/rawops';
import { calculateFollowRatio } from '@rawops/rawops';
/**
 * Unified Drivers class that aggregates all driver operations from rawops package
 *
 * This class provides a centralized way to access all driver functionality
 * for use across different yap modules (comment, grow, etc.)
 *
 * Usage:
 * ```typescript
 * const drivers = new Drivers(driver);
 * await drivers.scroll.scrollToTop();
 * await drivers.like.likeFirstTweet();
 * await drivers.comment.commentOnFirstTweet('Hello');
 * await drivers.profile.followProfile();
 * const profileData = await drivers.profile.extractProfileData(url);
 * ```
 */
export declare class Drivers {
    private readonly _driver;
    readonly comment: CommentOps;
    readonly like: LikeOps;
    readonly scroll: ScrollOps;
    readonly extraction: ExtractionOps;
    readonly usernameExtraction: UsernameExtractionOps;
    readonly profile: ProfileOps;
    constructor(driver: WebDriver);
    /**
     * Get the underlying WebDriver instance
     */
    getDriver(): WebDriver;
    /**
     * Check if driver is initialized
     */
    isInitialized(): boolean;
}
export type { CommentOptions, LikeOptions, ScrollOptions, ExtractionOptions, UsernameExtractionOptions, ExtractProfileOps, FollowOps, InteractionResult, TweetMetadata, UsernameSearchResult, ProfileData, FollowRatioResult };
export { calculateFollowRatio };
