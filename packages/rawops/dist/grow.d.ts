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
     * Extract post content from tweet element
     */
    extractPostContent(tweetElement: any): Promise<string | null>;
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
