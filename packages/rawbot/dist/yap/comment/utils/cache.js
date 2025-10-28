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
        // Add new entry
        const entry = {
            url: link,
            timestamp: new Date().toISOString(),
            runId: data.runId || null, // Add runId to track which run this belongs to
            ...data
        };
        existingData.push(entry);
        // Keep only last 2 days of data
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const filteredData = existingData.filter((item) => new Date(item.timestamp) > twoDaysAgo);
        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(filteredData, null, 2));
        // Log the action (update or new entry)
        const action = wasUpdate ? 'Updated' : 'Added';
        console.log(`[YapComment] ${action} to ${type}.json: ${link}`);
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
        const response = await fetch(`${process.env.WEB_API_URL || 'http://localhost:3000/api'}/interaction-logs?sessionId=${sessionId}&profileId=${profileId}&limit=1`, {
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
                console.log(`[YapComment] Found latest log timestamp: ${latestTimestamp.toISOString()}`);
                return latestTimestamp;
            }
        }
        else {
            console.warn(`[YapComment] Failed to get latest log timestamp: ${response.status}`);
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
        const response = await fetch(`${process.env.WEB_API_URL || 'http://localhost:3000/api'}/interaction-logs?sessionId=${sessionId}&profileId=${profileId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.API_KEY}`
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        if (response.ok) {
            const existingLogs = await response.json();
            const existingLinksMap = new Map(existingLogs.map(log => [log.link, log.status]));
            console.log(`[YapComment] Found ${existingLinksMap.size} existing logs for session ${sessionId}`);
            return existingLinksMap;
        }
        else {
            console.warn(`[YapComment] Failed to check existing logs: ${response.status}`);
            return new Map();
        }
    }
    catch (error) {
        console.error('[YapComment] Error checking existing logs:', error);
        return new Map();
    }
}
async function submitCacheToAPI(cacheDir, profileId, runId, runType = 'COMMENT', processedSettings) {
    try {
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
            console.log('[YapComment] No cache data to submit');
            return;
        }
        // Create interaction session if runId is provided
        let sessionId = null;
        if (runId) {
            try {
                console.log(`[YapComment] Creating interaction session for run: ${runId}`);
                const sessionResponse = await fetch(`${process.env.WEB_API_URL || 'http://localhost:3000/api'}/interaction-sessions`, {
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
                    console.log(`[YapComment] Created interaction session: ${sessionId}`);
                }
                else {
                    console.error(`[YapComment] Failed to create interaction session: ${sessionResponse.status}`);
                }
            }
            catch (error) {
                handleFetchTimeout(error, 'creating interaction session');
            }
        }
        // Submit logs to interaction logs API
        if (sessionId) {
            try {
                // Get all links from original input instead of cache
                const originalInputLinks = processedSettings?.links || [];
                if (originalInputLinks.length === 0) {
                    console.log(`[YapComment] No original input links to check`);
                    return;
                }
                // Step 1: Get list of links that are NOT already in database with DONE status
                console.log(`[YapComment] Checking pending links from ${originalInputLinks.length} total input links...`);
                const pendingResponse = await fetch(`${process.env.WEB_API_URL || 'http://localhost:3000/api'}/interaction-logs/pending`, {
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
                let existingCount = 0;
                let pendingCount = 0;
                if (pendingResponse.ok) {
                    const pendingData = await pendingResponse.json();
                    pendingLinks = pendingData.pendingLinks;
                    existingCount = pendingData.existingCount;
                    pendingCount = pendingData.pendingCount;
                    console.log(`[YapComment] ✅ Pending check: ${existingCount} existing in DB, ${pendingCount} pending`);
                }
                else {
                    console.warn(`[YapComment] Failed to check pending links: ${pendingResponse.status}`);
                    // Fallback: use all cache links if API fails
                    pendingLinks = originalInputLinks;
                    pendingCount = originalInputLinks.length;
                }
                if (pendingLinks.length === 0) {
                    console.log(`[YapComment] No pending links found - all links already exist in database`);
                    return;
                }
                // Step 2: Filter cache to only include links that:
                // - Are in pendingLinks (not in DB or not DONE in DB)
                // - AND have data in cache (done.json or failed.json)
                console.log(`[YapComment] Filtering cache: ${doneLinks.length} done in cache, ${failedLinks.length} failed in cache`);
                const pendingLinksSet = new Set(pendingLinks);
                // Filter cache entries to only include links that are BOTH:
                // 1. In pending list (need to be submitted)
                // 2. In cache (already processed)
                const filteredDoneLinks = doneLinks.filter((item) => pendingLinksSet.has(item.url));
                const filteredFailedLinks = failedLinks.filter((item) => pendingLinksSet.has(item.url));
                console.log(`[YapComment] 📊 Cache filtering results:`);
                console.log(`   - Pending links from API: ${pendingLinks.length}`);
                console.log(`   - Done links in cache matching pending: ${filteredDoneLinks.length}`);
                console.log(`   - Failed links in cache matching pending: ${filteredFailedLinks.length}`);
                console.log(`   - Total to submit: ${filteredDoneLinks.length + filteredFailedLinks.length}`);
                // Step 3: Only submit if there are links that meet the criteria
                if (filteredDoneLinks.length === 0 && filteredFailedLinks.length === 0) {
                    console.log(`[YapComment] No cache entries match pending links - nothing to submit`);
                    return;
                }
                const newDoneLinks = filteredDoneLinks;
                const newFailedLinks = filteredFailedLinks;
                console.log(`[YapComment] 🚀 Submitting to interaction-logs API: ${newDoneLinks.length} done, ${newFailedLinks.length} failed`);
                const logs = [
                    ...newDoneLinks.map((item) => ({
                        link: item.url,
                        type: runType,
                        action: 'SUCCESS',
                        status: 'DONE',
                        details: {
                            timestamp: new Date().toISOString(),
                            commentPosted: item.commented || false,
                            likePosted: item.liked || false
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
                const logsResponse = await fetch(`${process.env.WEB_API_URL || 'http://localhost:3000/api'}/interaction-logs`, {
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
                if (logsResponse.ok) {
                    const result = await logsResponse.json();
                    console.log(`[YapComment] ✅ Interaction logs submitted: ${result.success} success, ${result.failed} failed`);
                }
                else {
                    console.error(`[YapComment] Failed to submit interaction logs: ${logsResponse.status}`);
                }
            }
            catch (error) {
                handleFetchTimeout(error, 'submitting interaction logs');
            }
        }
        // Fallback: Submit to legacy comment-config API as backup
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
            }), processedSettings?.links // Pass original input links for filtering
            );
            console.log(`[YapComment] ✅ Legacy API fallback completed`);
        }
        catch (apiError) {
            console.error('[YapComment] Fallback legacy API call failed:', apiError);
        }
    }
    catch (error) {
        console.error('[YapComment] Error submitting cache to API:', error);
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
            const getResponse = await fetch(`${process.env.WEB_API_URL || 'http://localhost:3000/api'}/profile/comment-config?profileId=${profileId}`, {
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
            const response = await fetch(`${process.env.WEB_API_URL || 'http://localhost:3000/api'}/profile/comment-config`, {
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
async function submitSingleLinkToInteractionLogs(profileId, link, status, details) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // console.log(`[YapComment] Submitting single link to interaction-logs: ${link} -> ${status} (attempt ${attempt}/${maxRetries})`);
            // Create interaction session if runId is provided
            let sessionId = null;
            if (details.runId) {
                try {
                    const sessionResponse = await fetch(`${process.env.WEB_API_URL || 'http://localhost:3000/api'}/interaction-sessions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.API_KEY}`
                        },
                        body: JSON.stringify({
                            profileId: profileId,
                            runId: details.runId,
                            type: 'COMMENT',
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
                    type: 'COMMENT',
                    action: status === 'done' ? 'SUCCESS' : 'FAILED',
                    status: status === 'done' ? 'DONE' : 'FAIL',
                    details: {
                        timestamp: new Date().toISOString(),
                        commentPosted: details.commented || false,
                        likePosted: details.liked || false,
                        ...(status === 'failed' && {
                            reason: details.error || 'Unknown error',
                            error: details.error || 'Unknown error'
                        })
                    }
                };
                const logsResponse = await fetch(`${process.env.WEB_API_URL || 'http://localhost:3000/api'}/interaction-logs`, {
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
async function saveCacheAndSubmitAPI(cacheDir, profileId, link, status, details) {
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
            const interactionLogsPromise = submitSingleLinkToInteractionLogs(profileId, link, status, details)
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
            console.log(`[YapComment] Updating API with ${remainingLinks.length} remaining links... (attempt ${attempt}/${maxRetries})`);
            const response = await fetch(`${process.env.WEB_API_URL || 'http://localhost:3000/api'}/profile/comment-config`, {
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
                console.log('[YapComment] API updated with remaining links successfully');
                return; // Success, exit the retry loop
            }
            else {
                console.error(`[YapComment] Failed to update API: ${response.status}`);
                if (attempt === maxRetries) {
                    console.error(`[YapComment] Max retries reached for updating remaining links`);
                }
            }
        }
        catch (error) {
            const isNetworkError = error.code === 'ECONNRESET' ||
                error.code === 'ECONNREFUSED' ||
                error.code === 'ENOTFOUND' ||
                error.message?.includes('fetch failed');
            if (isNetworkError && attempt < maxRetries) {
                console.log(`[YapComment] Network error on attempt ${attempt}, retrying in ${retryDelay}ms...`);
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
doneLinks, failedLinks, originalLinks) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[YapComment] Bulk updating API: ${doneLinks.length} done, ${failedLinks.length} failed (attempt ${attempt}/${maxRetries})`);
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
                    console.log(`[YapComment] Found ${currentDone.length} done links in local cache`);
                }
                catch (error) {
                    console.error(`[YapComment] Error reading done.json:`, error);
                }
            }
            // Read failed links from local cache
            if (fs.existsSync(failedPath)) {
                try {
                    const failedData = JSON.parse(fs.readFileSync(failedPath, 'utf8'));
                    currentFailed = failedData.map((item) => item.url);
                    console.log(`[YapComment] Found ${currentFailed.length} failed links in local cache`);
                }
                catch (error) {
                    console.error(`[YapComment] Error reading failed.json:`, error);
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
                console.log(`[YapComment] Link accounting for original input (${originalLinks.length} total):`);
                console.log(`   - Done links: ${finalDoneLinks.length}`);
                console.log(`   - Failed links: ${finalFailedLinks.length}`);
                console.log(`   - Remaining unprocessed: ${remainingLinks.length}`);
                console.log(`   - Total accounted: ${finalDoneLinks.length + finalFailedLinks.length}`);
                // Verify total matches original
                const totalAccounted = finalDoneLinks.length + finalFailedLinks.length;
                if (totalAccounted !== originalLinks.length) {
                    console.warn(`[YapComment] ⚠️ Total accounted (${totalAccounted}) doesn't match original (${originalLinks.length})`);
                }
            }
            // Check each original link against cache and determine status
            let finalLinksToSubmit = [];
            let finalDoneToSubmit = [];
            let finalFailedToSubmit = [];
            if (originalLinks && originalLinks.length > 0) {
                console.log(`[YapComment] Checking ${originalLinks.length} original links against cache...`);
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
                        console.log(`[YapComment] ✅ ${originalLink} - Found in done cache`);
                    }
                    else if (isInFailed) {
                        // Find the failed entry with reason from local cache
                        const failedEntry = currentFailed.find(failedLink => {
                            const baseUrl = failedLink.includes(' (') ? failedLink.split(' (')[0] : failedLink;
                            return baseUrl === originalLink;
                        });
                        finalFailedToSubmit.push(failedEntry || originalLink);
                        console.log(`[YapComment] ❌ ${originalLink} - Found in failed cache`);
                    }
                    else {
                        // Link not processed yet, add to links
                        finalLinksToSubmit.push(originalLink);
                        console.log(`[YapComment] ⏳ ${originalLink} - Not processed yet`);
                    }
                }
                console.log(`[YapComment] Cache check results for ${originalLinks.length} original links:`);
                console.log(`   - Links (not processed): ${finalLinksToSubmit.length} (not submitted)`);
                console.log(`   - Done: ${finalDoneToSubmit.length}`);
                console.log(`   - Failed: ${finalFailedToSubmit.length}`);
            }
            else {
                // Fallback: submit all data if no original links provided
                finalDoneToSubmit = [...currentDone];
                finalFailedToSubmit = [...currentFailed];
                console.log(`[YapComment] No original links provided, submitting all local cache data (done/failed only)`);
            }
            const response = await fetch(`${process.env.WEB_API_URL || 'http://localhost:3000/api'}/profile/comment-config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.API_KEY}`
                },
                body: JSON.stringify({
                    profileId: profileId, // Use profile ID for API
                    // Don't submit links, only update done/failed status
                    done: finalDoneToSubmit, // Only done links from original
                    failed: finalFailedToSubmit // Only failed links from original
                }),
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            if (response.ok) {
                console.log(`[YapComment] ✅ Bulk update successful: ${finalDoneToSubmit.length} done, ${finalFailedToSubmit.length} failed`);
                console.log(`[YapComment] 📊 API submission summary:`);
                console.log(`   - Total original links: ${originalLinks?.length || 0}`);
                console.log(`   - Done links submitted: ${finalDoneToSubmit.length}`);
                console.log(`   - Failed links submitted: ${finalFailedToSubmit.length}`);
                console.log(`   - Links not processed: ${finalLinksToSubmit.length}`);
                return; // Success, exit the retry loop
            }
            else {
                console.error(`[YapComment] Failed bulk update: ${response.status}`);
                if (attempt === maxRetries) {
                    console.error(`[YapComment] Max retries reached for bulk update`);
                }
            }
        }
        catch (error) {
            const isNetworkError = error.code === 'ECONNRESET' ||
                error.code === 'ECONNREFUSED' ||
                error.code === 'ENOTFOUND' ||
                error.message?.includes('fetch failed');
            if (isNetworkError && attempt < maxRetries) {
                console.log(`[YapComment] Network error on attempt ${attempt}, retrying in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            handleFetchTimeout(error, 'bulk update');
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
                    console.log(`[YapComment] Enhancing error details for: ${link.url}`);
                    // Navigate to the failed link
                    await driver.get(link.url);
                    await driver.sleep(2000); // Wait for page to load
                    // Extract error details using ErrorDriver
                    const errorDriver = new rawops_1.ErrorDriver(driver);
                    const errorDetail = await errorDriver.extractErrorDetails();
                    if (errorDetail) {
                        console.log(`[YapComment] Found error details: ${errorDetail.type} - ${errorDetail.message}`);
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
        console.log(`[YapComment] Cache status:`);
        console.log(`   - Done links: ${doneLinks.length}`);
        console.log(`   - Failed links: ${failedLinks.length}`);
        console.log(`   - Total processed: ${processedLinks.length}`);
        console.log(`   - Original links: ${links.length}`);
        console.log(`   - Filtered links: ${filteredLinks.length}`);
        return filteredLinks;
    }
    catch (error) {
        console.error('[YapComment] Error filtering processed links:', error);
        return links; // Return original links if filtering fails
    }
}
//# sourceMappingURL=cache.js.map