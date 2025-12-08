"use strict";
// packages/rawbot/src/yap/comment/yapcomment.ts
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
exports.CommentByProfile = void 0;
const XClient_1 = require("../../client/XClient");
const rawai_1 = require("@rawops/rawai");
const rawops_1 = require("@rawops/rawops");
// Remove ElementFinder import as it's not available in new structure
const selenium_webdriver_1 = require("selenium-webdriver");
const path = __importStar(require("path"));
const utils_1 = require("./utils");
class CommentByProfile {
    constructor() {
        this.xClient = null;
        this.contentAI = null;
        this.commentOps = null;
        this.likeOps = null;
        this.scrollOps = null;
        this.extractionOps = null;
        this.usernameExtractionOps = null;
        this.profileHandle = '';
        this.profileId = '';
        this.cacheDir = '';
        this.runId = '';
        this.runType = 'COMMENT';
        this.isClosed = false;
        this.processedSettings = undefined;
        // Initialize the service
    }
    async initializeWithProfile(profile, proxyConfig) {
        this.xClient = new XClient_1.XClient();
        await this.xClient.initializeForAutomation(profile.handle, proxyConfig);
        // Setup cache directory
        this.profileHandle = profile.handle;
        this.profileId = profile.id;
        this.cacheDir = path.join(process.cwd(), 'cache', `profile_${this.profileHandle}`);
        await (0, utils_1.ensureCacheDirectory)(this.cacheDir);
        // Initialize operations
        const driver = this.xClient.getDriver();
        if (driver) {
            this.commentOps = new rawops_1.CommentOps(driver);
            this.likeOps = new rawops_1.LikeOps(driver);
            this.scrollOps = new rawops_1.ScrollOps(driver);
            this.extractionOps = new rawops_1.ExtractionOps(driver);
            this.usernameExtractionOps = new rawops_1.UsernameExtractionOps(driver);
        }
    }
    async runYapCommentWorkflow(project, run, settings) {
        const startTime = Date.now();
        const errors = [];
        let commentsPosted = 0;
        let likesPosted = 0;
        const processedLinks = [];
        const failedLinks = [];
        // Store run information for cache submission
        this.runId = run.id;
        this.runType = 'COMMENT';
        this.processedSettings = { links: settings.links };
        try {
            if (!this.xClient || !this.commentOps || !this.likeOps || !this.usernameExtractionOps) {
                throw new Error('XClient or operations not initialized');
            }
            console.log(`[YapComment] Starting NEW workflow with ${settings.links.length} links`);
            // Step 0: Filter out already processed links
            const filteredLinks = await (0, utils_1.filterProcessedLinks)(this.cacheDir, settings.links);
            console.log(`[YapComment] After filtering processed links: ${filteredLinks.length} links remaining`);
            if (filteredLinks.length === 0) {
                console.log('[YapComment] All links have been processed, workflow complete');
                return {
                    success: true,
                    commentsPosted: 0,
                    likesPosted: 0,
                    repliesPosted: 0,
                    errors: [],
                    duration: Date.now() - startTime,
                    processedLinks: [],
                    failedLinks: []
                };
            }
            // Initialize AI if enabled
            const hasGeminiKey = !!settings.geminiApiKey;
            const hasProfileKeys = settings.profileApiKeys && (settings.profileApiKeys.geminiApiKey ||
                settings.profileApiKeys.openaiApiKey ||
                settings.profileApiKeys.deepseekApiKey ||
                settings.profileApiKeys.huggingfaceApiKey);
            if (settings.aiCommentEnabled && (hasGeminiKey || hasProfileKeys)) {
                const aiConfig = {
                    model: settings.aiModel || 'gemini-flash-latest',
                    maxRetries: 3,
                    retryDelay: 2000
                };
                const apiKeys = {};
                if (settings.profileApiKeys) {
                    apiKeys.gemini = settings.profileApiKeys.geminiApiKey;
                    apiKeys.openai = settings.profileApiKeys.openaiApiKey;
                    apiKeys.deepseek = settings.profileApiKeys.deepseekApiKey;
                    apiKeys.huggingface = settings.profileApiKeys.huggingfaceApiKey;
                    if (settings.profileApiKeys.apiKeyPriority) {
                        aiConfig.providerPriority = settings.profileApiKeys.apiKeyPriority;
                    }
                }
                // Map legacy geminiApiKey if not already present
                if (settings.geminiApiKey && !apiKeys.gemini) {
                    apiKeys.gemini = settings.geminiApiKey;
                }
                aiConfig.apiKeys = apiKeys;
                // Ensure we have at least one provider if priority list is empty or missing
                if (!aiConfig.providerPriority && apiKeys.gemini) {
                    aiConfig.providerPriority = ['gemini'];
                }
                this.contentAI = new rawai_1.ContentAI(aiConfig);
                console.log('[YapComment] AI initialized for comment generation');
            }
            // Step 1: Navigate to Home and perform Random Anti-detect
            console.log('[YapComment] Step 1: Navigating to Home and performing Random Anti-detect...');
            await this.navigateToHomeWithAntiDetection();
            // Step 2: Process each link individually (extract username from each link)
            for (let i = 0; i < filteredLinks.length; i++) {
                // Check if service is closed
                if (this.isClosed) {
                    console.log('[YapComment] Service closed, stopping workflow');
                    break;
                }
                const link = filteredLinks[i];
                console.log(`[YapComment] Processing link ${i + 1}/${filteredLinks.length}: ${link}`);
                try {
                    const result = await this.processLinkWithNewWorkflow(link, settings);
                    // Check if comment failed (comment is required for success)
                    const commentFailed = !result.commented;
                    // If there's a page error, prioritize that over comment failure
                    if (result.success && !commentFailed) {
                        processedLinks.push(link);
                        if (result.liked)
                            likesPosted++;
                        if (result.commented)
                            commentsPosted++;
                        // Use parallel operations for better performance
                        const parallelResult = await (0, utils_1.saveCacheAndSubmitAPI)(this.cacheDir, this.profileId, link, 'done', {
                            liked: result.liked,
                            commented: result.commented,
                            runId: this.runId
                        }, 'COMMENT');
                        // Log any errors from parallel operations
                        if (parallelResult.errors.length > 0) {
                            errors.push(...parallelResult.errors);
                        }
                        console.log(`[YapComment] ✅ Successfully processed: ${link}`);
                    }
                    else {
                        failedLinks.push(link);
                        // Prioritize page error messages over comment failure
                        const errorMsg = result.error || (commentFailed ? 'Comment failed - no comment posted' : 'Processing failed');
                        errors.push(`Failed to process ${link}: ${errorMsg}`);
                        // Use parallel operations for failed links too
                        const parallelResult = await (0, utils_1.saveCacheAndSubmitAPI)(this.cacheDir, this.profileId, link, 'failed', {
                            liked: result.liked,
                            commented: result.commented,
                            error: errorMsg,
                            runId: this.runId
                        }, 'COMMENT');
                        // Log any errors from parallel operations
                        if (parallelResult.errors.length > 0) {
                            errors.push(...parallelResult.errors);
                        }
                        console.log(`[YapComment] ❌ Failed to process: ${link} - ${errorMsg}`);
                    }
                    // Delay between links
                    if (i < filteredLinks.length - 1) {
                        const delay = settings.delayRange ?
                            Math.random() * (settings.delayRange.max - settings.delayRange.min) + settings.delayRange.min :
                            Math.random() * 20000 + 10000; // 10-30 seconds fallback
                        console.log(`[YapComment] Waiting ${Math.round(delay / 1000)}s before next link...`);
                        // Check if closed during delay
                        if (this.isClosed) {
                            console.log('[YapComment] Service closed during delay, stopping workflow');
                            break;
                        }
                        await this.commentOps.randomDelay(delay, delay + 5000);
                    }
                }
                catch (error) {
                    failedLinks.push(link);
                    errors.push(`Error processing ${link}: ${error}`);
                    console.error(`[YapComment] Error processing link ${link}:`, error);
                }
            }
            console.log(`[YapComment] Workflow completed: ${commentsPosted} comments, ${likesPosted} likes`);
            return {
                success: true,
                commentsPosted,
                likesPosted,
                repliesPosted: 0, // Always 0 since replies are part of comments
                errors,
                duration: Date.now() - startTime,
                processedLinks,
                failedLinks
            };
        }
        catch (error) {
            errors.push(`YapComment workflow failed: ${error}`);
            return {
                success: false,
                commentsPosted,
                likesPosted,
                repliesPosted: 0, // Always 0 since replies are part of comments
                errors,
                duration: Date.now() - startTime,
                processedLinks,
                failedLinks
            };
        }
    }
    /**
     * Navigate to Home and perform Random Anti-detect (Mouse, Delay, Scroll)
     */
    async navigateToHomeWithAntiDetection() {
        try {
            const driver = this.xClient?.getDriver();
            if (!driver)
                throw new Error('Driver not available');
            console.log('[YapComment] Navigating to Home...');
            await driver.get('https://x.com/home');
            await this.commentOps.randomDelay(3000, 5000);
            // Wait for page to load
            const pageLoadResult = await (0, utils_1.waitForPageLoad)(driver, this.extractionOps, this.commentOps, 15000);
            if (!pageLoadResult.success) {
                console.log('[YapComment] Home page did not load properly');
                throw new Error('Home page load failed');
            }
            console.log('[YapComment] Performing Random Anti-detect patterns...');
            // Random anti-detection scroll patterns
            await (0, utils_1.performRandomScrollPattern)(driver, this.scrollOps, this.commentOps);
            await (0, utils_1.performIdleScroll)(driver, this.scrollOps, this.commentOps);
            // Random mouse movements
            await (0, utils_1.performRandomMouseMovements)(driver, this.commentOps);
            // Random delays
            await this.commentOps.randomDelay(2000, 4000);
            console.log('[YapComment] Anti-detection patterns completed');
        }
        catch (error) {
            console.error('[YapComment] Error in navigateToHomeWithAntiDetection:', error);
            throw error;
        }
    }
    /**
     * Process workflow for a single link with new approach
     */
    async processLinkWithNewWorkflow(link, settings) {
        try {
            // Step 1: Extract username from link
            const username = this.usernameExtractionOps.extractUsernameFromLink(link);
            if (!username) {
                console.log(`[YapComment] Could not extract username from link: ${link}`);
                return { success: false, error: 'Could not extract username from link' };
            }
            console.log(`[YapComment] Extracted username @${username} from link: ${link}`);
            // Step 2: Search and click username using explore tab
            console.log(`[YapComment] Searching and clicking @${username}...`);
            const searchResult = await this.usernameExtractionOps.searchAndClickUsername(username, {
                useAntiDetection: true,
                behavioralPattern: 'browsing',
                mouseIntensity: 'medium'
            });
            if (!searchResult.found) {
                console.log(`[YapComment] Failed to find user @${username}: ${searchResult.error}`);
                return { success: false, error: `Failed to find user @${username}: ${searchResult.error}` };
            }
            // Step 3: Wait for profile page to load completely
            console.log(`[YapComment] Waiting for @${username}'s profile to load...`);
            const driver = this.xClient?.getDriver();
            if (!driver) {
                return { success: false, error: 'Driver not available' };
            }
            const pageLoadResult = await (0, utils_1.waitForPageLoad)(driver, this.extractionOps, this.commentOps, 15000);
            if (!pageLoadResult.success) {
                console.log(`[YapComment] Profile page did not load properly for @${username}`);
                // If we have error details, use them
                if (pageLoadResult.errorDetail) {
                    const errorDetail = pageLoadResult.errorDetail;
                    console.log(`[YapComment] Profile page error detected: ${errorDetail.type} - ${errorDetail.message}`);
                    // Return specific error based on error type
                    let errorMessage = '';
                    switch (errorDetail.type) {
                        case 'page_not_found':
                            errorMessage = `Profile not found: ${errorDetail.message}`;
                            break;
                        case 'account_suspended':
                            errorMessage = `Profile suspended: ${errorDetail.message}`;
                            break;
                        case 'tweet_unavailable':
                            errorMessage = `Profile unavailable: ${errorDetail.message}`;
                            break;
                        default:
                            errorMessage = `Profile error: ${errorDetail.message}`;
                    }
                    return { success: false, error: errorMessage };
                }
                // Fallback for timeout without specific error
                return { success: false, error: 'Profile page load timeout' };
            }
            // Step 4: Scroll to bottom 3-5 steps (3s each) with height 300-500px
            console.log(`[YapComment] Starting scroll pattern to find tweets...`);
            const scrollResult = await this.scrollAndDetectTweets(link, settings);
            return scrollResult;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Scroll and detect tweets with interaction matching
     */
    async scrollAndDetectTweets(originalLink, settings) {
        try {
            const driver = this.xClient?.getDriver();
            if (!driver) {
                return { success: false, error: 'Driver not available' };
            }
            // Extract status ID from original link for comparison
            const statusIdMatch = originalLink.match(/\/status\/(\d+)/);
            const targetStatusId = statusIdMatch ? statusIdMatch[1] : null;
            console.log(`[YapComment] Looking for tweet with status ID: ${targetStatusId}`);
            let totalLiked = 0;
            let totalCommented = 0;
            const maxScrollSteps = 10; // 3-5 steps as per task
            const scrollHeight = 800 + Math.random() * 200; // 300-500px as per task
            for (let step = 0; step < maxScrollSteps; step++) {
                console.log(`[YapComment] Scroll step ${step + 1}/${maxScrollSteps}...`);
                // Get all visible tweets
                const tweets = await driver.executeScript(`
          const tweets = document.querySelectorAll('[data-testid="tweet"]');
          const tweetData = [];
          
          tweets.forEach(tweet => {
            // Find the cellInnerDiv article
            const cellInnerDiv = tweet.closest('[data-testid="cellInnerDiv"]');
            if (!cellInnerDiv) return;
            
            // Extract tweet link
            const linkElement = tweet.querySelector('a[href*="/status/"]');
            if (!linkElement) return;
            
            const href = linkElement.getAttribute('href');
            if (!href) return;
            
            // Extract status ID
            const statusMatch = href.match(/\\/status\\/(\\d+)/);
            const statusId = statusMatch ? statusMatch[1] : null;
            
            tweetData.push({
              element: tweet,
              link: href,
              statusId: statusId,
              cellInnerDiv: cellInnerDiv
            });
          });
          
          return tweetData;
        `);
                console.log(`[YapComment] Found ${tweets.length} tweets in current view`);
                // Check each tweet for matching status ID
                for (const tweet of tweets) {
                    if (targetStatusId && tweet.statusId === targetStatusId) {
                        console.log(`[YapComment] Found matching tweet with status ID: ${tweet.statusId}`);
                        // Scroll to this specific tweet
                        await driver.executeScript('arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });', tweet.cellInnerDiv);
                        await this.commentOps.randomDelay(2000, 3000);
                        // Process interaction (like and comment) with the specific tweet article
                        const interactionResult = await this.processTweetInteractionWithArticle(tweet, settings);
                        if (interactionResult.success) {
                            if (interactionResult.liked)
                                totalLiked++;
                            if (interactionResult.commented)
                                totalCommented++;
                            console.log(`[YapComment] ✅ Successfully processed matching tweet: ${tweet.link}`);
                            return {
                                success: true,
                                liked: totalLiked > 0,
                                commented: totalCommented > 0
                            };
                        }
                    }
                }
                // Scroll down for next step
                if (step < maxScrollSteps - 1) {
                    // Add random variation to scroll height (-10% to +30%)
                    const variation = (Math.random() - 0.1) * 0.4; // -0.1 to +0.3
                    const actualScrollHeight = Math.round(scrollHeight * (1 + variation));
                    await driver.executeScript(`window.scrollBy(0, ${actualScrollHeight});`);
                    await this.commentOps.randomDelay(3000, 3000); // 3s wait as per task
                }
            }
            console.log(`[YapComment] Completed ${maxScrollSteps} scroll steps, no matching tweet found`);
            return {
                success: false,
                error: 'Target tweet not found after scrolling'
            };
        }
        catch (error) {
            console.error('[YapComment] Error in scrollAndDetectTweets:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Process interaction with a specific tweet article (like and reply)
     */
    async processTweetInteractionWithArticle(tweetData, settings) {
        try {
            const driver = this.xClient?.getDriver();
            if (!driver) {
                return { success: false, error: 'Driver not available' };
            }
            console.log(`[YapComment] Processing tweet interaction for status ID: ${tweetData.statusId}`);
            // Step 1: Like the tweet using the specific tweet article
            let liked = false;
            try {
                console.log(`[YapComment] Attempting to like tweet...`);
                // Find like button within the specific tweet article
                const likeButton = await driver.executeScript(`
          const tweet = arguments[0];
          const likeButton = tweet.querySelector('[data-testid="like"]');
          return likeButton;
        `, tweetData.element);
                if (likeButton) {
                    // Use JavaScript click to avoid interception issues
                    await driver.executeScript('arguments[0].click();', likeButton);
                    await this.commentOps.randomDelay(1000, 2000);
                    liked = true;
                    console.log(`[YapComment] Like result: success`);
                }
                else {
                    console.log(`[YapComment] Like button not found`);
                }
            }
            catch (error) {
                console.log('[YapComment] Failed to like tweet:', error);
            }
            // Wait after like
            await this.commentOps.randomDelay(2000, 3000);
            // Step 2: Reply to the tweet
            let commented = false;
            try {
                console.log(`[YapComment] Attempting to reply to tweet...`);
                // Find reply button within the specific tweet article
                const replyButton = await driver.executeScript(`
          const tweet = arguments[0];
          const replyButton = tweet.querySelector('[data-testid="reply"]');
          return replyButton;
        `, tweetData.element);
                if (replyButton) {
                    // Use JavaScript click to avoid interception issues
                    await driver.executeScript('arguments[0].click();', replyButton);
                    await this.commentOps.randomDelay(2000, 3000);
                    console.log(`[YapComment] Reply button clicked successfully`);
                    // Generate comment
                    const postContent = await this.extractionOps.getPostContent({
                        includeEmojis: true,
                        cleanContent: true,
                        debugMode: false
                    }) || '';
                    if (postContent && settings.aiCommentEnabled) {
                        const commentText = await (0, utils_1.generateCommentWithUserStyles)(postContent, settings);
                        if (commentText) {
                            console.log(`[YapComment] Generated comment: "${commentText}"`);
                            console.log(`[YapComment] Using commentOnFirstTweet to post comment...`);
                            // Use commentOnFirstTweet method
                            const commentResult = await this.commentOps.commentOnFirstTweet(commentText, {
                                useAntiDetection: true,
                                behavioralPattern: 'browsing',
                                mouseIntensity: 'medium'
                            });
                            commented = commentResult.success;
                            console.log(`[YapComment] Comment result: ${commented ? 'success' : 'failed'}`);
                            if (commented) {
                                console.log(`[YapComment] Comment posted successfully: "${commentText}"`);
                            }
                            else {
                                console.log(`[YapComment] Failed to post comment using commentOnFirstTweet`);
                            }
                        }
                        else {
                            console.log(`[YapComment] Failed to generate comment text`);
                        }
                    }
                    else {
                        console.log(`[YapComment] Skipping comment generation:`, {
                            hasContent: !!postContent,
                            aiEnabled: settings.aiCommentEnabled
                        });
                    }
                    // Close comment modal
                    await this.closeCommentModal();
                    // Random scroll after closing modal to simulate natural behavior
                    console.log('[YapComment] Performing random scroll after closing modal...');
                    await (0, utils_1.performRandomScrollPattern)(driver, this.scrollOps, this.commentOps);
                    await (0, utils_1.performIdleScroll)(driver, this.scrollOps, this.commentOps);
                }
                else {
                    console.log(`[YapComment] Reply button not found`);
                }
            }
            catch (error) {
                console.log('[YapComment] Failed to comment on tweet:', error);
                // Try to close modal anyway
                await this.closeCommentModal();
            }
            return {
                success: liked || commented,
                liked,
                commented
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
     * Close comment modal by clicking the Back button
     */
    async closeCommentModal() {
        try {
            const driver = this.xClient?.getDriver();
            if (!driver)
                return;
            console.log('[YapComment] Attempting to close comment modal...');
            // First try to find and click the Back button
            try {
                const backButton = await driver.findElement(selenium_webdriver_1.By.css('[data-testid="app-bar-back"]'));
                await backButton.click();
                await this.commentOps.randomDelay(1000, 2000);
                console.log('[YapComment] Comment modal closed using Back button');
                return;
            }
            catch (backError) {
                console.log('[YapComment] Back button not found, trying alternative methods...');
            }
            // Try clicking outside the modal (modal mask)
            try {
                const modalMask = await driver.findElement(selenium_webdriver_1.By.css('[data-testid="twc-cc-mask"]'));
                await modalMask.click();
                await this.commentOps.randomDelay(1000, 2000);
                console.log('[YapComment] Comment modal closed using modal mask');
                return;
            }
            catch (maskError) {
                console.log('[YapComment] Modal mask not found, trying Escape key...');
            }
            // Try pressing Escape key as fallback
            try {
                await driver.actions().sendKeys('\uE00C').perform(); // Escape key
                await this.commentOps.randomDelay(1000, 2000);
                console.log('[YapComment] Comment modal closed using Escape key');
                return;
            }
            catch (escapeError) {
                console.log('[YapComment] Escape key also failed:', escapeError);
            }
            // Final fallback - try clicking anywhere on the page
            try {
                await driver.actions().move({ x: 100, y: 100 }).click().perform();
                await this.commentOps.randomDelay(1000, 2000);
                console.log('[YapComment] Comment modal closed using click fallback');
            }
            catch (finalError) {
                console.log('[YapComment] All methods failed to close modal:', finalError);
            }
        }
        catch (error) {
            console.log('[YapComment] Error in closeCommentModal:', error);
        }
    }
    async processCommentLink(link, settings) {
        try {
            // Check if service is closed
            if (this.isClosed) {
                return {
                    success: false,
                    error: 'Service is closed'
                };
            }
            const driver = this.xClient?.getDriver();
            if (!driver || !this.commentOps || !this.likeOps || !this.scrollOps) {
                throw new Error('Driver or operations not available');
            }
            // Navigate to the tweet and wait for page load
            await driver.get(link);
            // Wait for page to load completely with timeout
            console.log('[YapComment] Waiting for page to load...');
            const pageLoadResult = await (0, utils_1.waitForPageLoad)(driver, this.extractionOps, this.commentOps, 15000);
            if (!pageLoadResult.success) {
                console.log('[YapComment] Page did not load properly or has error...');
                // If we have error details, use them
                if (pageLoadResult.errorDetail) {
                    const errorDetail = pageLoadResult.errorDetail;
                    console.log(`[YapComment] Page error detected: ${errorDetail.type} - ${errorDetail.message}`);
                    // Return specific error based on error type
                    let errorMessage = '';
                    switch (errorDetail.type) {
                        case 'page_not_found':
                            errorMessage = `Page not found: ${errorDetail.message}`;
                            break;
                        case 'account_suspended':
                            errorMessage = `Account suspended: ${errorDetail.message}`;
                            break;
                        case 'tweet_unavailable':
                            errorMessage = `Tweet unavailable: ${errorDetail.message}`;
                            break;
                        default:
                            errorMessage = `Page error: ${errorDetail.message}`;
                    }
                    return { success: false, error: errorMessage };
                }
                // Fallback for timeout without specific error
                return { success: false, error: 'Page load timeout' };
            }
            // Get page info for logging
            const pageInfo = await (0, utils_1.getPageInfo)(this.extractionOps);
            console.log(`[YapComment] Page loaded: ${pageInfo.tweetCount} tweets, has replies: ${pageInfo.hasReplies}`);
            // Step 1: Smooth scroll to top with anti-detection
            await this.scrollOps.scrollToTop();
            await this.commentOps.randomDelay(1000, 2000);
            // Step 2: Random anti-detection scroll pattern
            await (0, utils_1.performRandomScrollPattern)(driver, this.scrollOps, this.commentOps);
            // Random idle scroll to simulate human behavior
            await (0, utils_1.performIdleScroll)(driver, this.scrollOps, this.commentOps);
            // Step 3: Extract post content using ExtractionOps (optimized)
            let postContent = '';
            try {
                postContent = await this.extractionOps.getPostContent({
                    includeEmojis: true,
                    cleanContent: true,
                    debugMode: true
                }) || '';
                if (postContent) {
                    console.log(`[YapComment] Extracted post content: "${postContent.substring(0, 100)}..."`);
                    // Step 3.1: Scroll to find comments after extracting content
                    await (0, utils_1.scrollToFindComments)(driver, this.scrollOps, this.extractionOps, this.commentOps);
                }
                else {
                    console.log('[YapComment] Could not extract post content, proceeding without AI comment');
                }
            }
            catch (error) {
                console.log('[YapComment] Could not extract post content, proceeding without AI comment');
            }
            // Step 4: Always treat as main tweet - like and comment main content
            console.log('[YapComment] Processing as main tweet - will like and comment main content');
            // Step 5: Scroll back to top to comment
            console.log('[YapComment] Scrolling back to top to comment...');
            await this.scrollOps.scrollToTop();
            await this.commentOps.randomDelay(1000, 2000);
            // Step 6: Like the post
            let liked = false;
            try {
                const likeResult = await this.likeOps.likeFirstTweet({
                    useAntiDetection: true,
                    behavioralPattern: 'browsing',
                    mouseIntensity: 'medium'
                });
                liked = likeResult.success;
                console.log(`[YapComment] Like result: ${liked ? 'success' : 'failed'}`);
            }
            catch (error) {
                console.log('[YapComment] Failed to like post:', error);
            }
            // Random scroll after like with anti-detection
            await (0, utils_1.performRandomScrollPattern)(driver, this.scrollOps, this.commentOps);
            // Random idle scroll
            await (0, utils_1.performIdleScroll)(driver, this.scrollOps, this.commentOps);
            await this.commentOps.randomDelay(2000, 3000);
            // Step 7: COMMENT ON MAIN TWEET (always)
            let commented = false;
            if (postContent) {
                try {
                    console.log('[YapComment] Generating AI comment...');
                    const commentText = await (0, utils_1.generateCommentWithUserStyles)(postContent, settings);
                    if (commentText) {
                        console.log(`[YapComment] Generated comment: "${commentText}"`);
                        console.log('[YapComment] Posting comment...');
                        const commentResult = await this.commentOps.commentOnFirstTweet(commentText, {
                            useAntiDetection: true,
                            behavioralPattern: 'browsing',
                            mouseIntensity: 'medium'
                        });
                        commented = commentResult.success;
                        console.log(`[YapComment] Comment result: ${commented ? 'success' : 'failed'}`);
                    }
                    else {
                        console.log('[YapComment] Failed to generate comment text');
                    }
                }
                catch (error) {
                    console.log('[YapComment] Failed to generate or post comment:', error);
                }
            }
            else {
                console.log('[YapComment] Skipping comment generation:', {
                    hasContent: !!postContent,
                    aiEnabled: settings.aiCommentEnabled,
                    hasAI: !!this.contentAI
                });
            }
            // Random scroll after comment with anti-detection
            if (commented) {
                await (0, utils_1.performRandomScrollPattern)(driver, this.scrollOps, this.commentOps);
                // Random idle scroll
                await (0, utils_1.performIdleScroll)(driver, this.scrollOps, this.commentOps);
            }
            // Step 8: Final random scroll pattern
            await (0, utils_1.performRandomScrollPattern)(driver, this.scrollOps, this.commentOps);
            // Final idle scroll
            await (0, utils_1.performIdleScroll)(driver, this.scrollOps, this.commentOps);
            return {
                success: commented, // Only success if comment was posted
                liked,
                commented
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
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
exports.CommentByProfile = CommentByProfile;
