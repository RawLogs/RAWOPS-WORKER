import { WebDriver, WebElement } from 'selenium-webdriver';
import { BaseOps } from './base';
export interface FollowerDiscoveryOptions {
    maxFollowers?: number;
    smoothSpeed?: number;
    excludeUsernames?: string[];
    checkFollowStatus?: boolean;
    hoverToExtractInfo?: boolean;
}
export interface DiscoveredFollower {
    username: string;
    profileUrl: string;
    followInfo?: {
        followers: number;
        following: number;
    };
    followStatus?: {
        isFollowing: boolean;
        buttonText?: string;
        ariaLabel?: string;
        dataTestId?: string;
        reason?: string;
    };
    discoveredAt: string;
}
export interface FollowerDiscoveryResult {
    success: boolean;
    followers: DiscoveredFollower[];
    error?: string;
}
/**
 * FollowerDiscoveryOps class for discovering followers from verified followers pages
 * Ported from legacy followerDiscoveryService.js
 */
export declare class FollowerDiscoveryOps extends BaseOps {
    constructor(driver: WebDriver);
    /**
     * Parse count text (e.g., "1.2K" -> 1200, "5.5M" -> 5500000, "1,843" -> 1843)
     */
    private parseCount;
    /**
     * Navigate to verified followers page
     */
    navigateToVerifiedFollowers(profileUrl: string): Promise<boolean>;
    /**
     * Check if user is already being followed
     */
    checkFollowStatus(cell: WebElement, username: string): Promise<{
        isFollowing: boolean;
        buttonText?: string;
        ariaLabel?: string;
        dataTestId?: string;
        reason?: string;
    }>;
    /**
     * Hover over username and extract follow information
     */
    hoverAndExtractFollowInfo(cell: WebElement, username: string): Promise<{
        followers: number;
        following: number;
    } | null>;
    /**
     * Extract follower profiles from verified followers page
     */
    extractVerifiedFollowers(options?: FollowerDiscoveryOptions): Promise<FollowerDiscoveryResult>;
    /**
     * Discover verified followers from a profile
     */
    discoverVerifiedFollowers(profileUrl: string, options?: FollowerDiscoveryOptions): Promise<FollowerDiscoveryResult>;
}
