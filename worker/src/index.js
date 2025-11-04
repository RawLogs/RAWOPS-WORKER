"use strict";
// index.ts - Main worker entry point - focuses on run orchestration
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const services_1 = __importDefault(require("./services"));
const profile_1 = require("./flows/profile");
const project_1 = require("./flows/project");
const grow_1 = require("./flows/grow");
const comment_1 = require("./flows/comment");
const POLL_INTERVAL = 5000; // 5 seconds
// Initialize API service
const apiService = new services_1.default();
// Track active browsers by run ID
const activeBrowsers = new Map();
// --- Main Worker Loop ---
async function main() {
    console.log('🚀 Worker started. Polling for jobs...');
    setInterval(async () => {
        // Check for queued runs
        const run = await findAndLockQueuedRun();
        if (run) {
            // Log worker version from API if available
            if (run.workerVersionId && run.workerVersion) {
                const requiredVersion = run.workerVersion.version;
                const requiredChecksum = run.workerVersion.checksum;
                console.log(`\n[${run.id}] ═══════════════════════════════════════════════════════════════════`);
                console.log(`[${run.id}] 📦 WORKER VERSION INFO (from API)`);
                console.log(`[${run.id}] ═══════════════════════════════════════════════════════════════════`);
                console.log(`[${run.id}] Version: ${requiredVersion}`);
                console.log(`[${run.id}] Checksum: ${requiredChecksum}`);
                console.log(`[${run.id}] ═══════════════════════════════════════════════════════════════════\n`);
            }
            const profileHandle = run.profile?.handle;
            if (!profileHandle || profileHandle === 'unknown') {
                console.log(`[${run.id}] ⚠️ Run skipped: Profile handle is unknown.`);
            }
            else {
                console.log(`[${run.id}] Found job of type '${run.type}' for account: ${profileHandle}. Starting...`);
                await processRun(run);
            }
        }
        // Check for stopped runs and cleanup browsers
        await checkAndCleanupStoppedRuns();
    }, POLL_INTERVAL);
}
async function checkAndCleanupStoppedRuns() {
    try {
        // Check all active browsers to see if their runs have been stopped externally
        for (const [runId, browser] of activeBrowsers.entries()) {
            try {
                // Check the current status of this run
                const runStatus = await apiService.getRunStatus(runId);
                // Handle null response (API error/timeout)
                if (!runStatus) {
                    // If we can't check the status, assume the run is still active
                    continue;
                }
                // Only clean up browser if run is explicitly STOPPED or FAILED
                if (runStatus.status === 'STOPPED' || runStatus.status === 'FAILED') {
                    console.log(`[${runId}] Run status changed to '${runStatus.status}', cleaning up browser`);
                    try {
                        if (browser && typeof browser.close === 'function') {
                            await browser.close();
                            console.log(`[${runId}] Browser closed successfully`);
                        }
                    }
                    catch (error) {
                        console.error(`[${runId}] Error closing browser:`, error);
                    }
                    finally {
                        activeBrowsers.delete(runId);
                    }
                }
            }
            catch (error) {
                console.error(`[${runId}] Error checking run status:`, error);
                // If we can't check the status, assume the run is still active
            }
        }
    }
    catch (error) {
        console.error('Error checking stopped runs:', error);
    }
}
async function findAndLockQueuedRun() {
    try {
        return await apiService.findAndLockQueuedRun();
    }
    catch (error) {
        // Handle timeout errors gracefully - just log as server issue
        if (error instanceof Error && error.message.includes('timeout')) {
            console.log("Server timeout while finding queued run - will retry next poll");
            return null;
        }
        // Log other errors as unexpected
        console.error("Unexpected error finding queued run:", error);
        return null;
    }
}
// --- Run Processor ---
async function processRun(run) {
    try {
        // Validate run data
        if (!run.profile || !run.profile.handle) {
            console.error(`[${run.id}] Invalid run data: missing profile or handle`);
            await apiService.updateRunStatus(run.id, 'FAILED', {
                error: 'Invalid run data: missing profile or handle'
            });
            return;
        }
        // SECURITY: Validate that the profile belongs to the authenticated user
        // This is critical to prevent cross-user access
        if (!run.profile.userId) {
            console.error(`[${run.id}] Security violation: Profile ${run.profile.id} has no userId`);
            await apiService.updateRunStatus(run.id, 'FAILED', {
                error: 'Security violation: Profile has no user association'
            });
            return;
        }
        console.log(`[${run.id}] Processing run for user ${run.profile.userId} with profile ${run.profile.handle}`);
        console.log(`[${run.id}] Processing run with type: "${run.type}" (length: ${run.type.length})`);
        switch (run.type) {
            case 'PROJECT':
                await (0, project_1.runProjectFlow)(run, apiService, activeBrowsers);
                break;
            case 'GROW':
                await (0, grow_1.runGrowFlow)(run, apiService, activeBrowsers);
                break;
            case 'COMMENT':
                await (0, comment_1.runCommentFlow)(run, apiService, activeBrowsers);
                break;
            case 'LOGIN':
                await (0, profile_1.runProfileFlow)(run, apiService, activeBrowsers);
                break;
            default:
                throw new Error(`Unknown run type: ${run.type}`);
        }
        await apiService.updateRunStatus(run.id, 'SUCCESS', { completedAt: new Date() });
        console.log(`[${run.id}] ✅ Run completed successfully.`);
    }
    catch (error) {
        console.error(`[${run.id}] ❌ Error processing run:`, error);
        await apiService.updateRunStatus(run.id, 'FAILED', { completedAt: new Date() });
    }
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
