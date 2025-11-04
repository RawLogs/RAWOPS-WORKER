"use strict";
// packages/rawbot/src/yap/grow/handlers/extraction.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleExtractProfile = handleExtractProfile;
exports.handleWaitUntilExtractDone = handleWaitUntilExtractDone;
const rawops_1 = require("@rawops/rawops");
/**
 * Handle extract profile action - uses ProfileOps.extractProfileData from rawops
 * Extracts profile data including followers/following counts for interaction rules evaluation
 * Ensures data is available for ratio calculation
 */
async function handleExtractProfile(params, handlerContext) {
    const { drivers, context } = handlerContext;
    if (!drivers || !context.current_link) {
        console.warn('[YapGrow] extract_profile skipped: drivers not initialized or current_link missing');
        return;
    }
    const profileUrl = context.current_link;
    const maxTweets = params.max_tweets || params.maxTweets || 5;
    console.log(`[YapGrow] Extracting profile data from: ${profileUrl}`);
    const profileData = await drivers.profile.extractProfileData(profileUrl, {
        maxTweets
    });
    if (profileData) {
        context.current_profile = profileData;
        // Validate and log follow data for interaction rules
        const followersCount = profileData.followers_count || 0;
        const followingCount = profileData.following_count || 0;
        // Calculate follow ratio for interaction rules
        const ratioResult = (0, rawops_1.calculateFollowRatio)(followersCount, followingCount);
        const ratioPercent = followersCount === 0
            ? Infinity
            : (followingCount / followersCount) * 100;
        console.log(`[YapGrow] ✅ Profile extracted: @${profileData.username || 'unknown'}`);
        console.log(`[YapGrow] Followers: ${followersCount.toLocaleString()}, Following: ${followingCount.toLocaleString()}`);
        console.log(`[YapGrow] Follow ratio: ${ratioPercent.toFixed(2)}% (ratio: ${ratioResult.ratio.toFixed(2)})`);
        // Validate data completeness for interaction rules
        if (followersCount === 0 && followingCount === 0) {
            console.warn(`[YapGrow] ⚠️ Warning: Could not extract follower/following counts. Interaction rules may not work correctly.`);
            console.warn(`[YapGrow] Consider adding a wait step or retry mechanism if this profile page loads slowly.`);
        }
        else if (followersCount === 0) {
            console.warn(`[YapGrow] ⚠️ Warning: Followers count is 0. Ratio will be Infinity.`);
        }
        else {
            console.log(`[YapGrow] ✅ Profile data ready for interaction rules evaluation`);
        }
        // Log additional profile info
        if (profileData.tweets && profileData.tweets.length > 0) {
            console.log(`[YapGrow] Extracted ${profileData.tweets.length} tweet(s) from profile`);
        }
    }
    else {
        console.error('[YapGrow] ❌ Failed to extract profile data');
        context.current_profile = null;
        throw new Error(`Failed to extract profile data from ${profileUrl}`);
    }
}
/**
 * Handle wait until extract done action - uses WaitOps.waitUntilCondition from rawops
 */
async function handleWaitUntilExtractDone(params, handlerContext) {
    const { drivers, context } = handlerContext;
    const interval = params.interval || params.check_interval || 500;
    const maxWait = params.max_wait || params.maxWait || 10000; // 10 seconds max
    await drivers.wait.waitUntilCondition(() => Promise.resolve(!!context.current_profile), { interval, maxWait });
}
