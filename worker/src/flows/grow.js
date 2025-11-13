"use strict";
// flows/grow.ts - Grow flow (GROW type)
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGrowFlow = runGrowFlow;
const rawbot_1 = require("@rawops/rawbot");
const errors_1 = require("../utils/errors");
const proxy_1 = require("../utils/proxy");
const cache_1 = require("../utils/cache");
const settings_1 = require("../loaders/settings");
async function runGrowFlow(run, apiService, activeBrowsers) {
    console.log(`[${run.id}] Starting YAP Grow flow for profile: ${run.profile?.handle || 'unknown'}`);
    try {
        // For GROW runs, we need to get userId from run
        const userId = run.userId || run.profile?.userId;
        if (!userId) {
            console.error(`[${run.id}] Security violation: No userId found for run`);
            throw new Error('Security violation: No userId found for run');
        }
        console.log(`[${run.id}] Using userId from run: ${userId}`);
        // Clear all failed cache when starting grow flow
        await (0, cache_1.clearFailedCache)(run);
        // Load user-specific grow settings with userId for Gemini API key
        let settings;
        try {
            settings = await (0, settings_1.loadUserGrowSettings)(run.profile.id, userId, apiService);
        }
        catch (error) {
            console.error(`[${run.id}] ❌ Failed to load grow settings:`, error);
            await apiService.updateRunStatus(run.id, 'FAILED', {
                completedAt: new Date(),
                error: `Failed to load grow settings: ${error instanceof Error ? error.message : String(error)}`
            });
            return;
        }
        // Process cache to filter out already processed links
        const processedSettings = await (0, cache_1.processCacheForRun)(run, settings);
        console.log(`[${run.id}] Loaded grow settings:`, {
            linksCount: processedSettings.links.length,
            stepsCount: processedSettings.steps?.length || 0,
            enableLike: processedSettings.enableLike,
            enableComment: processedSettings.enableComment,
            delayBetweenLinks: processedSettings.delay_between_links,
            userDelayFollow: processedSettings.user_delay_follow,
            aiCommentEnabled: processedSettings.aiCommentEnabled,
            hasGeminiApiKey: !!processedSettings.geminiApiKey,
            hasDatabasePrompt: !!(processedSettings.databasePrompt && processedSettings.databasePrompt.finalPrompt && processedSettings.databasePrompt.requirePrompt),
            hasSelectedStyles: !!processedSettings.selectedPromptStyles?.length,
            promptStyleMode: processedSettings.promptStyleMode
        });
        // Stop run if AI is disabled - BEFORE initializing browser
        // AI must be explicitly true to proceed, otherwise stop the worker
        if (processedSettings.aiCommentEnabled !== true) {
            console.log(`[${run.id}] AI comment is disabled or not enabled, stopping run`);
            await apiService.updateRunStatus(run.id, 'STOPPED', {
                completedAt: new Date(),
                error: 'AI comment is disabled in settings. AI must be enabled to run.'
            });
            return;
        }
        // Stop run if no links available to process - BEFORE initializing browser
        if (processedSettings.links.length === 0) {
            console.log(`[${run.id}] No links available to process, stopping run with success`);
            await apiService.updateRunStatus(run.id, 'SUCCESS', {
                completedAt: new Date(),
                stats: {
                    message: 'All links already processed',
                    linksProcessed: 0,
                    followed: 0,
                    liked: 0,
                    commented: 0
                }
            });
            return;
        }
        // Validate that steps are configured
        if (!processedSettings.steps || processedSettings.steps.length === 0) {
            console.log(`[${run.id}] No steps configured in grow settings, stopping run`);
            await apiService.updateRunStatus(run.id, 'FAILED', {
                completedAt: new Date(),
                error: 'No steps configured in grow settings'
            });
            return;
        }
        // Initialize YapGrow service
        console.log(`[${run.id}] Initializing YapGrow service`);
        const yapGrowService = new rawbot_1.YapGrow();
        // Initialize XClient with profile and proxy
        console.log(`[${run.id}] Initializing browser for profile: ${run.profile?.handle || 'unknown'}`);
        const proxyConfig = (0, proxy_1.parseProxyString)(run.profile.proxy || '');
        await yapGrowService.initializeWithProfile(run.profile, proxyConfig);
        // Track the browser for cleanup
        activeBrowsers.set(run.id, yapGrowService);
        // Run the complete yapgrow workflow
        const result = await yapGrowService.runYapGrowWorkflow(run.project || { id: 'default', name: 'Grow Run', createdAt: new Date(), updatedAt: new Date() }, run, processedSettings);
        console.log(`[${run.id}] YAP Grow workflow completed:`, {
            success: result.success,
            processedLinks: result.processedLinks.length,
            failedLinks: result.failedLinks.length,
            followed: result.followedCount,
            liked: result.likedCount,
            commented: result.commentedCount,
            profileExtracted: result.profileExtractedCount,
            duration: result.duration
        });
        if (!result.success) {
            throw new Error(`YAP Grow workflow failed: ${result.errors.join(', ')}`);
        }
    }
    catch (error) {
        // Check if it's a profile already in use error first
        if (error instanceof Error && await (0, errors_1.handleProfileBusyError)(run, error, apiService)) {
            return; // Don't throw error, just skip this run
        }
        // Only log error if we didn't handle it
        console.error(`[${run.id}] Error in YAP Grow flow:`, error);
        throw error;
    }
    finally {
        // Cleanup browser when run completes
        if (activeBrowsers.has(run.id)) {
            try {
                const browser = activeBrowsers.get(run.id);
                if (browser && typeof browser.close === 'function') {
                    await browser.close();
                    console.log(`[${run.id}] Browser closed after grow workflow completion`);
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
