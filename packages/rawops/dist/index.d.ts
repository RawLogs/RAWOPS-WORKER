import { WebDriver } from 'selenium-webdriver';
import { BaseOps } from './base';
import { LikeOps } from './like';
import { PostOps } from './post';
import { CommentOps } from './comment';
import { SearchOps } from './search';
import { ScrollOps } from './scroll';
import { WaitOps } from './wait';
import { EngagementOps } from './engagement';
import { ExtractionOps } from './extraction';
import { UsernameExtractionOps } from './username-extraction';
import { ProfileOps } from './profile';
import { FollowerDiscoveryOps } from './discovery';
import { GrowOps } from './grow';
import { ErrorDriver } from './error-driver';
import { AntiDetectionIntegration, createAntiDetection, quickScrollWithMouse, quickClickWithMouse, simulateBrowsingSession, BEHAVIORAL_PATTERNS } from './anti-detection';
import { setupBrowser, randomDelay, parseProxyString } from './selenium-utils';
import { smoothRandomScroll } from './scroll';
import type { ProxyConfig } from './selenium-utils';
import { detectIPLocation, generateSynchronizedConfig, generateUserAgent, getActualScreenResolution, POPULAR_USER_AGENTS, DEFAULT_USER_AGENT } from './config/userAgentConfig';
import type { ProxyConfig as ProxyConfigAdvanced, LocationInfo, SynchronizedConfig } from './config/userAgentConfig';
export { BaseOps, LikeOps, PostOps, CommentOps, SearchOps, ScrollOps, WaitOps, EngagementOps, ExtractionOps, UsernameExtractionOps, ProfileOps, FollowerDiscoveryOps, GrowOps, ErrorDriver };
export { extractErrorDetails, hasPageError } from './error-driver';
export { calculateFollowRatio } from './profile';
export { AntiDetectionIntegration, createAntiDetection, quickScrollWithMouse, quickClickWithMouse, simulateBrowsingSession, BEHAVIORAL_PATTERNS };
export { setupBrowser, randomDelay, parseProxyString };
export { smoothRandomScroll };
export type { ProxyConfig };
export { detectIPLocation, generateSynchronizedConfig, generateUserAgent, getActualScreenResolution, POPULAR_USER_AGENTS, DEFAULT_USER_AGENT };
export type { ProxyConfigAdvanced, LocationInfo, SynchronizedConfig };
export type { InteractionResult, ScrollOptions, WaitOptions, ClickOptions } from './base';
export type { PostOptions } from './post';
export type { CommentOptions, TweetInteractionOptions, TweetInteractionResult, TweetInteractionData } from './comment';
export type { LikeOptions } from './like';
export type { EngagementOptions } from './engagement';
export type { SearchOptions, TweetData } from './search';
export type { ExtractionOptions, TweetMetadata } from './extraction';
export type { UsernameExtractionOptions, UsernameSearchResult } from './username-extraction';
export type { ProfileData, ExtractProfileOps, FollowOps, FollowRatioResult } from './profile';
export type { FollowerDiscoveryOptions, DiscoveredFollower, FollowerDiscoveryResult } from './discovery';
export type { ParseUrlResult, ScrollAndDetectTweetsByTimeOptions, FilteredTweet, ScrollAndDetectTweetsByTimeResult } from './grow';
export type { ErrorDetail, ErrorDriverOptions } from './error-driver';
export type { MouseMovementOptions, ScrollWithMouseOptions, ClickWithMouseOptions, BehavioralPattern } from './anti-detection';
/**
 * Main RawOps class that combines all operations
 */
export declare class RawOps {
    readonly like: LikeOps;
    readonly post: PostOps;
    readonly comment: CommentOps;
    readonly search: SearchOps;
    readonly scroll: ScrollOps;
    readonly wait: WaitOps;
    readonly engagement: EngagementOps;
    readonly extraction: ExtractionOps;
    readonly usernameExtraction: UsernameExtractionOps;
    readonly profile: ProfileOps;
    readonly followerDiscovery: FollowerDiscoveryOps;
    readonly grow: GrowOps;
    readonly errorDriver: ErrorDriver;
    readonly antiDetection: AntiDetectionIntegration;
    private driver;
    constructor(driver: WebDriver, initialBehavioralPattern?: string);
    /**
     * Navigate to Twitter/X
     */
    navigateToTwitter(): Promise<void>;
    /**
     * Navigate to home feed
     */
    navigateToHome(): Promise<void>;
    /**
     * Navigate to user profile
     */
    navigateToProfile(username: string): Promise<void>;
    /**
     * Get current page URL
     */
    getCurrentUrl(): Promise<string>;
    /**
     * Switch behavioral pattern for anti-detection
     */
    switchBehavioralPattern(pattern: string): void;
    /**
     * Get current behavioral pattern
     */
    getCurrentBehavioralPattern(): 'reading' | 'browsing' | 'scanning' | 'casual' | 'focused';
    /**
     * Get anti-detection session statistics
     */
    getAntiDetectionStats(): {
        duration: number;
        interactions: number;
        pattern: string;
        avgInteractionInterval: number;
    };
    /**
     * Simulate realistic browsing session with multiple actions
     */
    simulateBrowsingSession(actions: Array<() => Promise<void>>): Promise<void>;
    /**
     * Close the browser
     */
    close(): Promise<void>;
}
