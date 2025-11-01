import { WebDriver } from 'selenium-webdriver';
import { BaseOps, InteractionResult, ClickOptions } from './base';
export interface ProfileData {
    url: string;
    username: string;
    followers_count: number;
    following_count: number;
    bio: string;
    tweets: Array<{
        content: string;
        url: string;
        comment_count: number;
        like_count: number;
        retweet_count: number;
        date: Date | null;
    }>;
    extracted_at: string;
}
export interface ExtractProfileOps {
    maxTweets?: number;
}
export interface FollowOps extends ClickOptions {
}
export interface FollowRatioResult {
    ratio: number;
    followersCount: number;
    followingCount: number;
}
/**
 * ProfileOps class for profile-related operations
 * Includes profile extraction, follow/unfollow, and profile analysis
 */
export declare class ProfileOps extends BaseOps {
    constructor(driver: WebDriver);
    /**
     * Parse count text (e.g., "1.2K" -> 1200, "5.5M" -> 5500000, "1,843" -> 1843)
     */
    private parseCount;
    /**
     * Extract profile data from X profile page
     * Note: This method assumes the page is already loaded. Use ScrollOps separately if you need to scroll.
     * Similar to extractProfileData from legacy_nodejs.js
     */
    extractProfileData(profileUrl: string, options?: ExtractProfileOps): Promise<ProfileData | null>;
    /**
     * Check if already following the profile
     * Similar to isAlreadyFollowing from legacy_nodejs.js
     */
    isAlreadyFollowing(): Promise<boolean>;
    /**
     * Follow a profile using multiple selectors with anti-detection
     * Similar to followProfile from legacy_nodejs.js
     */
    followProfile(options?: FollowOps): Promise<InteractionResult>;
}
/**
 * Calculate follow ratio based on followers and following count
 * Similar to calculateFollowRatio from legacy_nodejs.js
 */
export declare function calculateFollowRatio(followersCount: number, followingCount: number): FollowRatioResult;
//# sourceMappingURL=profile.d.ts.map