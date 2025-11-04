"use strict";
// packages/rawbot/src/yap/grow/handlers/interaction.ts
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
exports.handleScrollAndDetectTweets = handleScrollAndDetectTweets;
exports.handleScrollAndDetectTweetsByTime = handleScrollAndDetectTweetsByTime;
const utils_1 = require("../../comment/utils");
/**
 * Handle scroll and detect tweets action
 */
async function handleScrollAndDetectTweets(params, settings, handlerContext) {
    const { drivers, context } = handlerContext;
    if (!drivers)
        return;
    const maxScrollSteps = params.max_scrolls || params.maxScrolls || 5;
    const detectLimit = params.detect_limit || params.detectLimit || 10;
    // Evaluate interaction rules if settings are provided
    let enableLike = params.enable_like !== false && params.enableLike !== false; // Default true
    let enableComment = params.enable_comment !== false && params.enableComment !== false; // Default true
    let ruleReason = undefined;
    if (settings?.interactionRules?.settings?.enabled) {
        const { evaluateInteractionRules } = await Promise.resolve().then(() => __importStar(require('./rules')));
        const rulesEvaluation = await evaluateInteractionRules(settings, context, drivers);
        // Apply rules to like and comment (override params if rules say disabled)
        if (!rulesEvaluation.like.enabled) {
            enableLike = false;
            console.log(`[YapGrow] Like disabled by rules: ${rulesEvaluation.like.reason}`);
            ruleReason = ruleReason ? `${ruleReason}; Like: ${rulesEvaluation.like.reason}` : `Like: ${rulesEvaluation.like.reason}`;
        }
        if (!rulesEvaluation.comment.enabled) {
            enableComment = false;
            console.log(`[YapGrow] Comment disabled by rules: ${rulesEvaluation.comment.reason}`);
            ruleReason = ruleReason ? `${ruleReason}; Comment: ${rulesEvaluation.comment.reason}` : `Comment: ${rulesEvaluation.comment.reason}`;
        }
    }
    // Extract status ID using GrowOps
    const statusId = drivers.grow.extractStatusId({ params, context });
    // Scroll and detect tweets using ScrollOps
    const result = await drivers.scroll.scrollAndDetectTweets(statusId, {
        maxScrollSteps,
        detectLimit,
        scrollHeight: 800 + Math.random() * 200,
        scrollDelay: 3000
    });
    context.detected_tweets = result.detectedTweets;
    // Process interaction if tweet found and actions enabled
    if (result.tweet && (enableLike || enableComment)) {
        context.detected_target_tweet = result.tweet;
        // Scroll to tweet and extract content using GrowOps
        await drivers.grow.scrollToTweet(result.tweet.cellInnerDiv);
        // Generate AI comment if enabled (rawbot-specific business logic)
        let commentText = undefined;
        if (enableComment && settings?.aiCommentEnabled &&
            settings.databasePrompt?.finalPrompt && settings.databasePrompt?.requirePrompt) {
            try {
                const postContent = await drivers.grow.extractPostContent(result.tweet.element);
                if (postContent?.trim()) {
                    const commentSettings = {
                        aiCommentEnabled: settings.aiCommentEnabled,
                        aiCommentPrompt: settings.aiCommentPrompt || '',
                        geminiApiKey: settings.geminiApiKey || '',
                        delayRange: { min: 0, max: 0 },
                        links: [],
                        aiModel: settings.aiModel,
                        aiLanguage: settings.aiLanguage,
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
                    const generated = await (0, utils_1.generateCommentWithUserStyles)(postContent.trim(), commentSettings);
                    if (generated) {
                        commentText = generated;
                        console.log(`[YapGrow] Generated AI comment: "${commentText.substring(0, 100)}..."`);
                    }
                }
            }
            catch (error) {
                console.error('[YapGrow] Error generating AI comment:', error);
            }
        }
        // Process interaction using CommentOps from rawops
        const interactionResult = await drivers.comment.processTweetInteraction({
            element: result.tweet.element,
            link: result.tweet.link,
            statusId: result.tweet.statusId,
            cellInnerDiv: result.tweet.cellInnerDiv
        }, {
            enableLike,
            enableComment,
            commentText,
            useAntiDetection: true,
            behavioralPattern: 'browsing',
            mouseIntensity: 'medium'
        });
        context.interaction_result = interactionResult;
        // Add rule reason if interactions were skipped by rules
        if (ruleReason) {
            context.interaction_result.ruleReason = ruleReason;
        }
    }
    else {
        // No tweet found or interactions disabled
        context.detected_target_tweet = null;
        // If interactions were enabled but no tweet found, set result to indicate no interaction attempted
        if (enableLike || enableComment) {
            console.log(`[YapGrow] No tweet detected or interactions disabled, setting interaction_result to { liked: false, commented: false }`);
            context.interaction_result = { liked: false, commented: false };
        }
        else {
            // If disabled by rules, mark as success with reason
            if (ruleReason) {
                context.interaction_result = { liked: false, commented: false, ruleReason };
            }
            else {
                context.interaction_result = undefined;
            }
        }
    }
}
/**
 * Handle scroll and detect tweets by time filter
 * Similar to handleScrollAndDetectTweets but filters tweets by time and selects the newest tweet
 */
async function handleScrollAndDetectTweetsByTime(params, settings, handlerContext) {
    const { drivers, context } = handlerContext;
    if (!drivers)
        return;
    const maxScrollSteps = params.max_scrolls || params.maxScrolls || 5;
    const detectLimit = params.detect_limit || params.detectLimit || 10;
    // Get time filter from params or settings (default: 24 hours)
    const timeFilterHours = params.time_filter_hours || params.timeFilterHours || settings?.tweetTimeFilterHours || 24;
    // Evaluate interaction rules if settings are provided
    let enableLike = params.enable_like !== false && params.enableLike !== false; // Default true
    let enableComment = params.enable_comment !== false && params.enableComment !== false; // Default true
    let ruleReason = undefined;
    if (settings?.interactionRules?.settings?.enabled) {
        const { evaluateInteractionRules } = await Promise.resolve().then(() => __importStar(require('./rules')));
        const rulesEvaluation = await evaluateInteractionRules(settings, context, drivers);
        // Apply rules to like and comment (override params if rules say disabled)
        if (!rulesEvaluation.like.enabled) {
            enableLike = false;
            console.log(`[YapGrow] Like disabled by rules: ${rulesEvaluation.like.reason}`);
            ruleReason = ruleReason ? `${ruleReason}; Like: ${rulesEvaluation.like.reason}` : `Like: ${rulesEvaluation.like.reason}`;
        }
        if (!rulesEvaluation.comment.enabled) {
            enableComment = false;
            console.log(`[YapGrow] Comment disabled by rules: ${rulesEvaluation.comment.reason}`);
            ruleReason = ruleReason ? `${ruleReason}; Comment: ${rulesEvaluation.comment.reason}` : `Comment: ${rulesEvaluation.comment.reason}`;
        }
    }
    // Extract status ID using GrowOps
    const statusId = drivers.grow.extractStatusId({ params, context });
    // Scroll and detect tweets using ScrollOps
    const result = await drivers.scroll.scrollAndDetectTweets(statusId, {
        maxScrollSteps,
        detectLimit,
        scrollHeight: 800 + Math.random() * 200,
        scrollDelay: 3000
    });
    context.detected_tweets = result.detectedTweets;
    // Filter tweets by time using GrowOps
    const filteredTweets = await drivers.grow.filterTweetsByTime(result.detectedTweets, timeFilterHours);
    if (filteredTweets.length === 0) {
        context.detected_target_tweet = null;
        // If interactions were enabled but no tweet found, set result to indicate no interaction attempted
        if (enableLike || enableComment) {
            console.log(`[YapGrow] No tweets found within ${timeFilterHours}h time filter, setting interaction_result to { liked: false, commented: false }`);
            context.interaction_result = { liked: false, commented: false };
        }
        else {
            // If disabled by rules, mark as success with reason
            if (ruleReason) {
                context.interaction_result = { liked: false, commented: false, ruleReason };
            }
            else {
                context.interaction_result = undefined;
            }
        }
        return;
    }
    // Sort filtered tweets by timestamp (newest first) and select the newest tweet
    const sortedTweets = [...filteredTweets].sort((a, b) => {
        // Tweets with timestamp come first, sorted by newest
        if (a.timestamp && b.timestamp) {
            return b.timestamp.getTime() - a.timestamp.getTime(); // Newest first
        }
        if (a.timestamp && !b.timestamp)
            return -1; // a has timestamp, b doesn't
        if (!a.timestamp && b.timestamp)
            return 1; // b has timestamp, a doesn't
        return 0; // Both have no timestamp, keep original order
    });
    // Select the newest tweet (first in sorted array)
    const targetTweet = sortedTweets[0];
    // Process interaction if tweet found and actions enabled
    if (targetTweet && (enableLike || enableComment)) {
        context.detected_target_tweet = {
            element: targetTweet.element,
            link: targetTweet.link,
            statusId: targetTweet.statusId,
            cellInnerDiv: targetTweet.cellInnerDiv
        };
        // Scroll to tweet and extract content using GrowOps
        await drivers.grow.scrollToTweet(targetTweet.cellInnerDiv);
        // Generate AI comment if enabled (rawbot-specific business logic)
        let commentText = undefined;
        if (enableComment && settings?.aiCommentEnabled &&
            settings.databasePrompt?.finalPrompt && settings.databasePrompt?.requirePrompt) {
            try {
                const postContent = await drivers.grow.extractPostContent(targetTweet.element);
                if (postContent?.trim()) {
                    const commentSettings = {
                        aiCommentEnabled: settings.aiCommentEnabled,
                        aiCommentPrompt: settings.aiCommentPrompt || '',
                        geminiApiKey: settings.geminiApiKey || '',
                        delayRange: { min: 0, max: 0 },
                        links: [],
                        aiModel: settings.aiModel,
                        aiLanguage: settings.aiLanguage,
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
                    const generated = await (0, utils_1.generateCommentWithUserStyles)(postContent.trim(), commentSettings);
                    if (generated) {
                        commentText = generated;
                        console.log(`[YapGrow] Generated AI comment: "${commentText.substring(0, 100)}..."`);
                    }
                }
            }
            catch (error) {
                console.error('[YapGrow] Error generating AI comment:', error);
            }
        }
        // Process interaction using CommentOps from rawops
        const interactionResult = await drivers.comment.processTweetInteraction({
            element: targetTweet.element,
            link: targetTweet.link,
            statusId: targetTweet.statusId,
            cellInnerDiv: targetTweet.cellInnerDiv
        }, {
            enableLike,
            enableComment,
            commentText,
            useAntiDetection: true,
            behavioralPattern: 'browsing',
            mouseIntensity: 'medium'
        });
        context.interaction_result = interactionResult;
        // Add rule reason if interactions were skipped by rules
        if (ruleReason) {
            context.interaction_result.ruleReason = ruleReason;
        }
    }
    else {
        // No tweet found or interactions disabled
        context.detected_target_tweet = null;
        // If interactions were enabled but no tweet found, set result to indicate no interaction attempted
        if (enableLike || enableComment) {
            console.log(`[YapGrow] No tweet selected or interactions disabled, setting interaction_result to { liked: false, commented: false }`);
            context.interaction_result = { liked: false, commented: false };
        }
        else {
            // If disabled by rules, mark as success with reason
            if (ruleReason) {
                context.interaction_result = { liked: false, commented: false, ruleReason };
            }
            else {
                context.interaction_result = undefined;
            }
        }
    }
}
