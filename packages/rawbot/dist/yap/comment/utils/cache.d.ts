import type { WebDriver } from 'selenium-webdriver';
/**
 * Ensure cache directory exists
 */
export declare function ensureCacheDirectory(cacheDir: string): Promise<void>;
/**
 * Save data to cache file
 */
export declare function saveToCache(cacheDir: string, type: 'done' | 'failed', link: string, data: any): Promise<void>;
/**
 * Get the latest log timestamp for a session to optimize cache submission
 */
export declare function getLatestLogTimestamp(sessionId: string, profileId: string): Promise<Date | null>;
/**
 * Check if logs already exist for a session to avoid duplicate submissions
 * Returns a Map with link -> status for better filtering logic
 */
export declare function checkExistingLogs(sessionId: string, profileId: string, links: string[]): Promise<Map<string, string>>;
export declare function submitCacheToAPI(cacheDir: string, profileId: string, runId?: string, runType?: string, processedSettings?: {
    links: string[];
}): Promise<void>;
/**
 * Save individual link status to profile/comment-config API
 */
export declare function saveLinkStatusToAPI(profileId: string, link: string, status: 'done' | 'failed', details?: {
    liked?: boolean;
    commented?: boolean;
    followed?: boolean;
    error?: string;
}): Promise<void>;
/**
 * Submit a single link to interaction-logs API
 */
export declare function submitSingleLinkToInteractionLogs(profileId: string, link: string, status: 'done' | 'failed', details: {
    liked?: boolean;
    commented?: boolean;
    followed?: boolean;
    error?: string;
    runId?: string;
}, runType?: string): Promise<void>;
/**
 * Combined function to save cache and submit API calls in parallel using Promise.all
 * This optimizes performance by running multiple operations simultaneously
 */
export declare function saveCacheAndSubmitAPI(cacheDir: string, profileId: string, link: string, status: 'done' | 'failed', details: {
    liked?: boolean;
    commented?: boolean;
    followed?: boolean;
    error?: string;
    runId?: string;
}, runType?: string): Promise<{
    cacheSuccess: boolean;
    apiSuccess: boolean;
    interactionLogsSuccess: boolean;
    errors: string[];
}>;
/**
 * Update API with remaining links
 */
export declare function updateRemainingLinksAPI(profileId: string, remainingLinks: string[]): Promise<void>;
/**
 * Bulk update multiple links status to API (for batch operations)
 * This is more efficient than individual calls for large datasets
 */
export declare function bulkUpdateLinksStatusAPI(profileId: string, // Profile ID for API
profileHandle: string, // Profile handle for cache directory
doneLinks: string[], failedLinks: string[], originalLinks?: string[], runType?: string): Promise<void>;
/**
 * Enhance error details using ErrorDriver for "Unknown error" cases
 */
export declare function enhanceErrorDetails(driver: WebDriver, failedLinks: any[]): Promise<any[]>;
/**
 * Filter out already processed links from cache
 */
export declare function filterProcessedLinks(cacheDir: string, links: string[]): Promise<string[]>;
