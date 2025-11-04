"use strict";
// flows/comment.ts - Comment flow (COMMENT type)
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommentFlow = runCommentFlow;
const rawbot_1 = require("@rawops/rawbot");
const errors_1 = require("../utils/errors");
const proxy_1 = require("../utils/proxy");
const cache_1 = require("../utils/cache");
const settings_1 = require("../loaders/settings");
async function runCommentFlow(run, apiService, activeBrowsers) {
    console.log(`[${run.id}] Starting YAP Comment flow for profile: ${run.profile?.handle || 'unknown'}`);
    try {
        // For COMMENT runs, we need to get userId from run
        const userId = run.userId || run.profile?.userId;
        if (!userId) {
            console.error(`[${run.id}] Security violation: No userId found for run`);
            throw new Error('Security violation: No userId found for run');
        }
        console.log(`[${run.id}] Using userId from run: ${userId}`);
        // Load user-specific comment settings with userId for Gemini API key
        let settings;
        try {
            settings = await (0, settings_1.loadUserCommentSettings)(run.profile.id, userId, apiService);
        }
        catch (error) {
            console.error(`[${run.id}] ❌ Failed to load comment settings:`, error);
            await apiService.updateRunStatus(run.id, 'FAILED', {
                completedAt: new Date(),
                error: `Failed to load comment settings: ${error instanceof Error ? error.message : String(error)}`
            });
            return;
        }
        // Process cache to filter out already processed links
        const processedSettings = await (0, cache_1.processCacheForRun)(run, settings);
        console.log(`[${run.id}] Loaded comment settings:`, {
            linksCount: processedSettings.links.length,
            aiEnabled: processedSettings.aiCommentEnabled,
            hasGeminiApiKey: !!processedSettings.geminiApiKey,
            hasDatabasePrompt: !!processedSettings.databasePrompt,
            userId: userId,
            commentMode: processedSettings.commentMode || 'cml'
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
                    commentsPosted: 0,
                    likesPosted: 0,
                    repliesPosted: 0
                }
            });
            return;
        }
        // Determine which comment service to use based on settings
        const commentMode = processedSettings.commentMode || 'cml';
        console.log(`[${run.id}] Using comment mode: ${commentMode}`);
        let yapCommentService;
        if (commentMode === 'cbp') {
            console.log(`[${run.id}] Initializing CommentByProfile service (cbp)`);
            yapCommentService = new rawbot_1.CommentByProfile();
        }
        else {
            console.log(`[${run.id}] Initializing CommentByLink service (cml)`);
            yapCommentService = new rawbot_1.CommentByLink();
        }
        // Initialize XClient with profile and proxy
        console.log(`[${run.id}] Initializing browser for profile: ${run.profile?.handle || 'unknown'}`);
        const proxyConfig = (0, proxy_1.parseProxyString)(run.profile.proxy || '');
        await yapCommentService.initializeWithProfile(run.profile, proxyConfig);
        // Track the browser for cleanup
        activeBrowsers.set(run.id, yapCommentService);
        // Run the complete yapcomment workflow
        const result = await yapCommentService.runYapCommentWorkflow(run.project || { id: 'default', name: 'Comment Run', createdAt: new Date(), updatedAt: new Date() }, run, processedSettings);
        console.log(`[${run.id}] YAP Comment workflow completed:`, {
            success: result.success,
            commentsPosted: result.commentsPosted,
            likesPosted: result.likesPosted,
            repliesPosted: result.repliesPosted,
            processedLinks: result.processedLinks.length,
            failedLinks: result.failedLinks.length,
            duration: result.duration,
            commentMode: commentMode
        });
        if (!result.success) {
            throw new Error(`YAP Comment workflow failed: ${result.errors.join(', ')}`);
        }
    }
    catch (error) {
        // Check if it's a profile already in use error first
        if (error instanceof Error && await (0, errors_1.handleProfileBusyError)(run, error, apiService)) {
            return; // Don't throw error, just skip this run
        }
        // Only log error if we didn't handle it
        console.error(`[${run.id}] Error in YAP Comment flow:`, error);
        throw error;
    }
    finally {
        // Cleanup browser when run completes
        if (activeBrowsers.has(run.id)) {
            try {
                const browser = activeBrowsers.get(run.id);
                if (browser && typeof browser.close === 'function') {
                    await browser.close();
                    console.log(`[${run.id}] Browser closed after comment workflow completion`);
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
