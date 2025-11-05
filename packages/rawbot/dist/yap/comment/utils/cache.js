"use strict";
// packages/rawbot/src/yap/comment/utils/cache-utils.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCacheDirectory = ensureCacheDirectory;
exports.saveToCache = saveToCache;
exports.getLatestLogTimestamp = getLatestLogTimestamp;
exports.checkExistingLogs = checkExistingLogs;
exports.submitCacheToAPI = submitCacheToAPI;
exports.saveLinkStatusToAPI = saveLinkStatusToAPI;
exports.submitSingleLinkToInteractionLogs = submitSingleLinkToInteractionLogs;
exports.saveCacheAndSubmitAPI = saveCacheAndSubmitAPI;
exports.updateRemainingLinksAPI = updateRemainingLinksAPI;
exports.bulkUpdateLinksStatusAPI = bulkUpdateLinksStatusAPI;
exports.enhanceErrorDetails = enhanceErrorDetails;
exports.filterProcessedLinks = filterProcessedLinks;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Get API base URL from environment variable
 * Throws error if WEB_API_URL is not set
 */
function getApiBaseUrl() {
    const baseUrl = process.env.WEB_API_URL;
    if (!baseUrl) {
        throw new Error('WEB_API_URL environment variable is required');
    }
    return baseUrl;
}
/**
 * Helper function to handle fetch timeout errors gracefully
 */
function handleFetchTimeout(error, operation) {
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        console.log(`[YapComment] ⏱️ ${operation} timed out after 10 seconds - continuing without API update`);
    }
    else if (error.name === 'AbortError') {
        console.log(`[YapComment] ⏱️ ${operation} was aborted - continuing without API update`);
    }
    else if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.log(`[YapComment] 🌐 ${operation} failed due to network issue (${error.code}) - continuing without API update`);
    }
    else if (error.message?.includes('fetch failed')) {
        console.log(`[YapComment] 🌐 ${operation} failed due to network issue - continuing without API update`);
    }
    else {
        console.error(`[YapComment] Error in ${operation}:`, error);
    }
}
const rawops_1 = require("@rawops/rawops");
/**
 * Ensure cache directory exists
 */
async function ensureCacheDirectory(cacheDir) {
    try {
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
            console.log(`[YapComment] Created cache directory: ${cacheDir}`);
        }
    }
    catch (error) {
        console.error('[YapComment] Error creating cache directory:', error);
    }
}
/**
 * Save data to cache file
 */
async function saveToCache(cacheDir, type, link, data) {
    try {
        const filePath = path.join(cacheDir, `${type}.json`);
        let existingData = [];
        // Read existing data
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            existingData = JSON.parse(fileContent);
        }
        // Check if this URL already exists (for logging purposes)
        const existingEntry = existingData.find((item) => item.url === link);
        const wasUpdate = !!existingEntry;
        // Remove any existing entries for the same URL to avoid duplicates
        existingData = existingData.filter((item) => item.url !== link);
        // Add new entry - normalize follow/followed fields
        const entry = {
            url: link,
            timestamp: new Date().toISOString(),
            runId: data.runId || null, // Add runId to track which run this belongs to
            liked: data.liked || false,
            commented: data.commented || false,
            followed: data.followed || false, // Support both 'followed' and 'follow' fields
            ...data
        };
        existingData.push(entry);
        // Keep only last 2 days of data
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const filteredData = existingData.filter((item) => new Date(item.timestamp) > twoDaysAgo);
        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(filteredData, null, 2));
    }
    catch (error) {
        console.error(`[YapComment] Error saving to ${type} cache:`, error);
    }
}
/**
 * Get the latest log timestamp for a session to optimize cache submission
 */
async function getLatestLogTimestamp(sessionId, profileId) {
    try {
        const response = await fetch(`${getApiBaseUrl()}/interaction-logs?sessionId=${sessionId}&profileId=${profileId}&limit=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.API_KEY}`
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        if (response.ok) {
            const logs = await response.json();
            if (logs.length > 0) {
                const latestTimestamp = new Date(logs[0].processedAt);
                return latestTimestamp;
            }
        }
        return null;
    }
    catch (error) {
        console.error('[YapComment] Error getting latest log timestamp:', error);
        return null;
    }
}
/**
 * Check if logs already exist for a session to avoid duplicate submissions
 * Returns a Map with link -> status for better filtering logic
 */
async function checkExistingLogs(sessionId, profileId, links) {
    try {
        const response = await fetch(`${getApiBaseUrl()}/interaction-logs?sessionId=${sessionId}&profileId=${profileId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.API_KEY}`
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        if (response.ok) {
            const existingLogs = await response.json();
            const existingLinksMap = new Map(existingLogs.map(log => [log.link, log.status]));
            return existingLinksMap;
        }
        else {
            return new Map();
        }
    }
    catch (error) {
        console.error('[YapComment] Error checking existing logs:', error);
        return new Map();
    }
}
async function submitCacheToAPI(profileId, profileHandle, runId, runType = 'COMMENT', processedSettings) {
    const serviceName = runType === 'GROW' ? 'YapGrow' : 'YapComment';
    try {
        const cacheDir = path.join(process.cwd(), 'cache', `profile_${profileHandle}`);
        const donePath = path.join(cacheDir, 'done.json');
        const failedPath = path.join(cacheDir, 'failed.json');
        let doneLinks = [];
        let failedLinks = [];
        // Read done links
        if (fs.existsSync(donePath)) {
            const doneData = JSON.parse(fs.readFileSync(donePath, 'utf8'));
            // Filter to only include links from current run if runId is provided
            doneLinks = runId ? doneData.filter((item) => item.runId === runId) : doneData;
        }
        // Read failed links
        if (fs.existsSync(failedPath)) {
            const failedData = JSON.parse(fs.readFileSync(failedPath, 'utf8'));
            // Filter to only include links from current run if runId is provided
            failedLinks = runId ? failedData.filter((item) => item.runId === runId) : failedData;
        }
        if (doneLinks.length === 0 && failedLinks.length === 0) {
            return {
                success: true,
                submitted: { done: 0, failed: 0 },
                message: 'No cache data to submit'
            };
        }
        // Create interaction session if runId is provided
        let sessionId = null;
        if (runId) {
            try {
                const sessionResponse = await fetch(`${getApiBaseUrl()}/interaction-sessions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.API_KEY}`
                    },
                    body: JSON.stringify({
                        profileId: profileId,
                        runId: runId,
                        type: runType,
                        totalLinks: doneLinks.length + failedLinks.length
                    }),
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });
                if (sessionResponse.ok) {
                    const sessionData = await sessionResponse.json();
                    sessionId = sessionData.id;
                }
            }
            catch (error) {
                handleFetchTimeout(error, `${serviceName} creating interaction session`);
            }
        }
        // Submit logs to interaction logs API
        if (sessionId) {
            try {
                // Get all links from original input instead of cache
                const originalInputLinks = processedSettings?.links || [];
                if (originalInputLinks.length === 0) {
                    return {
                        success: true,
                        submitted: { done: 0, failed: 0 },
                        message: 'No original input links to check'
                    };
                }
                // Step 1: Get list of links that are NOT already in database with DONE status
                const pendingResponse = await fetch(`${getApiBaseUrl()}/interaction-logs/pending`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.API_KEY}`
                    },
                    body: JSON.stringify({
                        profileId: profileId,
                        links: originalInputLinks
                    }),
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });
                let pendingLinks = [];
                if (pendingResponse.ok) {
                    const pendingData = await pendingResponse.json();
                    pendingLinks = pendingData.pendingLinks;
                }
                else {
                    // Fallback: use all cache links if API fails
                    pendingLinks = originalInputLinks;
                }
                if (pendingLinks.length === 0) {
                    return {
                        success: true,
                        submitted: { done: 0, failed: 0 },
                        message: 'No pending links found - all links already exist in database'
                    };
                }
                // Step 2: Filter cache to only include links that:
                // - Are in pendingLinks (not in DB or not DONE in DB)
                // - AND have data in cache (done.json or failed.json)
                const pendingLinksSet = new Set(pendingLinks);
                // Filter cache entries to only include links that are BOTH:
                // 1. In pending list (need to be submitted)
                // 2. In cache (already processed)
                const filteredDoneLinks = doneLinks.filter((item) => pendingLinksSet.has(item.url));
                const filteredFailedLinks = failedLinks.filter((item) => pendingLinksSet.has(item.url));
                // Step 3: Only submit if there are links that meet the criteria
                if (filteredDoneLinks.length === 0 && filteredFailedLinks.length === 0) {
                    return {
                        success: true,
                        submitted: { done: 0, failed: 0 },
                        message: 'No cache entries match pending links - nothing to submit'
                    };
                }
                const newDoneLinks = filteredDoneLinks;
                const newFailedLinks = filteredFailedLinks;
                const logs = [
                    ...newDoneLinks.map((item) => ({
                        link: item.url,
                        type: runType,
                        action: 'SUCCESS',
                        status: 'DONE',
                        details: {
                            timestamp: new Date().toISOString(),
                            commentPosted: item.commented || false,
                            likePosted: item.liked || false,
                            followedPosted: item.followed || false
                        }
                    })),
                    ...newFailedLinks.map((item) => {
                        const errorText = item.error || item.reason || 'Unknown error';
                        return {
                            link: item.url,
                            type: runType,
                            action: 'FAILED',
                            status: 'FAIL',
                            details: {
                                timestamp: new Date().toISOString(),
                                reason: errorText,
                                error: errorText
                            }
                        };
                    })
                ];
                const logsResponse = await fetch(`${getApiBaseUrl()}/interaction-logs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.API_KEY}`
                    },
                    body: JSON.stringify({
                        sessionId: sessionId,
                        profileId: profileId,
                        logs: logs
                    }),
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });
                let submittedDone = 0;
                let submittedFailed = 0;
                if (logsResponse.ok) {
                    const result = await logsResponse.json();
                    submittedDone = result.success;
                    submittedFailed = result.failed;
                    // Return early if interaction logs API succeeded
                    return {
                        success: true,
                        submitted: { done: submittedDone, failed: submittedFailed },
                        message: `Successfully submitted ${submittedDone} done and ${submittedFailed} failed links to interaction logs API`
                    };
                }
            }
            catch (error) {
                handleFetchTimeout(error, `${serviceName} submitting interaction logs`);
            }
        }
        // Fallback: Submit to legacy API as backup (comment-config for COMMENT, grow-settings for GROW)
        // This ensures data is saved even if individual link submissions failed
        try {
            // Use the already filtered links from current run (doneLinks and failedLinks are already filtered by runId above)
            const currentRunDoneLinks = doneLinks;
            const currentRunFailedLinks = failedLinks;
            // Calculate remaining links from processedSettings if provided
            let remainingLinks = [];
            if (processedSettings?.links) {
                const processedUrls = [...currentRunDoneLinks.map((item) => item.url), ...currentRunFailedLinks.map((item) => item.url)];
                remainingLinks = processedSettings.links.filter(link => !processedUrls.includes(link));
            }
            // Use bulk update for efficiency and proper merging
            await bulkUpdateLinksStatusAPI(profileId, profileId, // Use profileId as handle for now (TODO: get actual handle)
            currentRunDoneLinks.map((item) => item.url), currentRunFailedLinks.map((item) => {
                const reason = item.error || item.reason || 'Unknown error';
                return `${item.url} (${reason})`;
            }), processedSettings?.links, // Pass original input links for filtering
            runType // Pass runType to choose correct API endpoint
            );
            // Return result from legacy API fallback
            return {
                success: true,
                submitted: {
                    done: currentRunDoneLinks.length,
                    failed: currentRunFailedLinks.length
                },
                message: `Submitted ${currentRunDoneLinks.length} done and ${currentRunFailedLinks.length} failed links via legacy API fallback`
            };
        }
        catch (apiError) {
            console.error(`[${serviceName}] Fallback legacy API call failed:`, apiError);
            return {
                success: false,
                submitted: { done: 0, failed: 0 },
                message: `Legacy API fallback failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`
            };
        }
    }
    catch (error) {
        console.error(`[${serviceName}] Error submitting cache to API:`, error);
        return {
            success: false,
            submitted: { done: 0, failed: 0 },
            message: `Error submitting cache to API: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
/**
 * Save individual link status to profile/comment-config API
 */
async function saveLinkStatusToAPI(profileId, link, status, details) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // console.log(`[YapComment] Saving link status to API: ${link} -> ${status} (attempt ${attempt}/${maxRetries})`);
            // Get current comment config to preserve existing data
            const getResponse = await fetch(`${getApiBaseUrl()}/profile/comment-config?profileId=${profileId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.API_KEY}`
                },
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            let currentLinks = [];
            let currentDone = [];
            let currentFailed = [];
            if (getResponse.ok) {
                const config = await getResponse.json();
                currentLinks = config.links || [];
                currentDone = config.done || [];
                currentFailed = config.failed || [];
            }
            // Update the arrays based on status
            if (status === 'done') {
                // Remove from failed if it was there, add to done if not already there
                currentFailed = currentFailed.filter(url => url !== link && !url.startsWith(link));
                if (!currentDone.includes(link)) {
                    currentDone.push(link);
                }
            }
            else if (status === 'failed') {
                // Remove from done if it was there, add to failed if not already there
                currentDone = currentDone.filter(url => url !== link);
                const reason = details?.error || 'Unknown error';
                const failedLinkWithReason = `${link} (${reason})`;
                // Remove any existing entry for this link (with or without reason)
                currentFailed = currentFailed.filter(url => url !== link && !url.startsWith(link));
                if (!currentFailed.includes(failedLinkWithReason)) {
                    currentFailed.push(failedLinkWithReason);
                }
            }
            // Update the API with the new status
            const response = await fetch(`${getApiBaseUrl()}/profile/comment-config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.API_KEY}`
                },
                body: JSON.stringify({
                    profileId: profileId,
                    links: currentLinks, // Keep existing links
                    done: currentDone, // Updated done array
                    failed: currentFailed // Updated failed array
                }),
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            if (response.ok) {
                return; // Success, exit the retry loop
            }
            else {
                if (attempt === maxRetries) {
                    console.error(`[YapComment] Failed to save link status: ${response.status}`);
                }
            }
        }
        catch (error) {
            const isNetworkError = error.code === 'ECONNRESET' ||
                error.code === 'ECONNREFUSED' ||
                error.code === 'ENOTFOUND' ||
                error.message?.includes('fetch failed');
            if (isNetworkError && attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            handleFetchTimeout(error, 'saving link status to API');
            break; // Exit retry loop on non-network errors or max retries reached
        }
    }
}
/**
 * Submit a single link to interaction-logs API
 */
async function submitSingleLinkToInteractionLogs(profileId, link, status, details, runType = 'COMMENT' // 'COMMENT', 'GROW', 'CBP', 'CBL'
) {
    const maxRetries = 5;
    const retryDelay = 1000; // 1 second
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // console.log(`[YapComment] Submitting single link to interaction-logs: ${link} -> ${status} (attempt ${attempt}/${maxRetries})`);
            // Create interaction session if runId is provided
            let sessionId = null;
            if (details.runId) {
                try {
                    const sessionResponse = await fetch(`${getApiBaseUrl()}/interaction-sessions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.API_KEY}`
                        },
                        body: JSON.stringify({
                            profileId: profileId,
                            runId: details.runId,
                            type: runType,
                            totalLinks: 1
                        }),
                        signal: AbortSignal.timeout(10000) // 10 second timeout
                    });
                    if (sessionResponse.ok) {
                        const sessionData = await sessionResponse.json();
                        sessionId = sessionData.id;
                    }
                }
                catch (error) {
                    handleFetchTimeout(error, 'creating interaction session for single link');
                }
            }
            // Submit log to interaction logs API
            if (sessionId) {
                const log = {
                    link: link,
                    type: runType,
                    action: status === 'done' ? 'SUCCESS' : 'FAILED',
                    status: status === 'done' ? 'DONE' : 'FAIL',
                    details: {
                        timestamp: new Date().toISOString(),
                        commentPosted: details.commented || false,
                        likePosted: details.liked || false,
                        followedPosted: details.followed || false,
                        ...(status === 'failed' && {
                            reason: details.error || 'Unknown error',
                            error: details.error || 'Unknown error'
                        })
                    }
                };
                const logsResponse = await fetch(`${getApiBaseUrl()}/interaction-logs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.API_KEY}`
                    },
                    body: JSON.stringify({
                        sessionId: sessionId,
                        profileId: profileId,
                        logs: [log]
                    }),
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });
                if (logsResponse.ok) {
                    const result = await logsResponse.json();
                    // Success
                    return; // Success, exit the retry loop
                }
                else {
                    if (attempt === maxRetries) {
                        console.error(`[YapComment] Failed to submit single link: ${logsResponse.status}`);
                    }
                }
            }
            else {
                return; // Exit if no session ID
            }
        }
        catch (error) {
            const isNetworkError = error.code === 'ECONNRESET' ||
                error.code === 'ECONNREFUSED' ||
                error.code === 'ENOTFOUND' ||
                error.message?.includes('fetch failed');
            if (isNetworkError && attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            handleFetchTimeout(error, 'submitting single link to interaction logs');
            break; // Exit retry loop on non-network errors or max retries reached
        }
    }
}
/**
 * Combined function to save cache and submit API calls in parallel using Promise.all
 * This optimizes performance by running multiple operations simultaneously
 */
async function saveCacheAndSubmitAPI(cacheDir, profileId, link, status, details, runType = 'COMMENT' // 'COMMENT', 'GROW', 'CBP', 'CBL'
) {
    const results = {
        cacheSuccess: false,
        apiSuccess: false,
        interactionLogsSuccess: false,
        errors: []
    };
    try {
        // console.log(`[YapComment] 🚀 Starting parallel operations for ${link} -> ${status}`);
        // Prepare all promises for parallel execution
        const promises = [];
        // 1. Save to local cache
        const cachePromise = saveToCache(cacheDir, status, link, details)
            .then(() => {
            results.cacheSuccess = true;
        })
            .catch((error) => {
            results.errors.push(`Cache save failed: ${error}`);
            console.error(`[YapComment] ❌ Cache save failed for ${link}:`, error);
        });
        promises.push(cachePromise);
        // 2. Save status to API
        const apiPromise = saveLinkStatusToAPI(profileId, link, status, details)
            .then(() => {
            results.apiSuccess = true;
        })
            .catch((error) => {
            results.errors.push(`API save failed: ${error}`);
            console.error(`[YapComment] ❌ API save failed for ${link}:`, error);
        });
        promises.push(apiPromise);
        // 3. Submit to interaction-logs API (if runId is provided)
        if (details.runId) {
            const interactionLogsPromise = submitSingleLinkToInteractionLogs(profileId, link, status, details, runType)
                .then(() => {
                results.interactionLogsSuccess = true;
            })
                .catch((error) => {
                results.errors.push(`Interaction logs save failed: ${error}`);
                console.error(`[YapComment] ❌ Interaction logs save failed for ${link}:`, error);
            });
            promises.push(interactionLogsPromise);
        }
        // Execute all operations in parallel
        await Promise.all(promises);
        if (results.errors.length > 0) {
            console.warn(`[YapComment] ⚠️ Some operations failed:`, results.errors);
        }
    }
    catch (error) {
        results.errors.push(`Parallel operations failed: ${error}`);
        console.error('[YapComment] ❌ Parallel operations failed:', error);
    }
    return results;
}
/**
 * Update API with remaining links
 */
async function updateRemainingLinksAPI(profileId, remainingLinks) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(`${getApiBaseUrl()}/profile/comment-config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.API_KEY}`
                },
                body: JSON.stringify({
                    profileId: profileId,
                    links: remainingLinks
                    // Only send links, don't send done/failed to avoid overwriting
                }),
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            if (response.ok) {
                return; // Success, exit the retry loop
            }
        }
        catch (error) {
            const isNetworkError = error.code === 'ECONNRESET' ||
                error.code === 'ECONNREFUSED' ||
                error.code === 'ENOTFOUND' ||
                error.message?.includes('fetch failed');
            if (isNetworkError && attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            handleFetchTimeout(error, 'updating API with remaining links');
            break; // Exit retry loop on non-network errors or max retries reached
        }
    }
}
/**
 * Bulk update multiple links status to API (for batch operations)
 * This is more efficient than individual calls for large datasets
 */
async function bulkUpdateLinksStatusAPI(profileId, // Profile ID for API
profileHandle, // Profile handle for cache directory
doneLinks, failedLinks, originalLinks, runType = 'COMMENT' // 'COMMENT' or 'GROW'
) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    const serviceName = runType === 'GROW' ? 'YapGrow' : 'YapComment';
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Get cache data from local profile cache files
            const cacheDir = path.join(process.cwd(), 'cache', `profile_${profileHandle}`);
            const donePath = path.join(cacheDir, 'done.json');
            const failedPath = path.join(cacheDir, 'failed.json');
            let currentLinks = [];
            let currentDone = [];
            let currentFailed = [];
            // Read done links from local cache
            if (fs.existsSync(donePath)) {
                try {
                    const doneData = JSON.parse(fs.readFileSync(donePath, 'utf8'));
                    currentDone = doneData.map((item) => item.url);
                }
                catch (error) {
                    console.error(`[${serviceName}] Error reading done.json:`, error);
                }
            }
            // Read failed links from local cache
            if (fs.existsSync(failedPath)) {
                try {
                    const failedData = JSON.parse(fs.readFileSync(failedPath, 'utf8'));
                    currentFailed = failedData.map((item) => item.url);
                }
                catch (error) {
                    console.error(`[${serviceName}] Error reading failed.json:`, error);
                }
            }
            // Ensure all original links are accounted for in done/failed arrays
            let finalDoneLinks = [...doneLinks];
            let finalFailedLinks = [...failedLinks];
            if (originalLinks && originalLinks.length > 0) {
                const originalLinksSet = new Set(originalLinks);
                // Filter done/failed to only include original links
                const filteredDoneLinks = doneLinks.filter(link => originalLinksSet.has(link));
                const filteredFailedLinks = failedLinks.filter(link => {
                    // For failed links with reasons, extract the base URL
                    const baseUrl = link.includes(' (') ? link.split(' (')[0] : link;
                    return originalLinksSet.has(baseUrl);
                });
                // Calculate remaining links that need to be added to failed
                const processedLinks = new Set([
                    ...filteredDoneLinks,
                    ...filteredFailedLinks.map(link => {
                        // Extract base URL for failed links with reasons
                        return link.includes(' (') ? link.split(' (')[0] : link;
                    })
                ]);
                const remainingLinks = originalLinks.filter(link => !processedLinks.has(link));
                // Add remaining links to failed array
                const remainingFailedLinks = remainingLinks.map(link => `${link} (Not processed)`);
                finalDoneLinks = filteredDoneLinks;
                finalFailedLinks = [...filteredFailedLinks, ...remainingFailedLinks];
                // Verify total matches original
                const totalAccounted = finalDoneLinks.length + finalFailedLinks.length;
                if (totalAccounted !== originalLinks.length) {
                    console.warn(`[${serviceName}] ⚠️ Total accounted (${totalAccounted}) doesn't match original (${originalLinks.length})`);
                }
            }
            // Check each original link against cache and determine status
            let finalLinksToSubmit = [];
            let finalDoneToSubmit = [];
            let finalFailedToSubmit = [];
            if (originalLinks && originalLinks.length > 0) {
                // Check each original link against local cache
                for (const originalLink of originalLinks) {
                    // Check if link is in done cache (from local cache)
                    const isInDone = currentDone.includes(originalLink);
                    // Check if link is in failed cache (from local cache)
                    const isInFailed = currentFailed.some(failedLink => {
                        const baseUrl = failedLink.includes(' (') ? failedLink.split(' (')[0] : failedLink;
                        return baseUrl === originalLink;
                    });
                    if (isInDone) {
                        finalDoneToSubmit.push(originalLink);
                    }
                    else if (isInFailed) {
                        // Find the failed entry with reason from local cache
                        const failedEntry = currentFailed.find(failedLink => {
                            const baseUrl = failedLink.includes(' (') ? failedLink.split(' (')[0] : failedLink;
                            return baseUrl === originalLink;
                        });
                        finalFailedToSubmit.push(failedEntry || originalLink);
                    }
                    else {
                        // Link not processed yet, add to links
                        finalLinksToSubmit.push(originalLink);
                    }
                }
            }
            else {
                // Fallback: submit all data if no original links provided
                finalDoneToSubmit = [...currentDone];
                finalFailedToSubmit = [...currentFailed];
            }
            // Choose API endpoint and prepare body based on runType
            let apiEndpoint;
            let requestBody;
            if (runType === 'GROW') {
                // For GROW, we need to fetch existing settings and merge done/failed
                apiEndpoint = `${getApiBaseUrl()}/user/grow-settings?profileId=${profileId}`;
                try {
                    // Fetch existing settings first
                    const getResponse = await fetch(`${getApiBaseUrl()}/user/grow-settings?profileId=${profileId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.API_KEY}`
                        },
                        signal: AbortSignal.timeout(5000)
                    });
                    let existingSettings = {};
                    if (getResponse.ok) {
                        existingSettings = await getResponse.json();
                    }
                    // Merge done and failed into existing settings
                    requestBody = {
                        profileId: profileId,
                        settings: {
                            ...existingSettings,
                            done: finalDoneToSubmit,
                            failed: finalFailedToSubmit
                        }
                    };
                }
                catch (fetchError) {
                    console.error(`[${serviceName}] Error fetching existing settings:`, fetchError);
                    // Fallback: create minimal settings object
                    requestBody = {
                        profileId: profileId,
                        settings: {
                            links: originalLinks || [],
                            done: finalDoneToSubmit,
                            failed: finalFailedToSubmit
                        }
                    };
                }
            }
            else {
                // For COMMENT, use the old format
                apiEndpoint = `${getApiBaseUrl()}/profile/comment-config`;
                requestBody = {
                    profileId: profileId,
                    done: finalDoneToSubmit,
                    failed: finalFailedToSubmit
                };
            }
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.API_KEY}`
                },
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            if (response.ok) {
                return; // Success, exit the retry loop
            }
        }
        catch (error) {
            const isNetworkError = error.code === 'ECONNRESET' ||
                error.code === 'ECONNREFUSED' ||
                error.code === 'ENOTFOUND' ||
                error.message?.includes('fetch failed');
            if (isNetworkError && attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            const operationName = serviceName === 'YapGrow' ? 'YapGrow' : 'YapComment';
            handleFetchTimeout(error, `${operationName} bulk update`);
            break; // Exit retry loop on non-network errors or max retries reached
        }
    }
}
/**
 * Enhance error details using ErrorDriver for "Unknown error" cases
 */
async function enhanceErrorDetails(driver, failedLinks) {
    try {
        const enhancedLinks = [];
        for (const link of failedLinks) {
            const currentError = link.error || link.reason;
            if (currentError === 'Unknown error' || currentError?.toLowerCase().includes('unknown')) {
                try {
                    // Navigate to the failed link
                    await driver.get(link.url);
                    await driver.sleep(2000); // Wait for page to load
                    // Extract error details using ErrorDriver
                    const errorDriver = new rawops_1.ErrorDriver(driver);
                    const errorDetail = await errorDriver.extractErrorDetails();
                    if (errorDetail) {
                        // Update the link with enhanced error details
                        enhancedLinks.push({
                            ...link,
                            error: errorDetail.message,
                            reason: errorDetail.message,
                            errorType: errorDetail.type,
                            originalError: errorDetail.originalText,
                            enhancedAt: new Date().toISOString()
                        });
                    }
                    else {
                        // No specific error found, keep original
                        enhancedLinks.push(link);
                    }
                }
                catch (error) {
                    console.error(`[YapComment] Error enhancing details for ${link.url}:`, error);
                    // Keep original link if enhancement fails
                    enhancedLinks.push(link);
                }
            }
            else {
                // Keep non-unknown errors as is
                enhancedLinks.push(link);
            }
        }
        return enhancedLinks;
    }
    catch (error) {
        console.error('[YapComment] Error enhancing error details:', error);
        return failedLinks; // Return original if enhancement fails
    }
}
/**
 * Filter out already processed links from cache
 */
async function filterProcessedLinks(cacheDir, links) {
    try {
        const donePath = path.join(cacheDir, 'done.json');
        const failedPath = path.join(cacheDir, 'failed.json');
        let doneLinks = [];
        let failedLinks = [];
        // Read done links
        if (fs.existsSync(donePath)) {
            const doneData = JSON.parse(fs.readFileSync(donePath, 'utf8'));
            doneLinks = doneData.map((item) => item.url);
        }
        // Read failed links
        if (fs.existsSync(failedPath)) {
            const failedData = JSON.parse(fs.readFileSync(failedPath, 'utf8'));
            failedLinks = failedData.map((item) => item.url);
        }
        // Filter out processed links
        const processedLinks = [...doneLinks];
        const filteredLinks = links.filter(link => !processedLinks.includes(link));
        return filteredLinks;
    }
    catch (error) {
        console.error('[YapComment] Error filtering processed links:', error);
        return links; // Return original links if filtering fails
    }
}
