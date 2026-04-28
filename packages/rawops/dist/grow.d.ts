import { WebDriver } from 'selenium-webdriver';
import { BaseOps, InteractionResult } from './base';
export interface ParseUrlResult {
    profileUrl: string;
    statusId: string | null;
    username: string | null;
}
export interface ScrollAndDetectTweetsByTimeOptions {
    maxScrollSteps?: number;
    detectLimit?: number;
    timeFilterHours?: number;
    targetStatusId?: string | null;
    enableLike?: boolean;
    enableComment?: boolean;
}
export interface FilteredTweet {
    element: any;
    link: string;
    statusId: string | null;
    cellInnerDiv: any;
    timestamp: Date | null;
}
export interface ScrollAndDetectTweetsByTimeResult {
    success: boolean;
    filteredTweets: FilteredTweet[];
    targetTweet: FilteredTweet | null;
    error?: string;
}
/**
 * GrowOps - Operations for grow workflow automation
 * Provides methods for navigation, scrolling, interaction, and discovery
 */
export declare class GrowOps extends BaseOps {
    constructor(driver: WebDriver);
    /**
     * Parse status / snowflake id from tweet href (relative or absolute, web status URLs).
     */
    parseStatusIdFromTweetHref(link: string | null | undefined): string | null;
    /**
     * Approximate tweet time from X snowflake id when <time datetime> is missing.
     */
    approximateUtcDateFromStatusSnowflake(statusId: string | null | undefined): Date | null;
    /**
     * Scroll profile / home primary column to top so the first paint is latest tweets (not mid-timeline after random scroll).
     */
    scrollPrimaryTimelineToTop(): Promise<void>;
    /**
     * Parse X/Twitter URL to extract profile URL and status ID
     * Normalizes URLs to x.com format
     */
    parseTwitterUrl(url: string): ParseUrlResult;
    /**
     * Navigate to profile URL (parsed from any Twitter URL format)
     */
    navigateToProfileUrl(url: string): Promise<InteractionResult>;
    /**
     * Navigate to URL directly without parsing (mode 1: default)
     */
    navigateToUrl(url: string | number, resolveVariable?: (varName: string | number) => any): Promise<InteractionResult>;
    /**
     * Navigate to URL with variable resolution and context management (mode 2: parse URL)
     * Returns parsed URL data for context updates
     */
    navigateWithContext(url: string | number, resolveVariable?: (varName: string | number) => any): Promise<{
        success: boolean;
        parsed?: ParseUrlResult;
        error?: string;
    }>;
    /**
     * Follow user with status checking and context management
     * Returns follow status for context updates
     */
    followWithStatus(options?: {
        useAntiDetection?: boolean;
        behavioralPattern?: 'reading' | 'browsing' | 'scanning' | 'casual' | 'focused';
        mouseIntensity?: 'low' | 'medium' | 'high';
        checkStatusFirst?: boolean;
        onStatusCheck?: (isFollowing: boolean) => Promise<void>;
    }): Promise<{
        success: boolean;
        isFollowing: boolean;
        error?: string;
    }>;
    /**
     * Scroll to element by selector
     */
    scrollToElement(selector: string, by?: 'css' | 'xpath'): Promise<InteractionResult>;
    /**
     * Extract timestamp from tweet element
     * Handles stale element errors by retrying with fresh element lookup
     * Based on actual HTML structure: <time datetime="2025-10-23T10:04:10.000Z">Oct 23</time>
     */
    extractTweetTimestamp(tweetElement: any, link?: string, maxRetries?: number): Promise<Date | null>;
    /**
     * Filter tweets by time (within last N hours)
     * Uses timestamp from detectedTweets if available, otherwise extracts from element
     */
    filterTweetsByTime(tweets: Array<{
        element: any;
        link: string;
        statusId: string | null;
        cellInnerDiv: any;
        timestamp?: string | null;
    }>, timeFilterHours: number): Promise<FilteredTweet[]>;
    /**
     * Read <time datetime> for a status id from the live DOM (permalink row: <a href=".../status/id"><time>…</time></a>).
     */
    extractTweetTimestampFromPageByStatusId(statusId: string): Promise<Date | null>;
    /**
     * Read tweet body from the live DOM by status id (no WebElement from an earlier scroll).
     * Avoids StaleElementReference after timeline re-renders.
     * Uses (1) status links under the page and (2) the first 20 [data-testid="cellInnerDiv"] rows
     * (X timeline layout; see RAWOPS-AI/.html) so text is resolved from the live DOM only.
     */
    extractPostContentFromPageByStatusId(statusId: string): Promise<string | null>;
    /**
     * Scroll the tweet with this status id into view (DOM query only).
     */
    scrollToTweetByStatusId(statusId: string): Promise<InteractionResult>;
    /**
     * Re-resolve tweet WebElements after scroll/virtualization (same status id).
     */
    refreshTweetElementsByStatusId(statusId: string): Promise<{
        element: any;
        cellInnerDiv: any;
        link: string;
        statusId: string;
    } | null>;
    /**
     * Scroll into view and replace possibly-stale element handles before like/comment/extract.
     */
    ensureFreshTweetRefsForInteraction(tweet: {
        element: any;
        link: string;
        statusId: string | null;
        cellInnerDiv: any;
    }): Promise<typeof tweet>;
    /**
     * Extract post text using only link / status id (no WebElement — avoids stale after virtualization).
     */
    extractPostContentByMeta(meta: {
        link: string;
        statusId?: string | null;
    }): Promise<string | null>;
    /**
     * Legacy signature: WebElement is ignored — only link/statusId (avoids StaleElementReference entirely).
     */
    extractPostContent(_tweetElement: any, meta?: {
        link?: string;
        statusId?: string | null;
    }): Promise<string | null>;
    /**
     * Scroll to tweet element
     */
    scrollToTweet(cellInnerDiv: any): Promise<InteractionResult>;
    /**
     * Extract status ID from various sources (params, context, URL)
     */
    extractStatusId(options: {
        params?: {
            target_status_id?: string | null;
            targetStatusId?: string | null;
        };
        context?: {
            target_status_id?: string | null;
            current_link?: string | null;
        };
    }): string | null;
}
