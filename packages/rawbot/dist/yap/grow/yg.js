"use strict";
// packages/rawbot/src/yap/grow/yg.ts
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
exports.YapGrow = void 0;
const XClient_1 = require("../../client/XClient");
const drivers_1 = require("../../driver/drivers");
const rawai_1 = require("@rawops/rawai");
const path = __importStar(require("path"));
const utils_1 = require("../comment/utils");
const utils_2 = require("./utils");
const handlers_1 = require("./handlers");
/**
 * YapGrow - Automated flow execution based on JSON settings
 * Parses flow configuration and executes actions using driver functions
 */
class YapGrow {
    constructor() {
        this.xClient = null;
        this.drivers = null;
        this.contentAI = null;
        this.profileHandle = '';
        this.profileId = '';
        this.cacheDir = '';
        this.runId = '';
        this.runType = 'GROW';
        this.isClosed = false;
        this.context = {};
        this.processedSettings = undefined;
        // Initialize the service
    }
    async initializeWithProfile(profile, proxyConfig) {
        this.xClient = new XClient_1.XClient();
        await this.xClient.initializeForAutomation(profile.handle, proxyConfig);
        const driver = this.xClient.getDriver();
        if (!driver) {
            throw new Error('Driver not initialized');
        }
        this.drivers = new drivers_1.Drivers(driver);
        // Setup cache directory
        this.profileHandle = profile.handle;
        this.profileId = profile.id;
        this.cacheDir = path.join(process.cwd(), 'cache', `profile_${this.profileHandle}`);
        await (0, utils_1.ensureCacheDirectory)(this.cacheDir);
        // Initialize context
        this.context = {
            variables: {}
        };
    }
    async runYapGrowWorkflow(project, run, settings) {
        const startTime = Date.now();
        const errors = [];
        let followedCount = 0;
        let profileExtractedCount = 0;
        let likedCount = 0;
        let commentedCount = 0;
        const processedLinks = [];
        const failedLinks = [];
        this.runId = run.id;
        this.runType = 'GROW';
        this.processedSettings = { links: settings.links };
        try {
            if (!this.xClient || !this.drivers) {
                throw new Error('XClient or Drivers not initialized');
            }
            // Initialize AI if enabled and databasePrompt is available
            if (settings.aiCommentEnabled && settings.geminiApiKey) {
                // Validate databasePrompt is available (required by ContentAI)
                if (!settings.databasePrompt || !settings.databasePrompt.finalPrompt || !settings.databasePrompt.requirePrompt) {
                    console.error('[YapGrow] ⚠️ AI comment enabled but databasePrompt is missing or incomplete');
                    console.error('[YapGrow] Disabling AI comments for this run. Please ensure prompt settings are configured.');
                    settings.aiCommentEnabled = false;
                }
                else {
                    this.contentAI = new rawai_1.ContentAI({
                        apiKey: settings.geminiApiKey,
                        model: settings.aiModel || 'gemini-flash-latest',
                        maxRetries: 3,
                        retryDelay: 2000
                    });
                    console.log('[YapGrow] AI initialized for comment generation');
                    console.log('[YapGrow] Database prompt available:', {
                        hasFinalPrompt: !!settings.databasePrompt.finalPrompt,
                        hasRequirePrompt: !!settings.databasePrompt.requirePrompt,
                        hasSelectedStyles: !!settings.selectedPromptStyles?.length
                    });
                }
            }
            // Filter already processed links
            console.log(`[YapGrow] Starting workflow with ${settings.links.length} links`);
            const filteredLinks = await (0, utils_1.filterProcessedLinks)(this.cacheDir, settings.links);
            console.log(`[YapGrow] After filtering processed links: ${filteredLinks.length} links remaining`);
            if (filteredLinks.length === 0) {
                console.log('[YapGrow] All links have been processed, workflow complete');
                return {
                    success: true,
                    processedLinks: [],
                    failedLinks: [],
                    errors: [],
                    duration: Date.now() - startTime,
                    followedCount: 0,
                    profileExtractedCount: 0,
                    likedCount: 0,
                    commentedCount: 0
                };
            }
            // Update context with settings (store as-is, will be resolved when used)
            this.context.variables = {
                delay_between_links: settings.delay_between_links || 10000,
                user_delay_follow: settings.user_delay_follow || 2000
            };
            // Process each link dynamically (reload filteredLinks after discovery adds new links)
            let i = 0;
            let initialFilteredLinksCount = filteredLinks.length;
            while (true) {
                if (this.isClosed) {
                    break;
                }
                // Reload filteredLinks from settings.links if discovery added new links
                // This ensures we process all links including newly discovered ones
                // Only reload if we've reached the end or if settings.links has more links
                if (i >= filteredLinks.length || settings.links.length > initialFilteredLinksCount) {
                    const currentUnprocessedFromSettings = (settings.links || []).filter(l => !processedLinks.includes(l));
                    const currentFilteredLinks = await (0, utils_1.filterProcessedLinks)(this.cacheDir, currentUnprocessedFromSettings);
                    // If we have more links now than when we started, update filteredLinks
                    if (currentFilteredLinks.length > filteredLinks.length || i >= filteredLinks.length) {
                        console.log(`[YapGrow] 🔄 Reloading links: ${filteredLinks.length} -> ${currentFilteredLinks.length} (discovery may have added new links)`);
                        filteredLinks.length = 0; // Clear old array
                        filteredLinks.push(...currentFilteredLinks); // Add new links
                        initialFilteredLinksCount = filteredLinks.length; // Update initial count
                    }
                }
                // Check if we still have links to process
                if (i >= filteredLinks.length) {
                    console.log(`[YapGrow] No more links to process (${i} >= ${filteredLinks.length})`);
                    break;
                }
                const link = filteredLinks[i];
                this.context.current_link = link;
                this.context.current_profile = null;
                this.context.detected_tweets = [];
                this.context.following_status = false;
                this.context.target_status_id = null; // Reset for each link
                this.context.interaction_result = undefined; // Reset interaction result for each link
                // Calculate remaining links count for discovery rule evaluation
                // This is ONLY evaluated at the start of each new link, not during steps
                // Use settings.links (which may be updated after discovery) instead of filteredLinks
                // Filter out processed links from current settings.links to get accurate remaining count
                const currentUnprocessedLinks = (settings.links || []).filter(l => !processedLinks.includes(l));
                // Also filter by cache if available
                let remainingLinksCount = currentUnprocessedLinks.length;
                try {
                    const cacheFiltered = await (0, utils_1.filterProcessedLinks)(this.cacheDir, currentUnprocessedLinks);
                    remainingLinksCount = cacheFiltered.length;
                }
                catch (e) {
                    // If cache filtering fails, use currentUnprocessedLinks count
                }
                // Store remainingLinksCount in context for discovery step (fixed at start of link)
                // Discovery step will use this value, not recalculate it
                this.context.remainingLinksCount = remainingLinksCount;
                try {
                    // Execute steps for this link (pass processedLinks and remainingLinksCount for discovery)
                    // Note: remainingLinksCount is fixed at link start, discovery step will use this value
                    const result = await this.executeSteps(settings.steps, settings, processedLinks, remainingLinksCount);
                    if (result.success) {
                        processedLinks.push(link);
                        if (result.followed)
                            followedCount++;
                        if (result.profileExtracted)
                            profileExtractedCount++;
                        if (result.liked)
                            likedCount++;
                        if (result.commented)
                            commentedCount++;
                        // Use parallel operations for better performance (same as yap comment)
                        // Include ruleReason if actions were skipped by rules
                        const details = {
                            liked: result.liked || false,
                            commented: result.commented || false,
                            followed: result.followed || false,
                            runId: this.runId
                        };
                        // Add rule reason if actions were skipped by rules
                        if (result.ruleReason) {
                            details.ruleReason = result.ruleReason;
                            console.log(`[YapGrow] ✅ Success (skipped by rules): ${link} - ${result.ruleReason}`);
                        }
                        const parallelResult = await (0, utils_1.saveCacheAndSubmitAPI)(this.cacheDir, this.profileId, link, 'done', details, 'GROW');
                        // Log any errors from parallel operations
                        if (parallelResult.errors.length > 0) {
                            errors.push(...parallelResult.errors);
                        }
                        console.log(`[YapGrow] ✅ Successfully processed: ${link}`);
                    }
                    else {
                        const errorMsg = result.error || 'Unknown error';
                        // Check if this is "Follow action required but not executed" - treat as done instead of failed
                        if (errorMsg.includes('Follow action required but not executed')) {
                            processedLinks.push(link);
                            // Report as done with the error message in details
                            const details = {
                                liked: result.liked || false,
                                commented: result.commented || false,
                                followed: result.followed || false,
                                runId: this.runId,
                                note: errorMsg // Include the message as a note
                            };
                            const parallelResult = await (0, utils_1.saveCacheAndSubmitAPI)(this.cacheDir, this.profileId, link, 'done', details, 'GROW');
                            // Log any errors from parallel operations
                            if (parallelResult.errors.length > 0) {
                                errors.push(...parallelResult.errors);
                            }
                            console.log(`[YapGrow] ✅ Processed (follow action required but not executed): ${link}`);
                        }
                        else {
                            failedLinks.push(link);
                            errors.push(`Failed to process ${link}: ${errorMsg}`);
                            // Use parallel operations for better performance (same as yap comment)
                            const parallelResult = await (0, utils_1.saveCacheAndSubmitAPI)(this.cacheDir, this.profileId, link, 'failed', {
                                error: errorMsg,
                                runId: this.runId
                            }, 'GROW');
                            // Log any errors from parallel operations
                            if (parallelResult.errors.length > 0) {
                                errors.push(...parallelResult.errors);
                            }
                            console.log(`[YapGrow] ❌ Failed to process: ${link} - ${errorMsg}`);
                        }
                    }
                    // Move to next link
                    i++;
                    // Delay between links
                    if (i < filteredLinks.length) {
                        const delay = this.getDelayValue(settings.delay_between_links || this.context.variables.delay_between_links || 10000);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
                catch (error) {
                    // Link might not be defined if error occurs before assignment
                    const currentLink = link || filteredLinks[i] || 'unknown';
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    // Check if this is "Follow action required but not executed" - treat as done instead of failed
                    if (errorMsg.includes('Follow action required but not executed')) {
                        processedLinks.push(currentLink);
                        // Report as done with the error message in details
                        const details = {
                            liked: false,
                            commented: false,
                            followed: false,
                            runId: this.runId,
                            note: errorMsg // Include the message as a note
                        };
                        const parallelResult = await (0, utils_1.saveCacheAndSubmitAPI)(this.cacheDir, this.profileId, currentLink, 'done', details, 'GROW');
                        // Log any errors from parallel operations
                        if (parallelResult.errors.length > 0) {
                            errors.push(...parallelResult.errors);
                        }
                        console.log(`[YapGrow] ✅ Processed (follow action required but not executed): ${currentLink}`);
                    }
                    else {
                        failedLinks.push(currentLink);
                        errors.push(`Error processing link ${currentLink}: ${errorMsg}`);
                        console.error(`[YapGrow] Error processing link ${currentLink}:`, error);
                    }
                    // Move to next link even on error
                    i++;
                }
            }
            console.log(`[YapGrow] Workflow completed: ${followedCount} followed, ${likedCount} liked, ${commentedCount} commented, ${profileExtractedCount} profiles extracted`);
            return {
                success: true,
                processedLinks,
                failedLinks,
                errors,
                duration: Date.now() - startTime,
                followedCount,
                profileExtractedCount,
                likedCount,
                commentedCount
            };
        }
        catch (error) {
            return {
                success: false,
                processedLinks,
                failedLinks,
                errors: [...errors, `Workflow failed: ${error}`],
                duration: Date.now() - startTime,
                followedCount,
                profileExtractedCount,
                likedCount,
                commentedCount
            };
        }
    }
    /**
     * Execute steps in order
     */
    async executeSteps(steps, settings, processedLinks = [], remainingLinksCount) {
        if (!this.drivers) {
            return { success: false, error: 'Drivers not initialized' };
        }
        try {
            for (const step of steps) {
                if (this.isClosed) {
                    return { success: false, error: 'Service closed' };
                }
                // Execute step with settings for AI comment generation
                await this.executeStep(step, settings, processedLinks, remainingLinksCount);
                // Handle delay after step if specified
                if (step.ms !== undefined) {
                    const delay = this.resolveVariable(step.ms);
                    if (typeof delay === 'number') {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            // Get final state after all steps are executed
            // Action required is a condition, not an error - always return success unless there's a real error
            const followed = this.context.following_status === true;
            const liked = this.context.interaction_result?.liked === true; // Explicit check for true
            const commented = this.context.interaction_result?.commented === true; // Explicit check for true
            const profileExtracted = !!this.context.current_profile;
            const ruleReason = this.context.interaction_result?.ruleReason; // Get ruleReason if actions were skipped by rules
            // Log state for debugging
            console.log(`[YapGrow] Final state:`, {
                followed,
                liked,
                commented,
                profileExtracted,
                ruleReason,
                interaction_result: this.context.interaction_result
            });
            // Action required is a condition, not an error
            // If actions were skipped by rules, ruleReason will be set
            // Always return success = true (submit as "done") unless there's a real error from try-catch
            return {
                success: true, // Always success - action required is condition, not error
                followed,
                profileExtracted,
                liked,
                commented,
                ruleReason // Pass ruleReason if actions were skipped by rules
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Execute a single step
     */
    async executeStep(step, settings, processedLinks = [], remainingLinksCount) {
        if (!this.drivers) {
            throw new Error('Drivers not initialized');
        }
        const action = step.action;
        const params = this.resolveStepParams(step);
        const handlerContext = this.getHandlerContext(processedLinks, remainingLinksCount);
        switch (action) {
            case 'open':
                await (0, handlers_1.handleOpen)(params, handlerContext);
                break;
            case 'scroll':
                await (0, handlers_1.handleScrollStep)(params, handlerContext);
                break;
            case 'scroll_random':
                await (0, handlers_1.handleScrollRandom)(params, handlerContext);
                break;
            case 'extract_profile':
                await (0, handlers_1.handleExtractProfile)(params, handlerContext);
                break;
            case 'wait_until_extract':
                await (0, handlers_1.handleWaitUntilExtractDone)(params, handlerContext);
                break;
            case 'scroll_and_detect':
                await (0, handlers_1.handleScrollAndDetectTweets)(params, settings, handlerContext);
                break;
            case 'scroll_and_detect_by_time':
                await (0, handlers_1.handleScrollAndDetectTweetsByTime)(params, settings, handlerContext);
                break;
            case 'wait':
                await (0, handlers_1.handleWait)(params, { ...handlerContext, resolveVariable: (v) => this.resolveVariable(v) });
                break;
            case 'scroll_to':
                await (0, handlers_1.handleScrollToElement)(params, handlerContext);
                break;
            case 'follow':
                await (0, handlers_1.handleFollowUser)(params, handlerContext, settings);
                break;
            case 'discover_followers':
                await (0, handlers_1.handleDiscoverFollowers)(params, settings, handlerContext);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    /**
     * Resolve step params wrapper
     */
    resolveStepParams(step) {
        return (0, utils_2.resolveStepParams)(step, this.context, (varName) => this.resolveVariable(varName));
    }
    /**
     * Get delay value wrapper
     */
    getDelayValue(delaySetting) {
        return (0, utils_2.getDelayValue)(delaySetting);
    }
    /**
     * Resolve variable wrapper
     */
    resolveVariable(varName) {
        return (0, utils_2.resolveVariable)(varName, this.context, (ds) => this.getDelayValue(ds));
    }
    /**
     * Get handler context
     */
    getHandlerContext(processedLinks = [], remainingLinksCount) {
        return {
            drivers: this.drivers,
            context: this.context,
            cacheDir: this.cacheDir,
            resolveVariable: (varName) => this.resolveVariable(varName),
            processedLinks,
            remainingLinksCount
        };
    }
    async close() {
        // Set closed flag first
        this.isClosed = true;
        // Submit cache before closing
        await (0, utils_1.submitCacheToAPI)(this.profileId, this.profileHandle, this.runId, this.runType, this.processedSettings);
        if (this.xClient) {
            await this.xClient.close();
        }
    }
}
exports.YapGrow = YapGrow;
