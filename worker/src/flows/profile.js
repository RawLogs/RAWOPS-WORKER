"use strict";
// flows/profile.ts - Profile flow (LOGIN type)
Object.defineProperty(exports, "__esModule", { value: true });
exports.runProfileFlow = runProfileFlow;
const rawbot_1 = require("@rawops/rawbot");
const errors_1 = require("../utils/errors");
async function runProfileFlow(run, apiService, activeBrowsers) {
    console.log(`[${run.id}] 🔐 Starting manual profile flow for profile: ${run.profile?.handle || 'unknown'}`);
    try {
        // Get proxy config from run stats
        const proxyConfig = run.stats?.proxyConfig || null;
        // Initialize XClient for manual login (runProfile mode)
        const xClient = new rawbot_1.XClient();
        await xClient.initializeForRunProfile(run.profile?.handle || 'unknown', proxyConfig);
        // Track the Chrome process for cleanup
        activeBrowsers.set(run.id, {
            close: async () => {
                console.log(`[${run.id}] Closing Chrome process for profile: ${run.profile?.handle || 'unknown'}`);
                // Chrome process will be killed when worker stops or run is stopped
            }
        });
        console.log(`[${run.id}] ✅ Manual profile browser launched for profile: ${run.profile?.handle || 'unknown'}`);
        // Update run status to indicate browser is ready for manual login
        await apiService.updateRunStatus(run.id, 'RUNNING', {
            stats: {
                ...run.stats,
                browserLaunched: true,
                message: 'Browser opened for manual login. Please login to X.com'
            }
        });
    }
    catch (error) {
        // Check if it's a profile already in use error first
        if (error instanceof Error && await (0, errors_1.handleProfileBusyError)(run, error, apiService)) {
            return; // Don't throw error, just skip this run
        }
        // Only log error if we didn't handle it
        console.error(`[${run.id}] ❌ Error in profile flow:`, error);
        throw error;
    }
    finally {
        // Cleanup browser when run completes
        if (activeBrowsers.has(run.id)) {
            try {
                const browser = activeBrowsers.get(run.id);
                if (browser && typeof browser.close === 'function') {
                    await browser.close();
                    console.log(`[${run.id}] Browser closed after profile flow completion`);
                }
            }
            catch (error) {
                console.error(`[${run.id}] Error closing browser:`, error);
            }
            finally {
                activeBrowsers.delete(run.id);
            }
        }
    }
}
