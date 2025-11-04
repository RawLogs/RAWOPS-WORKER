"use strict";
// packages/rawbot/src/yap/grow/handlers/discovery.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDiscoverFollowers = handleDiscoverFollowers;
const GrowSettingsService_1 = __importDefault(require("../../../services/core/GrowSettingsService"));
const utils_1 = require("../../comment/utils");
const rules_1 = require("./rules");
/**
 * Handle follower discovery step
 * Uses interaction rules from grow-settings
 */
async function handleDiscoverFollowers(params, settings, handlerContext) {
    const { drivers, context, cacheDir } = handlerContext;
    if (!drivers || !settings?.profileId) {
        console.log('[YapGrow] Discovery skipped: drivers not initialized or profileId missing');
        return;
    }
    try {
        console.log('[YapGrow] Starting follower discovery process...');
        // Step 1: Get grow settings from API to get links and exclude usernames
        const growSettingsResult = await GrowSettingsService_1.default.getGrowSettings(settings.profileId);
        if (!growSettingsResult.success || !growSettingsResult.settings) {
            console.log('[YapGrow] Could not fetch grow settings, skipping discovery');
            return;
        }
        const growSettings = growSettingsResult.settings;
        // Step 2: Use remainingLinksCount from context (calculated at start of link, not during steps)
        // This ensures rule threshold is only evaluated when starting a new link, not during steps
        const remainingLinksCount = handlerContext.remainingLinksCount;
        if (remainingLinksCount === undefined) {
            console.log('[YapGrow] Discovery skipped: remainingLinksCount not available (should be set at link start)');
            return;
        }
        const processedLinks = handlerContext.processedLinks || [];
        const allLinks = growSettings.links || [];
        console.log(`[YapGrow] Link status: ${allLinks.length} total, ${processedLinks.length} processed in current run, ${remainingLinksCount} remaining (fixed at link start)`);
        // Step 3: Get interaction rules from grow-settings
        let rules = [];
        // Use interaction rules from grow-settings (required)
        if (settings.interactionRules && settings.interactionRules.rules && Array.isArray(settings.interactionRules.rules)) {
            rules = settings.interactionRules.rules;
            console.log(`[YapGrow] Using interaction rules from grow-settings: ${rules.length} rules`);
        }
        else {
            console.log('[YapGrow] No interaction rules found in grow-settings, skipping discovery');
            return;
        }
        // Step 4: Get current profile data to evaluate rules
        let followingCount = 0;
        let followersCount = 0;
        if (context.current_profile) {
            followingCount = context.current_profile.following_count || 0;
            followersCount = context.current_profile.followers_count || 0;
        }
        else {
            // Try to extract profile data from current page
            try {
                const currentUrl = await drivers.getDriver().getCurrentUrl();
                const profileData = await drivers.profile.extractProfileData(currentUrl);
                if (profileData) {
                    followingCount = profileData.following_count || 0;
                    followersCount = profileData.followers_count || 0;
                    context.current_profile = profileData;
                }
            }
            catch (error) {
                console.log('[YapGrow] Could not extract profile data for rule evaluation:', error);
            }
        }
        // Step 5: Evaluate if discovery should happen based on rules and linkThreshold
        // Discovery only runs when remaining links <= threshold (e.g., 3 links cuối nếu threshold = 3)
        const discoveryDecision = (0, rules_1.shouldDiscover)(remainingLinksCount, rules, followingCount, followersCount);
        console.log(`[YapGrow] Discovery decision: ${discoveryDecision.shouldDiscover ? 'ENABLED' : 'DISABLED'}`);
        console.log(`[YapGrow] Reason: ${discoveryDecision.reason}`);
        if (discoveryDecision.linkThreshold !== undefined) {
            console.log(`[YapGrow] Link threshold: ${discoveryDecision.linkThreshold}, Remaining links: ${remainingLinksCount}`);
        }
        if (!discoveryDecision.shouldDiscover) {
            console.log(`[YapGrow] Discovery skipped: ${discoveryDecision.reason}`);
            if (discoveryDecision.linkThreshold !== undefined) {
                console.log(`[YapGrow] Remaining links (${remainingLinksCount}) must be <= threshold (${discoveryDecision.linkThreshold}) to enable discovery`);
            }
            return;
        }
        // Log mandatory vs optional discovery
        if (discoveryDecision.mandatory) {
            console.log(`[YapGrow] ⚠️  Mandatory discovery: Remaining links (${remainingLinksCount}) <= threshold (${discoveryDecision.linkThreshold}). Discovery will proceed.`);
        }
        else {
            console.log(`[YapGrow] ℹ️  Optional discovery: Remaining links (${remainingLinksCount}) <= threshold (${discoveryDecision.linkThreshold}). Discovery will proceed.`);
        }
        // Step 6: Get profile URL for discovery (from current_link or extract from page)
        let profileUrlForDiscovery = context.current_link;
        if (!profileUrlForDiscovery) {
            try {
                profileUrlForDiscovery = await drivers.getDriver().getCurrentUrl();
            }
            catch (error) {
                console.log('[YapGrow] Could not get current URL for discovery');
                return;
            }
        }
        // Step 7: Extract usernames to exclude (from grow settings or current profile)
        const excludeUsernames = [];
        // Extract current username from profile URL if available
        if (profileUrlForDiscovery) {
            const usernameMatch = profileUrlForDiscovery.match(/(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([^\/\?]+)/);
            if (usernameMatch) {
                excludeUsernames.push(usernameMatch[1]);
            }
        }
        // Step 8: Perform discovery
        // checkFollowStatus and hoverToExtractInfo are always enabled by default
        const discoveryOptions = {
            maxFollowers: params.max_followers || params.maxFollowers || 20,
            smoothSpeed: params.smooth_speed || params.smoothSpeed || 50,
            excludeUsernames,
            checkFollowStatus: true, // Always enabled - required for discovery
            hoverToExtractInfo: true // Always enabled - required for extraction
        };
        console.log(`[YapGrow] Starting discovery for profile: ${profileUrlForDiscovery}`);
        const discoveryResult = await drivers.followerDiscovery.discoverVerifiedFollowers(profileUrlForDiscovery, discoveryOptions);
        if (!discoveryResult.success || discoveryResult.followers.length === 0) {
            console.log('[YapGrow] Discovery completed but no followers found or discovery failed');
            return;
        }
        console.log(`[YapGrow] Discovery found ${discoveryResult.followers.length} followers`);
        // Step 9: Evaluate discovered followers and add to links via API
        // This would typically be done by calling an API endpoint to add discovered profiles
        // For now, we'll log them and they can be added via the grow-settings API
        const discoveredProfiles = [];
        for (const follower of discoveryResult.followers) {
            // Evaluate if follower should be added based on follow ratio and rules
            if (follower.followInfo) {
                const applicableRule = (0, rules_1.evaluateRule)(follower.followInfo.following, follower.followInfo.followers, rules);
                if (applicableRule) {
                    // Check if actions allow adding this profile
                    // For now, we'll add all discovered profiles that passed the initial filters
                    discoveredProfiles.push(follower.profileUrl);
                    console.log(`[YapGrow] ✅ Discovered profile to add: ${follower.profileUrl} (${follower.followInfo.followers} followers, ${follower.followInfo.following} following)`);
                }
            }
            else {
                // If no follow info, add anyway (user can filter later)
                discoveredProfiles.push(follower.profileUrl);
                console.log(`[YapGrow] ✅ Discovered profile to add (no follow info): ${follower.profileUrl}`);
            }
        }
        // Step 10: Filter out processed links before adding to API
        const processedLinksForFilter = handlerContext.processedLinks || [];
        const filteredDiscoveredProfiles = discoveredProfiles.filter(profileUrl => !processedLinksForFilter.includes(profileUrl));
        console.log(`[YapGrow] Filtered discovered profiles: ${discoveredProfiles.length} total, ${filteredDiscoveredProfiles.length} new (${processedLinksForFilter.length} already processed)`);
        // Step 11: Update grow settings with new discovered profiles via API (excluding processed links)
        if (filteredDiscoveredProfiles.length > 0) {
            console.log(`[YapGrow] 📝 Discovered ${filteredDiscoveredProfiles.length} new profiles to add to grow settings:`);
            filteredDiscoveredProfiles.forEach(url => console.log(`  - ${url}`));
            try {
                // Add discovered profiles to grow settings via API
                // This will: remove processed links, keep unprocessed links, add discovered links
                const addResult = await GrowSettingsService_1.default.addDiscoveredLinks(settings.profileId, filteredDiscoveredProfiles, growSettings, processedLinksForFilter, // Processed links to remove
                cacheDir // Cache directory for filtering processed links
                );
                if (addResult.success) {
                    console.log(`[YapGrow] ✅ Successfully added ${filteredDiscoveredProfiles.length} discovered profiles to grow settings`);
                    console.log(`[YapGrow] Total links in grow settings: ${addResult.settings?.links?.length || 0}`);
                    // Step 12: Reload links from API after discovery
                    console.log(`[YapGrow] Reloading links from grow-settings API...`);
                    const reloadResult = await GrowSettingsService_1.default.getGrowSettings(settings.profileId);
                    if (reloadResult.success && reloadResult.settings) {
                        const reloadedLinks = reloadResult.settings.links || [];
                        console.log(`[YapGrow] ✅ Reloaded ${reloadedLinks.length} links from grow-settings API`);
                        // Update settings with reloaded links (will be used in next iteration)
                        settings.links = reloadedLinks;
                        // Recalculate remaining links count after discovery
                        // Filter out processed links from reloaded links
                        const processedLinksForRecalc = handlerContext.processedLinks || [];
                        const unprocessedLinksAfterDiscovery = reloadedLinks.filter(link => !processedLinksForRecalc.includes(link));
                        // If cacheDir is available, filter processed links from cache
                        let finalUnprocessedLinks = unprocessedLinksAfterDiscovery;
                        if (cacheDir) {
                            try {
                                finalUnprocessedLinks = await (0, utils_1.filterProcessedLinks)(cacheDir, unprocessedLinksAfterDiscovery);
                            }
                            catch (error) {
                                console.warn(`[YapGrow] Could not filter processed links from cache, using API-filtered links`);
                            }
                        }
                        const newRemainingLinksCount = finalUnprocessedLinks.length;
                        console.log(`[YapGrow] Updated remaining links count: ${newRemainingLinksCount} (after discovery, ${reloadedLinks.length} total)`);
                        // Update remainingLinksCount in context for next link processing
                        if (handlerContext.remainingLinksCount !== undefined) {
                            handlerContext.remainingLinksCount = newRemainingLinksCount;
                        }
                    }
                    else {
                        console.warn(`[YapGrow] ⚠️ Could not reload links from API, using cached settings`);
                    }
                }
                else {
                    console.error(`[YapGrow] ❌ Failed to add discovered profiles to grow settings: ${addResult.error}`);
                    console.log('[YapGrow] ⚠️  Discovered profiles were logged but not saved. Please add them manually via grow-settings API.');
                }
            }
            catch (error) {
                console.error('[YapGrow] ❌ Error adding discovered profiles to grow settings:', error);
                console.log('[YapGrow] ⚠️  Discovered profiles were logged but not saved. Please add them manually via grow-settings API.');
            }
        }
        else {
            console.log(`[YapGrow] No new profiles to add (all discovered profiles were already processed)`);
        }
    }
    catch (error) {
        console.error('[YapGrow] Error in follower discovery:', error);
    }
}
