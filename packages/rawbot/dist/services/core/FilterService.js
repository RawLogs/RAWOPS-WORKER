"use strict";
// packages/rawbot/src/core/FilterService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterService = void 0;
class FilterService {
    /**
     * Applies the filtering rules of a project to an array of tweets.
     */
    async applyFilters(tweets, project) {
        const filterRules = this.getFilterOptionsFromProject(project);
        console.log(`[FilterService] Starting filter with ${tweets.length} tweets for project ${project.id}`);
        const filteredTweets = tweets.filter(tweet => {
            const reasons = [];
            // Time limit check
            if (!this.isWithinTimeLimit(tweet, filterRules.timeLimitHours)) {
                reasons.push(`time limit (${filterRules.timeLimitHours}h)`);
            }
            // Verified account check
            if (filterRules.requireVerified && !tweet.isVerified) {
                reasons.push('not verified');
            }
            // Media requirement check
            if (filterRules.requireMedia && !tweet.hasMedia) {
                reasons.push('no media');
            }
            // Engagement thresholds
            if (tweet.metrics.likes < (filterRules.minLikes ?? 0)) {
                reasons.push(`likes too low (${tweet.metrics.likes} < ${filterRules.minLikes ?? 0})`);
            }
            if (tweet.metrics.views < (filterRules.minViews ?? 0)) {
                reasons.push(`views too low (${tweet.metrics.views} < ${filterRules.minViews ?? 0})`);
            }
            // Spam detection
            if (filterRules.excludeSpam && this.isSpamTweet(tweet, filterRules)) {
                reasons.push('spam detected');
            }
            // Additional filters
            if (filterRules.excludeRetweets && tweet.text.startsWith('RT @')) {
                reasons.push('retweet');
            }
            if (filterRules.excludeReplies && tweet.text.startsWith('@')) {
                reasons.push('reply');
            }
            if (reasons.length > 0) {
                console.log(`[FilterService] Filtered out tweet: @${tweet.username} - ${reasons.join(', ')}`);
                return false;
            }
            return true;
        });
        console.log(`[FilterService] Filter completed: ${filteredTweets.length}/${tweets.length} tweets passed.`);
        return filteredTweets;
    }
    /**
     * Extracts and merges filter options from a project's rules.
     */
    getFilterOptionsFromProject(project) {
        const defaultOptions = {
            timeLimitHours: 72,
            requireVerified: false,
            requireMedia: false,
            minLikes: 0,
            minViews: 0,
            excludeSpam: true,
            maxMentions: 8,
            maxHashtags: 5,
            excludeRetweets: true,
            excludeReplies: true,
        };
        return defaultOptions;
    }
    /**
     * Check if tweet is within time limit.
     */
    isWithinTimeLimit(tweet, timeLimitHours = 72) {
        const ageHours = (new Date().getTime() - new Date(tweet.postedAt).getTime()) / (1000 * 60 * 60);
        return ageHours <= timeLimitHours;
    }
    /**
     * Detect spam tweets based on mentions, hashtags, and keywords.
     */
    isSpamTweet(tweet, options) {
        const { maxMentions = 8, maxHashtags = 5 } = options;
        const mentionCount = (tweet.text.match(/@\w+/g) || []).length;
        const hashtagCount = (tweet.text.match(/#\w+/g) || []).length;
        if (mentionCount > maxMentions || hashtagCount > maxHashtags) {
            return true;
        }
        const spamKeywords = ['airdrop', 'giveaway', 'free', 'win', 'contest', 'prize'];
        const hasSpamKeywords = spamKeywords.some(keyword => tweet.text.toLowerCase().includes(keyword));
        if (hasSpamKeywords) {
            return true;
        }
        // Check for repetitive patterns
        const repetitivePatterns = [
            /(.)\1{4,}/g, // Same character repeated 5+ times
            /(..)\1{3,}/g, // Same 2-char pattern repeated 4+ times
        ];
        if (repetitivePatterns.some(pattern => pattern.test(tweet.text))) {
            return true;
        }
        return false;
    }
}
exports.FilterService = FilterService;
