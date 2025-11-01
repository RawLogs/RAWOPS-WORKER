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
exports.CommentByLink = void 0;
const XClient_1 = require("../../client/XClient");
const rawai_1 = require("@rawops/rawai");
const rawops_1 = require("@rawops/rawops");
const path = __importStar(require("path"));
const utils_1 = require("./utils");
class CommentByLink {
    constructor() {
        this.xClient = null;
        this.contentAI = null;
        this.commentOps = null;
        this.likeOps = null;
        this.scrollOps = null;
        this.extractionOps = null;
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
            if (!this.xClient || !this.commentOps || !this.likeOps) {
                throw new Error('XClient or operations not initialized');
            }
            console.log(`[YapComment] Starting workflow with ${settings.links.length} links`);
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
            if (settings.aiCommentEnabled && settings.geminiApiKey) {
                this.contentAI = new rawai_1.ContentAI({
                    apiKey: settings.geminiApiKey,
                    model: settings.aiModel || 'gemini-flash-latest',
                    maxRetries: 3,
                    retryDelay: 2000
                });
                console.log('[YapComment] AI initialized for comment generation');
            }
            // Process each link
            for (let i = 0; i < filteredLinks.length; i++) {
                // Check if service is closed
                if (this.isClosed) {
                    console.log('[YapComment] Service closed, stopping workflow');
                    break;
                }
                const link = filteredLinks[i];
                console.log(`[YapComment] Processing link ${i + 1}/${filteredLinks.length}: ${link}`);
                try {
                    const result = await this.processCommentLink(link, settings, run);
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
                        });
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
                        });
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
    async processCommentLink(link, settings, run) {
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
                    // Scroll to find comments after extracting content
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
            // Step 7: COMMENT LOGIC - Decide whether to reply to comment or main tweet
            let commented = false;
            if (postContent) {
                try {
                    // Check if we should reply to a comment instead of the main tweet
                    const currentProfileHandle = run.profile?.handle || 'unknown';
                    const otherUserTweetAnalysis = await this.extractionOps.findLastTweetFromOtherUsers(currentProfileHandle);
                    if (otherUserTweetAnalysis.hasOtherUserTweet && otherUserTweetAnalysis.lastTweetContent) {
                        console.log('[YapComment] Found tweet from other user - will reply to that tweet');
                        // Generate reply to the tweet using generateCommentWithUserStyles
                        const commentText = await (0, utils_1.generateCommentWithUserStyles)(postContent, settings, otherUserTweetAnalysis.lastTweetContent, otherUserTweetAnalysis.lastTweetUsername || 'unknown');
                        if (commentText) {
                            console.log(`[YapComment] Generated reply to comment: "${commentText}"`);
                            console.log('[YapComment] Posting reply to comment...');
                            // Click reply button on the specific tweet element
                            if (otherUserTweetAnalysis.lastTweetElement) {
                                try {
                                    // Post the reply
                                    const commentResult = await this.commentOps.commentOnFirstTweet(commentText, {
                                        useAntiDetection: true,
                                        behavioralPattern: 'browsing',
                                        mouseIntensity: 'medium'
                                    });
                                    commented = commentResult.success;
                                    console.log(`[YapComment] Reply to comment result: ${commented ? 'success' : 'failed'}`);
                                }
                                catch (replyError) {
                                    console.log('[YapComment] Failed to click reply button on tweet element:', replyError);
                                    // Fallback to main tweet comment
                                    const commentResult = await this.commentOps.commentOnFirstTweet(commentText, {
                                        useAntiDetection: true,
                                        behavioralPattern: 'browsing',
                                        mouseIntensity: 'medium'
                                    });
                                    commented = commentResult.success;
                                    console.log(`[YapComment] Fallback comment result: ${commented ? 'success' : 'failed'}`);
                                }
                            }
                            else {
                                console.log('[YapComment] No tweet element found, falling back to main tweet comment');
                                // Fallback to main tweet comment
                                const commentResult = await this.commentOps.commentOnFirstTweet(commentText, {
                                    useAntiDetection: true,
                                    behavioralPattern: 'browsing',
                                    mouseIntensity: 'medium'
                                });
                                commented = commentResult.success;
                                console.log(`[YapComment] Fallback comment result: ${commented ? 'success' : 'failed'}`);
                            }
                        }
                        else {
                            console.log('[YapComment] Failed to generate reply to comment text');
                        }
                    }
                    else {
                        console.log('[YapComment] No tweet from other users found - commenting on main tweet');
                        // Generate comment for main tweet
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
        await (0, utils_1.submitCacheToAPI)(this.cacheDir, this.profileId, this.runId, this.runType, this.processedSettings);
        if (this.xClient) {
            await this.xClient.close();
        }
    }
}
exports.CommentByLink = CommentByLink;
//# sourceMappingURL=cbl.js.map