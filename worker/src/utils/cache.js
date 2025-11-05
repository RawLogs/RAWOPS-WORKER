"use strict";
// utils/cache.ts - Cache processing utilities
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
exports.processCacheForRun = processCacheForRun;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const rawbot_1 = require("@rawops/rawbot");
/**
 * Process cache files to filter out already processed links and clean up data
 */
async function processCacheForRun(run, settings) {
    const cacheDir = path.join(process.cwd(), 'cache', `profile_${run.profile.handle}`);
    console.log(`[${run.id}] Processing cache for profile: ${run.profile.handle}`);
    console.log(`[${run.id}] Cache directory: ${cacheDir}`);
    try {
        // Ensure cache directory exists
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
            console.log(`[${run.id}] Created cache directory: ${cacheDir}`);
        }
        // Read existing cache files
        const donePath = path.join(cacheDir, 'done.json');
        const failedPath = path.join(cacheDir, 'failed.json');
        let doneData = [];
        let failedData = [];
        // Read done links (keep full objects to preserve format)
        if (fs.existsSync(donePath)) {
            try {
                doneData = JSON.parse(fs.readFileSync(donePath, 'utf8'));
                console.log(`[${run.id}] Found ${doneData.length} done links in cache`);
            }
            catch (error) {
                console.error(`[${run.id}] Error reading done.json:`, error);
            }
        }
        // Read failed links (keep full objects to get runId and other info)
        if (fs.existsSync(failedPath)) {
            try {
                failedData = JSON.parse(fs.readFileSync(failedPath, 'utf8'));
                console.log(`[${run.id}] Found ${failedData.length} failed links in cache`);
            }
            catch (error) {
                console.error(`[${run.id}] Error reading failed.json:`, error);
            }
        }
        // Extract URLs for comparison
        const doneLinks = doneData.map((item) => item.url);
        const failedLinks = failedData.map((item) => item.url);
        // Clean up failed links that are now in done
        const originalFailedCount = failedData.length;
        const linksToRemoveFromFailed = failedLinks.filter(link => doneLinks.includes(link));
        // Get failed entries that need to be moved to done (BEFORE filtering)
        const failedEntriesToMove = failedData.filter((item) => linksToRemoveFromFailed.includes(item.url));
        // Filter out failed entries that are now in done
        failedData = failedData.filter((item) => !doneLinks.includes(item.url));
        if (originalFailedCount !== failedData.length) {
            console.log(`[${run.id}] Cleaned up ${originalFailedCount - failedData.length} failed links that are now done`);
            console.log(`[${run.id}] Links moved from failed to done: ${linksToRemoveFromFailed.join(', ')}`);
            // Log each retry success individually
            for (const link of linksToRemoveFromFailed) {
                console.log(`[${run.id}] ✅ RETRY SUCCESS: ${link} - Reason: retry done`);
            }
            // Update failed.json with remaining failed links only
            fs.writeFileSync(failedPath, JSON.stringify(failedData, null, 2));
            console.log(`[${run.id}] Updated failed.json with ${failedData.length} remaining failed links`);
            // Add the moved links to done.json with correct format
            if (linksToRemoveFromFailed.length > 0) {
                // Create new done entries with correct format from failed entries
                const newDoneEntries = failedEntriesToMove.map((failedEntry) => ({
                    url: failedEntry.url,
                    timestamp: new Date().toISOString(),
                    runId: failedEntry.runId || run.id, // Use runId from failed entry or current run.id
                    liked: failedEntry.liked || false,
                    commented: failedEntry.commented || false,
                    followed: failedEntry.followed || false
                }));
                // Add new entries to done.json (keep existing entries)
                const updatedDoneData = [...doneData];
                // Add or update entries for moved links
                for (const newEntry of newDoneEntries) {
                    const existingIndex = updatedDoneData.findIndex((item) => item.url === newEntry.url);
                    if (existingIndex >= 0) {
                        // Update existing entry, preserve format but ensure runId exists
                        updatedDoneData[existingIndex] = {
                            ...updatedDoneData[existingIndex],
                            runId: updatedDoneData[existingIndex].runId || newEntry.runId,
                            liked: updatedDoneData[existingIndex].liked ?? newEntry.liked,
                            commented: updatedDoneData[existingIndex].commented ?? newEntry.commented,
                            followed: updatedDoneData[existingIndex].followed ?? newEntry.followed
                        };
                    }
                    else {
                        // Add new entry
                        updatedDoneData.push(newEntry);
                    }
                }
                fs.writeFileSync(donePath, JSON.stringify(updatedDoneData, null, 2));
                console.log(`[${run.id}] Updated done.json with ${updatedDoneData.length} done links (including ${linksToRemoveFromFailed.length} moved from failed)`);
                // Update doneData for subsequent filtering
                doneData = updatedDoneData;
            }
        }
        // Update doneLinks array for filtering (after potential move from failed)
        const doneLinksForFilter = doneData.map((item) => item.url);
        // Priority logic: Process 'links' first, only add 'failed' if no 'links' available
        const originalLinksCount = settings.links.length;
        const originalLinks = [...settings.links]; // Keep original links for API submission
        // Step 1: Filter out DONE links from the main 'links' array
        settings.links = settings.links.filter((link) => !doneLinksForFilter.includes(link));
        // Step 2: Submit API to update done/failed status BEFORE processing remaining links
        if (doneLinksForFilter.length > 0 || failedLinks.length > 0) {
            try {
                const result = await (0, rawbot_1.submitCacheToAPI)(run.profile.id, // Profile ID for API
                run.profile.handle, // Profile handle for cache directory
                run.id, // Run ID to filter by run
                run.type === 'GROW' ? 'GROW' : 'COMMENT', // Run type based on run.type
                { links: originalLinks } // Original links for reference
                );
            }
            catch (error) {
                console.error(`[${run.id}] Error submitting API after filtering:`, error);
            }
        }
        else {
            console.log(`[${run.id}] No done/failed links to submit to API`);
        }
        return settings;
    }
    catch (error) {
        console.error(`[${run.id}] Error processing cache:`, error);
        return settings; // Return original settings if cache processing fails
    }
}
