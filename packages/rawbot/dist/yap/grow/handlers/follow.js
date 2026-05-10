"use strict";
// packages/rawbot/src/yap/grow/handlers/follow.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFollowUser = handleFollowUser;
const rules_1 = require("./rules");
/**
 * Handle follow user action - uses ProfileOps from rawops
 * Now includes interaction rules evaluation if settings are provided
 */
async function handleFollowUser(params, handlerContext, settings) {
    const { drivers, context } = handlerContext;
    if (!drivers)
        return;
    // Check following status using ProfileOps
    context.following_status = await drivers.profile.isAlreadyFollowing();
    if (context.following_status) {
        console.log(`[YapGrow] Already following, skipping follow action`);
        return;
    }
    if (context.grow_skip_follow_after_by_time === true) {
        console.log(`[YapGrow] Follow skipped: scroll_and_detect_by_time had no eligible tweet in the time window (or no interaction ran); follow is tied to timeline interaction.`);
        return;
    }
    const onlyVerified = settings?.onlyVerifiedAccounts === true;
    const minFollowers = Math.max(0, Number(settings?.minFollowersToInteract) || 0);
    if (onlyVerified) {
        const verified = context.current_profile?.is_verified === true;
        if (!verified) {
            console.log(`[YapGrow] Follow skipped: profile is not verified (blue check). is_verified=${String(context.current_profile?.is_verified)}`);
            return;
        }
    }
    if (minFollowers > 0) {
        const fc = context.current_profile?.followers_count ?? 0;
        if (!context.current_profile || fc < minFollowers) {
            console.log(`[YapGrow] Follow skipped: need at least ${minFollowers} followers (profile followers=${fc}, hasProfile=${!!context.current_profile})`);
            return;
        }
    }
    // Evaluate interaction rules if settings are provided
    if (settings?.interactionRules?.settings?.enabled) {
        const rules = (0, rules_1.getInteractionRules)(settings);
        if (rules.length > 0) {
            const { followingCount, followersCount } = await (0, rules_1.getProfileDataForRules)(context, drivers);
            const followDecision = (0, rules_1.shouldFollow)(rules, followingCount, followersCount);
            console.log(`[YapGrow] Follow decision: ${followDecision.shouldFollow ? 'ENABLED' : 'DISABLED'} - ${followDecision.reason}`);
            if (!followDecision.shouldFollow) {
                console.log(`[YapGrow] Follow skipped by rules: ${followDecision.reason}`);
                context.following_status = false;
                return;
            }
        }
    }
    // Follow using ProfileOps
    const result = await drivers.profile.followProfile({
        useAntiDetection: true,
        behavioralPattern: 'browsing',
        mouseIntensity: 'medium'
    });
    // Update context with result
    context.following_status = result.success;
    if (result.success) {
        console.log(`[YapGrow] Follow successful`);
    }
    else {
        console.log(`[YapGrow] Follow failed: ${result.error || 'Unknown error'}`);
    }
}
