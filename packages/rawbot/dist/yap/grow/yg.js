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
const selenium_webdriver_1 = require("selenium-webdriver");
const path = __importStar(require("path"));
const utils_1 = require("../comment/utils");
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
            const filteredLinks = await (0, utils_1.filterProcessedLinks)(this.cacheDir, settings.links);
            if (filteredLinks.length === 0) {
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
            // Process each link
            for (let i = 0; i < filteredLinks.length; i++) {
                if (this.isClosed) {
                    break;
                }
                const link = filteredLinks[i];
                this.context.current_link = link;
                this.context.current_profile = null;
                this.context.detected_tweets = [];
                this.context.following_status = false;
                this.context.target_status_id = null; // Reset for each link
                this.context.interaction_result = undefined; // Reset interaction result for each link
                try {
                    // Execute steps for this link
                    const result = await this.executeSteps(settings.steps, settings);
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
                        await (0, utils_1.saveCacheAndSubmitAPI)(this.cacheDir, this.profileId, link, 'done', {
                            liked: result.liked || false,
                            commented: result.commented || false,
                            followed: result.followed || false,
                            runId: this.runId
                        });
                    }
                    else {
                        failedLinks.push(link);
                        errors.push(`Failed to process ${link}: ${result.error || 'Unknown error'}`);
                        await (0, utils_1.saveCacheAndSubmitAPI)(this.cacheDir, this.profileId, link, 'failed', {
                            error: result.error || 'Unknown error',
                            runId: this.runId
                        });
                    }
                    // Delay between links
                    if (i < filteredLinks.length - 1) {
                        const delay = this.getDelayValue(settings.delay_between_links || this.context.variables.delay_between_links || 10000);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
                catch (error) {
                    failedLinks.push(link);
                    errors.push(`Error processing ${link}: ${error}`);
                }
            }
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
    async executeSteps(steps, settings) {
        if (!this.drivers) {
            return { success: false, error: 'Drivers not initialized' };
        }
        try {
            for (const step of steps) {
                if (this.isClosed) {
                    return { success: false, error: 'Service closed' };
                }
                // Execute step with settings for AI comment generation
                await this.executeStep(step, settings);
                // Handle delay after step if specified
                if (step.ms !== undefined) {
                    const delay = this.resolveVariable(step.ms);
                    if (typeof delay === 'number') {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            // Validate required actions were executed successfully
            // Check these AFTER all steps are executed to ensure we get the final state
            const followed = this.context.following_status === true;
            const liked = this.context.interaction_result?.liked === true; // Explicit check for true
            const commented = this.context.interaction_result?.commented === true; // Explicit check for true
            const profileExtracted = !!this.context.current_profile;
            // Log validation state for debugging
            console.log(`[YapGrow] Validation state:`, {
                followed,
                liked,
                commented,
                profileExtracted,
                interaction_result: this.context.interaction_result
            });
            // Check which actions were required based on steps
            let requiresFollow = false;
            let requiresLike = false;
            let requiresComment = false;
            for (const step of steps) {
                if (step.action === 'follow') {
                    requiresFollow = true;
                }
                if (step.action === 'scroll_and_detect') {
                    const enableLike = step.enable_like !== false && step.enableLike !== false;
                    const enableComment = step.enable_comment !== false && step.enableComment !== false;
                    if (enableLike)
                        requiresLike = true;
                    if (enableComment)
                        requiresComment = true;
                }
            }
            // Validate actions
            const validationErrors = [];
            // For follow: handleFollowUser automatically checks following status and only follows if not already following
            // If already following, following_status = true (success)
            // If not following and follow succeeded, following_status = true (success)
            // If not following and follow failed, following_status = false (fail)
            if (requiresFollow && !followed) {
                validationErrors.push('Follow action required but not executed');
            }
            if (requiresLike && !liked) {
                validationErrors.push('Like action required but not executed');
            }
            if (requiresComment && !commented) {
                validationErrors.push('Comment action required but not executed');
            }
            return {
                success: validationErrors.length === 0,
                followed,
                profileExtracted,
                liked,
                commented,
                error: validationErrors.length > 0 ? validationErrors.join('; ') : undefined
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
    async executeStep(step, settings) {
        if (!this.drivers) {
            throw new Error('Drivers not initialized');
        }
        const action = step.action;
        const params = this.resolveStepParams(step);
        switch (action) {
            case 'open':
                await this.handleOpen(params);
                break;
            case 'scroll':
                await this.handleScrollStep(params);
                break;
            case 'scroll_random':
                await this.handleScrollRandom(params);
                break;
            case 'extract_profile':
                await this.handleExtractProfile(params);
                break;
            case 'wait_until_extract':
                await this.handleWaitUntilExtractDone(params);
                break;
            case 'scroll_and_detect':
                await this.handleScrollAndDetectTweets(params, settings);
                break;
            case 'wait':
                await this.handleWait(params);
                break;
            case 'scroll_to':
                await this.handleScrollToElement(params);
                break;
            case 'follow':
                await this.handleFollowUser(params);
                break;
            case 'report':
                // This is handled in the main loop
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    /**
     * Resolve step params (convert step object to params, excluding 'action' and 'ms')
     */
    resolveStepParams(step) {
        const params = {};
        for (const [key, value] of Object.entries(step)) {
            if (key !== 'action' && key !== 'ms') {
                // Resolve variables in values
                if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
                    const varName = value.slice(2, -2);
                    params[key] = this.resolveVariable(varName);
                }
                else {
                    params[key] = value;
                }
            }
        }
        return params;
    }
    /**
     * Get delay value from DelaySetting (number or {min, max})
     * If it's an object, returns random value between min and max
     */
    getDelayValue(delaySetting) {
        if (typeof delaySetting === 'number') {
            return delaySetting;
        }
        return Math.random() * (delaySetting.max - delaySetting.min) + delaySetting.min;
    }
    /**
     * Resolve a variable value
     */
    resolveVariable(varName) {
        if (typeof varName === 'number') {
            return varName;
        }
        // Check context variables
        if (varName === 'current_link') {
            return this.context.current_link;
        }
        if (varName === 'user_delay_follow') {
            const delaySetting = this.context.variables?.user_delay_follow || 2000;
            return this.getDelayValue(delaySetting);
        }
        if (varName === 'delay_between_links') {
            const delaySetting = this.context.variables?.delay_between_links || 10000;
            return this.getDelayValue(delaySetting);
        }
        // Check context variables object
        if (this.context.variables && varName in this.context.variables) {
            const value = this.context.variables[varName];
            // If it's a delay setting (object with min/max), resolve it
            if (typeof value === 'object' && value !== null && 'min' in value && 'max' in value) {
                return this.getDelayValue(value);
            }
            return value;
        }
        return varName;
    }
    /**
     * Step handlers
     */
    async handleOpen(params) {
        if (!this.drivers)
            return;
        const url = params.url;
        if (!url)
            throw new Error('URL not provided');
        // Resolve variable if needed
        let finalUrl = typeof url === 'string' && url.startsWith('{{') && url.endsWith('}}')
            ? this.resolveVariable(url.slice(2, -2))
            : url;
        // Ensure finalUrl is a string
        finalUrl = String(finalUrl);
        // Parse X/Twitter URL to extract status ID and normalize to profile URL only
        let profileUrl = finalUrl;
        let statusId = null;
        try {
            // Check if URL contains status ID
            // Pattern: https://x.com/username/status/1234567890
            // Pattern: https://twitter.com/username/status/1234567890
            const statusMatch = finalUrl.match(/\/(?:status|statuses)\/(\d+)/);
            if (statusMatch) {
                statusId = statusMatch[1];
                // Extract username from URL and create profile URL only
                const profileMatch = finalUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([^\/\?]+)/);
                if (profileMatch) {
                    const username = profileMatch[1];
                    // Normalize to profile URL only (remove status part)
                    profileUrl = `https://x.com/${username}`;
                }
            }
            else {
                // For profile links, normalize to profile URL
                const profileMatch = finalUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([^\/\?]+)/);
                if (profileMatch) {
                    const username = profileMatch[1];
                    // Normalize to x.com format
                    profileUrl = `https://x.com/${username}`;
                }
            }
            // Save status ID to context for handleScrollAndDetectTweets (will detect tweet on profile page)
            this.context.target_status_id = statusId;
            console.log(`[YapGrow] Opening profile URL: ${profileUrl}${statusId ? ` (Status ID to detect: ${statusId})` : ''}`);
        }
        catch (error) {
            console.error('[YapGrow] Error parsing URL:', error);
            // Fallback to original URL
            profileUrl = finalUrl;
            this.context.target_status_id = null;
        }
        const driver = this.drivers.getDriver();
        await driver.get(profileUrl);
        await driver.sleep(2000);
    }
    async handleScrollRandom(params) {
        if (!this.drivers)
            return;
        const minSteps = params.min_steps || params.minSteps || 1;
        const maxSteps = params.max_steps || params.maxSteps || 3;
        const steps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
        const direction = params.direction || 'down';
        const stepDelay = Array.isArray(params.step_delay) || Array.isArray(params.stepDelay)
            ? (Array.isArray(params.step_delay) ? params.step_delay : params.stepDelay)[0] +
                Math.random() * ((Array.isArray(params.step_delay) ? params.step_delay : params.stepDelay)[1] -
                    (Array.isArray(params.step_delay) ? params.step_delay : params.stepDelay)[0])
            : (params.step_delay || params.stepDelay || 1000);
        for (let i = 0; i < steps; i++) {
            await this.drivers.scroll.smoothScrollWithResult({
                direction,
                scrollAmount: 300 + Math.random() * 200,
                steps: 5,
                useAntiDetection: true
            });
            await new Promise(resolve => setTimeout(resolve, stepDelay));
        }
    }
    async handleExtractProfile(params) {
        if (!this.drivers || !this.context.current_link)
            return;
        const profileUrl = this.context.current_link;
        const maxTweets = params.max_tweets || params.maxTweets || 5;
        const profileData = await this.drivers.profile.extractProfileData(profileUrl, {
            maxTweets
        });
        this.context.current_profile = profileData;
    }
    async handleWaitUntilExtractDone(params) {
        const interval = params.interval || params.check_interval || 500;
        const maxWait = params.max_wait || params.maxWait || 10000; // 10 seconds max
        let waited = 0;
        while (!this.context.current_profile && waited < maxWait) {
            await new Promise(resolve => setTimeout(resolve, interval));
            waited += interval;
        }
    }
    async handleScrollAndDetectTweets(params, settings) {
        if (!this.drivers)
            return;
        const maxScrollSteps = params.max_scrolls || params.maxScrolls || 5;
        const detectLimit = params.detect_limit || params.detectLimit || 10;
        const enableLike = params.enable_like !== false && params.enableLike !== false; // Default true
        const enableComment = params.enable_comment !== false && params.enableComment !== false; // Default true
        // Get status ID from (in order of priority):
        // 1. Explicit parameter in step config
        // 2. Context (extracted from URL in handleOpen)
        // 3. Extract from current_link as fallback
        let statusId = null;
        if (params.target_status_id !== undefined || params.targetStatusId !== undefined) {
            statusId = params.target_status_id || params.targetStatusId || null;
        }
        else if (this.context.target_status_id !== undefined) {
            statusId = this.context.target_status_id;
        }
        else if (this.context.current_link) {
            const match = this.context.current_link.match(/\/(?:status|statuses)\/(\d+)/);
            statusId = match ? match[1] : null;
        }
        const result = await this.drivers.scroll.scrollAndDetectTweets(statusId, {
            maxScrollSteps,
            detectLimit,
            scrollHeight: 800 + Math.random() * 200,
            scrollDelay: 3000
        });
        this.context.detected_tweets = result.detectedTweets;
        // If target tweet found, process interaction
        if (result.tweet && (enableLike || enableComment)) {
            this.context.detected_target_tweet = result.tweet;
            // Scroll to tweet element first
            const driver = this.drivers.getDriver();
            try {
                await driver.executeScript('arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });', result.tweet.cellInnerDiv);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            catch (error) {
                console.log('[YapGrow] Error scrolling to tweet:', error);
            }
            // Extract post content and generate AI comment (if enabled)
            let commentText = undefined;
            if (enableComment && settings?.aiCommentEnabled) {
                // Validate databasePrompt before attempting to generate comment
                if (!settings.databasePrompt || !settings.databasePrompt.finalPrompt || !settings.databasePrompt.requirePrompt) {
                    console.error('[YapGrow] ❌ Cannot generate AI comment: databasePrompt is missing or incomplete');
                    console.error('[YapGrow] Settings check:', {
                        aiCommentEnabled: settings.aiCommentEnabled,
                        hasGeminiApiKey: !!settings.geminiApiKey,
                        hasDatabasePrompt: !!settings.databasePrompt,
                        hasFinalPrompt: !!(settings.databasePrompt?.finalPrompt),
                        hasRequirePrompt: !!(settings.databasePrompt?.requirePrompt)
                    });
                    // Disable comment if databasePrompt is missing
                    console.log('[YapGrow] Disabling comment for this tweet due to missing databasePrompt');
                }
                else {
                    try {
                        // Extract post content directly from tweet element using JavaScript
                        const postContent = await driver.executeScript(`
              const tweet = arguments[0];
              // Find the tweet text element
              const textElement = tweet.querySelector('[data-testid="tweetText"]');
              if (textElement) {
                return textElement.innerText || textElement.textContent || '';
              }
              // Fallback: try to get text from article
              const article = tweet.closest('article');
              if (article) {
                const spans = article.querySelectorAll('span');
                let text = '';
                spans.forEach(span => {
                  const spanText = span.innerText || span.textContent || '';
                  if (spanText.length > 10 && !spanText.includes('@') && !spanText.startsWith('http')) {
                    text += spanText + ' ';
                  }
                });
                return text.trim();
              }
              return '';
            `, result.tweet.element);
                        if (postContent && postContent.trim().length > 0) {
                            console.log('[YapGrow] Extracted post content, generating AI comment...');
                            console.log(`[YapGrow] Post content preview: "${postContent.substring(0, 100)}..."`);
                            // Convert YapGrowSettings to YapCommentSettings for generateCommentWithUserStyles
                            const commentSettings = {
                                aiCommentEnabled: settings.aiCommentEnabled || false,
                                aiCommentPrompt: settings.aiCommentPrompt || '',
                                geminiApiKey: settings.geminiApiKey || '',
                                delayRange: { min: 0, max: 0 }, // Not used for comment generation
                                links: [],
                                aiModel: settings.aiModel,
                                commentStyle: settings.commentStyle,
                                commentLength: settings.commentLength,
                                includeHashtags: settings.includeHashtags,
                                maxHashtags: settings.maxHashtags,
                                includeMentions: settings.includeMentions,
                                maxMentions: settings.maxMentions,
                                promptStyleMode: settings.promptStyleMode,
                                selectedPromptStyles: settings.selectedPromptStyles,
                                promptStyleCategory: settings.promptStyleCategory,
                                databasePrompt: settings.databasePrompt,
                                profileId: settings.profileId
                            };
                            // Generate comment using AI
                            const generatedComment = await (0, utils_1.generateCommentWithUserStyles)(postContent.trim(), commentSettings);
                            if (generatedComment) {
                                commentText = generatedComment;
                                console.log(`[YapGrow] Generated AI comment: "${commentText.substring(0, 100)}..."`);
                            }
                            else {
                                console.log('[YapGrow] Failed to generate AI comment, will proceed without comment text');
                            }
                        }
                        else {
                            console.log('[YapGrow] Could not extract post content from tweet element');
                        }
                    }
                    catch (error) {
                        console.error('[YapGrow] Error generating AI comment:', error);
                        // Continue without comment text
                    }
                }
            }
            // Process interaction (like and comment) using rawops
            const tweetData = {
                element: result.tweet.element,
                link: result.tweet.link,
                statusId: result.tweet.statusId,
                cellInnerDiv: result.tweet.cellInnerDiv
            };
            const interactionOptions = {
                enableLike,
                enableComment,
                commentText: commentText, // Use AI generated comment or undefined
                useAntiDetection: true,
                behavioralPattern: 'browsing',
                mouseIntensity: 'medium'
            };
            const interactionResult = await this.drivers.comment.processTweetInteraction(tweetData, interactionOptions);
            // Log interaction result for debugging
            console.log(`[YapGrow] Interaction result:`, interactionResult);
            this.context.interaction_result = interactionResult;
        }
        else {
            // No tweet found or interactions disabled
            this.context.detected_target_tweet = null;
            // If interactions were enabled but no tweet found, set result to indicate no interaction attempted
            if (enableLike || enableComment) {
                console.log(`[YapGrow] No tweet detected or interactions disabled, setting interaction_result to { liked: false, commented: false }`);
                this.context.interaction_result = { liked: false, commented: false };
            }
            else {
                this.context.interaction_result = undefined;
            }
        }
    }
    async handleScrollStep(params) {
        if (!this.drivers)
            return;
        // Handle different scroll formats
        if (params.times !== undefined) {
            // New format: { action: "scroll", times: 2, distance: 800, randomize: true }
            const times = params.times || 1;
            const distance = params.distance || 500;
            const direction = params.direction || 'down';
            const randomize = params.randomize !== false;
            for (let i = 0; i < times; i++) {
                const scrollAmount = randomize
                    ? distance + (Math.random() * 200 - 100) // ±100px variation
                    : distance;
                await this.drivers.scroll.smoothScrollWithResult({
                    direction,
                    scrollAmount,
                    useAntiDetection: true
                });
                if (i < times - 1) {
                    await this.drivers.getDriver().sleep(500 + Math.random() * 500);
                }
            }
        }
        else {
            // Legacy format: { action: "scroll", direction: "up", distance: "medium" }
            const direction = params.direction || 'down';
            const distanceMap = {
                short: 200,
                medium: 500,
                long: 1000
            };
            const distance = params.distance || 'medium';
            const scrollAmount = typeof distance === 'string'
                ? (distanceMap[distance] || distanceMap.medium)
                : (distance || 500);
            await this.drivers.scroll.smoothScrollWithResult({
                direction,
                scrollAmount,
                useAntiDetection: true
            });
        }
    }
    async handleWait(params) {
        // Handle wait/delay actions
        if (params.min !== undefined && params.max !== undefined) {
            // Random delay: { action: "wait", min: 1000, max: 3000 }
            const delay = Math.random() * (params.max - params.min) + params.min;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        else if (params.ms !== undefined) {
            // Fixed delay: { action: "wait", ms: 1500 }
            const delay = this.resolveVariable(params.ms);
            if (typeof delay === 'number') {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        else if (params.seconds !== undefined) {
            // Variable delay: { action: "wait", seconds: "{{delay_between_links}}" }
            const delay = this.resolveVariable(params.seconds);
            if (typeof delay === 'number') {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    async handleScrollToElement(params) {
        if (!this.drivers)
            return;
        try {
            const driver = this.drivers.getDriver();
            const selector = params.selector;
            const by = params.by || 'css'; // 'css' or 'xpath'
            if (!selector)
                return;
            let element;
            if (by === 'xpath') {
                element = await driver.findElement(selenium_webdriver_1.By.xpath(selector));
            }
            else {
                element = await driver.findElement(selenium_webdriver_1.By.css(selector));
            }
            if (element) {
                await driver.executeScript('arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });', element);
            }
        }
        catch (e) {
            // Element not found, continue
        }
    }
    async handleFollowUser(params) {
        if (!this.drivers)
            return;
        // Always check following status first (auto-check, driver handles automatically)
        this.context.following_status = await this.drivers.profile.isAlreadyFollowing();
        const isFollowing = this.context.following_status;
        // If already following, skip (this is success, keep status as true)
        if (isFollowing) {
            console.log(`[YapGrow] Already following, skipping follow action`);
            return;
        }
        // Attempt to follow and check result
        const result = await this.drivers.profile.followProfile({
            useAntiDetection: true,
            behavioralPattern: 'browsing',
            mouseIntensity: 'medium'
        });
        // Only set following_status to true if follow was successful
        if (result.success) {
            this.context.following_status = true;
            console.log(`[YapGrow] Follow successful`);
        }
        else {
            // Follow failed, keep status as false
            this.context.following_status = false;
            console.log(`[YapGrow] Follow failed: ${result.error || 'Unknown error'}`);
        }
    }
    async close() {
        this.isClosed = true;
        if (this.xClient) {
            await this.xClient.close();
        }
    }
}
exports.YapGrow = YapGrow;
//# sourceMappingURL=yg.js.map