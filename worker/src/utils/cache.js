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
        let doneLinks = [];
        let failedLinks = [];
        // Read done links
        if (fs.existsSync(donePath)) {
            try {
                const doneData = JSON.parse(fs.readFileSync(donePath, 'utf8'));
                doneLinks = doneData.map((item) => item.url);
                console.log(`[${run.id}] Found ${doneLinks.length} done links in cache`);
            }
            catch (error) {
                console.error(`[${run.id}] Error reading done.json:`, error);
            }
        }
        // Read failed links
        if (fs.existsSync(failedPath)) {
            try {
                const failedData = JSON.parse(fs.readFileSync(failedPath, 'utf8'));
                failedLinks = failedData.map((item) => item.url);
                console.log(`[${run.id}] Found ${failedLinks.length} failed links in cache`);
            }
            catch (error) {
                console.error(`[${run.id}] Error reading failed.json:`, error);
            }
        }
        // Clean up failed links that are now in done
        const originalFailedCount = failedLinks.length;
        const linksToRemoveFromFailed = failedLinks.filter(link => doneLinks.includes(link));
        failedLinks = failedLinks.filter(link => !doneLinks.includes(link));
        if (originalFailedCount !== failedLinks.length) {
            console.log(`[${run.id}] Cleaned up ${originalFailedCount - failedLinks.length} failed links that are now done`);
            console.log(`[${run.id}] Links moved from failed to done: ${linksToRemoveFromFailed.join(', ')}`);
            // Log each retry success individually
            for (const link of linksToRemoveFromFailed) {
                console.log(`[${run.id}] ✅ RETRY SUCCESS: ${link} - Reason: retry done`);
            }
            // Update failed.json with remaining failed links only
            const updatedFailedData = failedLinks.map(link => ({
                url: link,
                timestamp: new Date().toISOString(),
                reason: 'Still failed - needs retry'
            }));
            fs.writeFileSync(failedPath, JSON.stringify(updatedFailedData, null, 2));
            console.log(`[${run.id}] Updated failed.json with ${updatedFailedData.length} remaining failed links`);
            // Add the moved links to done.json
            if (linksToRemoveFromFailed.length > 0) {
                const doneData = doneLinks.map(link => ({
                    url: link,
                    timestamp: new Date().toISOString(),
                    status: 'DONE',
                    movedFromFailed: linksToRemoveFromFailed.includes(link),
                    retrySuccess: linksToRemoveFromFailed.includes(link) ? 'retry done' : undefined
                }));
                fs.writeFileSync(donePath, JSON.stringify(doneData, null, 2));
                console.log(`[${run.id}] Updated done.json with ${doneData.length} done links (including ${linksToRemoveFromFailed.length} moved from failed)`);
            }
        }
        // Priority logic: Process 'links' first, only add 'failed' if no 'links' available
        const originalLinksCount = settings.links.length;
        const originalLinks = [...settings.links]; // Keep original links for API submission
        // Step 1: Filter out DONE links from the main 'links' array
        settings.links = settings.links.filter((link) => !doneLinks.includes(link));
        // Step 2: Submit API to update done/failed status BEFORE processing remaining links
        if (doneLinks.length > 0 || failedLinks.length > 0) {
            console.log(`[${run.id}] Submitting API to update done/failed status before processing...`);
            console.log(`[${run.id}]   - Cache done links: ${doneLinks.length}`);
            console.log(`[${run.id}]   - Cache failed links: ${failedLinks.length}`);
            console.log(`[${run.id}]   - Original links to check: ${originalLinks.length}`);
            try {
                await (0, rawbot_1.submitCacheToAPI)(run.profile.id, // Profile ID for API
                run.profile.handle, // Profile handle for cache directory
                run.id, // Run ID to filter by run
                run.type === 'GROW' ? 'GROW' : 'COMMENT', // Run type based on run.type
                { links: originalLinks } // Original links for reference
                );
                console.log(`[${run.id}] ✅ API submitted successfully via submitCacheToAPI`);
            }
            catch (error) {
                console.error(`[${run.id}] Error submitting API after filtering:`, error);
                // Continue processing even if API submission fails
            }
        }
        else {
            console.log(`[${run.id}] No done/failed links to submit to API`);
        }
        console.log(`[${run.id}] Cache processing results:`);
        console.log(`   - Done links: ${doneLinks.length} (filtered out)`);
        console.log(`   - Failed links: ${failedLinks.length} (cleared and moved to done)`);
        console.log(`   - Original links: ${originalLinksCount}`);
        console.log(`   - Final links to process: ${settings.links.length}`);
        console.log(`   - Status: ${settings.links.length === 0 ? 'All links processed - stopping run' : 'Processing remaining links'}`);
        return settings;
    }
    catch (error) {
        console.error(`[${run.id}] Error processing cache:`, error);
        return settings; // Return original settings if cache processing fails
    }
}
