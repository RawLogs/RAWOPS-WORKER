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
const rawops_1 = require("@rawops/rawops");
const commentAi_1 = require("../utils/commentAi");
/** Pick newest tweet by HTML time tag (ISO string from ScrollOps). */
function selectNewestTweetFromDetected(tweets) {
    if (!tweets.length)
        return null;
    const ranked = [...tweets].sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : NaN;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : NaN;
        if (!Number.isNaN(ta) && !Number.isNaN(tb))
            return tb - ta;
        if (!Number.isNaN(ta))
            return -1;
        if (!Number.isNaN(tb))
            return 1;
        return 0;
    });
    return ranked[0];
}
/**
 * Status ID for ScrollOps: only anchor to a tweet when explicitly requested.
 * scroll_and_detect_by_time defaults to null — collect timeline then pick newest in time window (not by URL ID).
 */
function resolveScrollTargetStatusIdForGrow(params, context, drivers) {
    const explicit = params.target_status_id ?? params.targetStatusId ?? null;
    if (explicit)
        return explicit;
    const useLinkStatus = params.use_status_from_link === true ||
        params.match_url_status === true;
    if (useLinkStatus && drivers) {
        return drivers.grow.extractStatusId({ params, context });
    }
    return null;
}
/**
 * Handle scroll and detect tweets action
 */
async function handleScrollAndDetectTweets(params, settings, handlerContext) {
    const { drivers, context } = handlerContext;
    if (!drivers)
        return;
    const scrollTimelineTopFirst = params.scroll_timeline_top !== false && params.scrollTimelineTop !== false;
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
    if (scrollTimelineTopFirst) {
        await drivers.grow.scrollPrimaryTimelineToTop();
        await new Promise((r) => setTimeout(r, 500));
    }
    const statusId = resolveScrollTargetStatusIdForGrow(params, context, drivers);
    const result = await drivers.scroll.scrollAndDetectTweets(statusId, {
        maxScrollSteps,
        detectLimit,
        scrollHeight: 800 + Math.random() * 200,
        scrollDelay: 3000
    });
    context.detected_tweets = result.detectedTweets;
    // Without a target status ID, ScrollOps does not set result.tweet — choose newest detected by time
    const tweet = result.tweet ??
        (!statusId && result.detectedTweets.length > 0
            ? selectNewestTweetFromDetected(result.detectedTweets)
            : null);
    // Process interaction if tweet found and actions enabled
    if (tweet && (enableLike || enableComment)) {
        const workingTweet = await drivers.grow.ensureFreshTweetRefsForInteraction(tweet);
        context.detected_target_tweet = workingTweet;
        // Generate AI comment if enabled (rawbot-specific business logic)
        let commentText = undefined;
        if (enableComment && settings?.aiCommentEnabled) {
            try {
                const postContent = await drivers.grow.extractPostContentByMeta({
                    link: workingTweet.link,
                    statusId: workingTweet.statusId
                });
                if (postContent?.trim()) {
                    const generated = await (0, commentAi_1.generateGrowAiComment)(postContent.trim(), settings);
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
            element: workingTweet.element,
            link: workingTweet.link,
            statusId: workingTweet.statusId,
            cellInnerDiv: workingTweet.cellInnerDiv
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
    const scrollTimelineTopFirst = params.scroll_timeline_top !== false && params.scrollTimelineTop !== false;
    const maxScrollSteps = params.max_scrolls || params.maxScrolls || 14;
    const detectLimit = params.detect_limit || params.detectLimit || 16;
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
    const statusId = resolveScrollTargetStatusIdForGrow(params, context, drivers);
    if (!statusId) {
        console.log(`[YapGrow] scroll_and_detect_by_time: scrolling full timeline (no status-ID anchor); then newest tweet within ${timeFilterHours}h`);
    }
    if (scrollTimelineTopFirst) {
        await drivers.grow.scrollPrimaryTimelineToTop();
        await new Promise((r) => setTimeout(r, 500));
    }
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
    // Newest first: real time from <time>, else snowflake id (monotonic ~time on X)
    const sortedTweets = [...filteredTweets].sort((a, b) => {
        if (a.timestamp && b.timestamp) {
            const dt = b.timestamp.getTime() - a.timestamp.getTime();
            if (dt !== 0)
                return dt;
        }
        else if (a.timestamp && !b.timestamp)
            return -1;
        else if (!a.timestamp && b.timestamp)
            return 1;
        const sa = a.statusId && /^\d+$/.test(a.statusId) ? BigInt(a.statusId) : BigInt(0);
        const sb = b.statusId && /^\d+$/.test(b.statusId) ? BigInt(b.statusId) : BigInt(0);
        if (sa !== sb)
            return sa > sb ? -1 : 1;
        return 0;
    });
    // Select the newest tweet (first in sorted array)
    const targetTweet = sortedTweets[0];
    if (targetTweet?.timestamp) {
        console.log(`[YapGrow] Selected tweet <time> as UTC+7: ${(0, rawops_1.formatUtcInstantAsUtcPlus7)(targetTweet.timestamp)} (status ${targetTweet.statusId || '?'})`);
    }
    else if (targetTweet?.statusId) {
        const approx = drivers.grow.approximateUtcDateFromStatusSnowflake(targetTweet.statusId);
        if (approx) {
            console.log(`[YapGrow] Selected tweet time (snowflake → UTC+7): ${(0, rawops_1.formatUtcInstantAsUtcPlus7)(approx)} (status ${targetTweet.statusId})`);
        }
    }
    // Process interaction if tweet found and actions enabled
    if (targetTweet && (enableLike || enableComment)) {
        const workingTweet = await drivers.grow.ensureFreshTweetRefsForInteraction(targetTweet);
        context.detected_target_tweet = {
            element: workingTweet.element,
            link: workingTweet.link,
            statusId: workingTweet.statusId,
            cellInnerDiv: workingTweet.cellInnerDiv
        };
        // Generate AI comment if enabled (rawbot-specific business logic)
        let commentText = undefined;
        if (enableComment && settings?.aiCommentEnabled) {
            try {
                const postContent = await drivers.grow.extractPostContentByMeta({
                    link: workingTweet.link,
                    statusId: workingTweet.statusId
                });
                if (postContent?.trim()) {
                    const generated = await (0, commentAi_1.generateGrowAiComment)(postContent.trim(), settings);
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
            element: workingTweet.element,
            link: workingTweet.link,
            statusId: workingTweet.statusId,
            cellInnerDiv: workingTweet.cellInnerDiv
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
