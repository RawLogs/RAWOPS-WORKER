"use strict";
// flows/project.ts - Project flow (PROJECT type)
Object.defineProperty(exports, "__esModule", { value: true });
exports.runProjectFlow = runProjectFlow;
const rawbot_1 = require("@rawops/rawbot");
const errors_1 = require("../utils/errors");
const proxy_1 = require("../utils/proxy");
const settings_1 = require("../loaders/settings");
async function runProjectFlow(run, apiService, activeBrowsers) {
    console.log(`[${run.id}] Starting YapProject flow...`);
    try {
        // Initialize YapProject service with profile
        const yapProjectService = new rawbot_1.YapProjectService();
        // Initialize XClient with profile and proxy
        console.log(`[${run.id}] Initializing browser for profile: ${run.profile?.handle || 'unknown'}`);
        const proxyConfig = (0, proxy_1.parseProxyString)(run.profile.proxy || '');
        await yapProjectService.initializeWithProfile(run.profile, proxyConfig);
        // Track the Playwright browser for cleanup
        activeBrowsers.set(run.id, yapProjectService.xClient);
        // Load user-specific settings for this project
        const settings = await (0, settings_1.loadUserProjectSettings)(run.project.id, run.profile.id, apiService);
        // Use default empty interaction rules (PROJECT flow no longer uses interaction rules from API)
        // Interaction rules are now managed in grow-settings for GROW flow only
        const interactionRules = {
            rules: [],
            settings: {
                enabled: false,
                version: "1.0.0",
                lastUpdated: new Date().toISOString()
            }
        };
        console.log(`[${run.id}] Loaded settings:`, {
            hashtags: settings.hashtags.length,
            handles: settings.handles.length,
            links: settings.links.length,
            maxInteractions: settings.maxInteractions,
            interactionRulesEnabled: interactionRules.settings.enabled,
            rulesCount: interactionRules.rules.length
        });
        // Run the complete yapproject workflow with interaction rules
        const result = await yapProjectService.runYapProjectWorkflow(run.project, run, settings, interactionRules);
        console.log(`[${run.id}] YapProject workflow completed:`, {
            success: result.success,
            tweetsCollected: result.tweetsCollected,
            tweetsFiltered: result.tweetsFiltered,
            interactionsExecuted: result.interactionsExecuted,
            duration: result.duration
        });
        if (!result.success) {
            throw new Error(`YapProject workflow failed: ${result.errors.join(', ')}`);
        }
    }
    catch (error) {
        // Check if it's a profile already in use error first
        if (error instanceof Error && await (0, errors_1.handleProfileBusyError)(run, error, apiService)) {
            return; // Don't throw error, just skip this run
        }
        // Only log error if we didn't handle it
        console.error(`[${run.id}] Error in YapProject flow:`, error);
        throw error;
    }
    finally {
        // Cleanup browser when run completes
        if (activeBrowsers.has(run.id)) {
            try {
                const browser = activeBrowsers.get(run.id);
                if (browser && typeof browser.close === 'function') {
                    await browser.close();
                    console.log(`[${run.id}] Browser closed after workflow completion`);
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
