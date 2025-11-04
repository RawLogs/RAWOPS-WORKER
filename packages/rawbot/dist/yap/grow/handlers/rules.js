"use strict";
// packages/rawbot/src/yap/grow/handlers/rules.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInteractionRules = getInteractionRules;
exports.getProfileDataForRules = getProfileDataForRules;
exports.evaluateRule = evaluateRule;
exports.evaluateAllRules = evaluateAllRules;
exports.shouldLike = shouldLike;
exports.shouldComment = shouldComment;
exports.shouldFollow = shouldFollow;
exports.shouldDiscover = shouldDiscover;
exports.evaluateInteractionRules = evaluateInteractionRules;
/**
 * Get interaction rules from grow-settings
 */
function getInteractionRules(settings) {
    if (settings?.interactionRules && settings.interactionRules.rules && Array.isArray(settings.interactionRules.rules)) {
        return settings.interactionRules.rules;
    }
    return [];
}
/**
 * Get profile data for rule evaluation
 * Returns followingCount and followersCount from context or extracts from current page
 * Prioritizes data from context.current_profile (set by extract_profile step)
 */
async function getProfileDataForRules(context, drivers) {
    let followingCount = 0;
    let followersCount = 0;
    // Priority 1: Use data from context.current_profile (set by extract_profile step)
    if (context.current_profile) {
        followingCount = context.current_profile.following_count || 0;
        followersCount = context.current_profile.followers_count || 0;
        // Validate that we have valid data
        if (followingCount > 0 || followersCount > 0) {
            console.log(`[YapGrow] Using profile data from context: ${followersCount.toLocaleString()} followers, ${followingCount.toLocaleString()} following`);
            return { followingCount, followersCount };
        }
        else {
            console.warn(`[YapGrow] ⚠️ Profile data in context exists but has zero counts. Attempting to extract from current page...`);
        }
    }
    // Final validation
    if (followingCount === 0 && followersCount === 0) {
        console.warn(`[YapGrow] ⚠️ Warning: No valid profile data available for interaction rules. Rules may not work correctly.`);
        console.warn(`[YapGrow] Ensure extract_profile step is executed before steps that use interaction rules.`);
    }
    return { followingCount, followersCount };
}
/**
 * Evaluate which rule should apply based on following ratio
 */
function evaluateRule(followingCount, followersCount, rules) {
    if (!rules || rules.length === 0) {
        return null;
    }
    // Calculate follow ratio as percentage
    const followRatio = followersCount === 0 ? Infinity : (followingCount / followersCount) * 100;
    // Sort rules by priority (higher priority first)
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
    for (const rule of sortedRules) {
        const { min, max, operator } = rule.followingRange;
        let matches = false;
        switch (operator) {
            case 'always':
                matches = true;
                break;
            case 'between_percent':
                matches = followRatio >= min && followRatio <= max;
                break;
            case 'less_than_percent':
                matches = followRatio < max;
                break;
            case 'greater_than_percent':
                matches = followRatio > min;
                break;
        }
        if (matches) {
            console.log(`[YapGrow] Rule "${rule.name}" matches (ratio: ${followRatio.toFixed(2)}%)`);
            return rule;
        }
    }
    return null;
}
/**
 * Evaluate all rules that match based on following/followers ratio
 * Returns all matching rules (sorted by priority)
 */
function evaluateAllRules(followingCount, followersCount, rules) {
    if (!rules || rules.length === 0) {
        return [];
    }
    // Sort rules by priority (higher priority first)
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
    const followRatio = followersCount === 0 ? Infinity : (followingCount / followersCount) * 100;
    const matchingRules = [];
    for (const rule of sortedRules) {
        const { min, max, operator } = rule.followingRange;
        let matches = false;
        switch (operator) {
            case 'always':
                matches = true;
                break;
            case 'between_percent':
                matches = followRatio >= min && followRatio <= max;
                break;
            case 'less_than_percent':
                matches = followRatio < max;
                break;
            case 'greater_than_percent':
                matches = followRatio > min;
                break;
        }
        if (matches) {
            console.log(`[YapGrow] Rule "${rule.name}" matches (ratio: ${followRatio.toFixed(2)}%)`);
            matchingRules.push(rule);
        }
    }
    return matchingRules;
}
/**
 * Check if like action should be enabled based on rules
 * Returns true only if the matching rule explicitly enables like (actions.like === true)
 * Returns all matching rules in reason for comprehensive logging
 */
function shouldLike(rules, followingCount, followersCount) {
    if (!rules || rules.length === 0) {
        return {
            shouldLike: true,
            reason: 'No interaction rules - default enabled'
        };
    }
    const applicableRules = evaluateAllRules(followingCount, followersCount, rules);
    if (applicableRules.length === 0) {
        return {
            shouldLike: false,
            reason: 'No matching rule found for current follow ratio'
        };
    }
    // Use the highest priority rule (first in sorted array) for decision
    const applicableRule = applicableRules[0];
    const shouldLike = applicableRule.actions.like === true;
    const followRatio = followersCount === 0 ? Infinity : (followingCount / followersCount) * 100;
    // Build reason with all matching rules
    const ruleNames = applicableRules.map((r) => `"${r.name}"`).join(', ');
    const reason = shouldLike
        ? `Like enabled by rule${applicableRules.length > 1 ? 's' : ''} ${ruleNames} (ratio: ${followRatio.toFixed(2)}%)`
        : `Like disabled by rule${applicableRules.length > 1 ? 's' : ''} ${ruleNames} (ratio: ${followRatio.toFixed(2)}%)`;
    return {
        shouldLike,
        reason,
        ruleName: applicableRule.name
    };
}
/**
 * Check if comment action should be enabled based on rules
 * Returns true only if the matching rule explicitly enables comment (actions.comment === true)
 * Returns all matching rules in reason for comprehensive logging
 */
function shouldComment(rules, followingCount, followersCount) {
    if (!rules || rules.length === 0) {
        return {
            shouldComment: true,
            reason: 'No interaction rules - default enabled'
        };
    }
    const applicableRules = evaluateAllRules(followingCount, followersCount, rules);
    if (applicableRules.length === 0) {
        return {
            shouldComment: false,
            reason: 'No matching rule found for current follow ratio'
        };
    }
    // Use the highest priority rule (first in sorted array) for decision
    const applicableRule = applicableRules[0];
    const shouldComment = applicableRule.actions.comment === true;
    const followRatio = followersCount === 0 ? Infinity : (followingCount / followersCount) * 100;
    // Build reason with all matching rules
    const ruleNames = applicableRules.map((r) => `"${r.name}"`).join(', ');
    const reason = shouldComment
        ? `Comment enabled by rule${applicableRules.length > 1 ? 's' : ''} ${ruleNames} (ratio: ${followRatio.toFixed(2)}%)`
        : `Comment disabled by rule${applicableRules.length > 1 ? 's' : ''} ${ruleNames} (ratio: ${followRatio.toFixed(2)}%)`;
    return {
        shouldComment,
        reason,
        ruleName: applicableRule.name
    };
}
/**
 * Check if follow action should be enabled based on rules
 * Returns true only if the matching rule explicitly enables follow (actions.follow === true)
 * Returns all matching rules in reason for comprehensive logging
 */
function shouldFollow(rules, followingCount, followersCount) {
    if (!rules || rules.length === 0) {
        return {
            shouldFollow: true,
            reason: 'No interaction rules - default enabled'
        };
    }
    const applicableRules = evaluateAllRules(followingCount, followersCount, rules);
    if (applicableRules.length === 0) {
        return {
            shouldFollow: false,
            reason: 'No matching rule found for current follow ratio'
        };
    }
    // Use the highest priority rule (first in sorted array) for decision
    const applicableRule = applicableRules[0];
    const shouldFollow = applicableRule.actions.follow === true;
    const followRatio = followersCount === 0 ? Infinity : (followingCount / followersCount) * 100;
    // Build reason with all matching rules
    const ruleNames = applicableRules.map((r) => `"${r.name}"`).join(', ');
    const reason = shouldFollow
        ? `Follow enabled by rule${applicableRules.length > 1 ? 's' : ''} ${ruleNames} (ratio: ${followRatio.toFixed(2)}%)`
        : `Follow disabled by rule${applicableRules.length > 1 ? 's' : ''} ${ruleNames} (ratio: ${followRatio.toFixed(2)}%)`;
    return {
        shouldFollow,
        reason,
        ruleName: applicableRule.name
    };
}
/**
 * Check if discovery should be enabled based on current links count and rules
 * Discovery logic:
 * - If rule has discovery.enabled = true and links < linkThreshold, discovery is enabled
 * - If discovery.mandatory = true, discovery is ALWAYS enabled when links < threshold (regardless of other rules)
 * - If discovery.mandatory = false, discovery is optional (can be overridden by higher priority rules)
 */
function shouldDiscover(currentLinksCount, rules, followingCount, followersCount) {
    if (!rules || rules.length === 0) {
        return {
            shouldDiscover: false,
            reason: 'No interaction rules found',
            mandatory: false
        };
    }
    // Sort rules by priority (higher priority first)
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
    // First, check for mandatory discovery rules (they take precedence)
    for (const rule of sortedRules) {
        // Check if this rule matches the follow ratio
        const followRatio = followersCount === 0 ? Infinity : (followingCount / followersCount) * 100;
        const { min, max, operator } = rule.followingRange;
        let matches = false;
        switch (operator) {
            case 'always':
                matches = true;
                break;
            case 'between_percent':
                matches = followRatio >= min && followRatio <= max;
                break;
            case 'less_than_percent':
                matches = followRatio < max;
                break;
            case 'greater_than_percent':
                matches = followRatio > min;
                break;
        }
        if (!matches)
            continue;
        // If rule matches, check discovery action
        if (rule.actions.discovery && rule.actions.discovery.enabled) {
            const discovery = rule.actions.discovery;
            // Validate linkThreshold
            if (!discovery.linkThreshold || discovery.linkThreshold <= 0) {
                console.warn(`[YapGrow] Warning: linkThreshold is missing or invalid in rule "${rule.name}". Skipping this rule.`);
                continue;
            }
            // Check if remaining links <= threshold (discovery only runs when remaining links <= threshold)
            if (currentLinksCount <= discovery.linkThreshold) {
                // If mandatory, always enable discovery
                if (discovery.mandatory) {
                    console.log(`[YapGrow] Mandatory discovery enabled by rule "${rule.name}": links (${currentLinksCount}) < threshold (${discovery.linkThreshold})`);
                    return {
                        shouldDiscover: true,
                        reason: `Mandatory discovery: links (${currentLinksCount}) < threshold (${discovery.linkThreshold})`,
                        mandatory: true,
                        linkThreshold: discovery.linkThreshold
                    };
                }
                else {
                    // Optional discovery - use the first matching rule (highest priority)
                    console.log(`[YapGrow] Optional discovery enabled by rule "${rule.name}": links (${currentLinksCount}) < threshold (${discovery.linkThreshold})`);
                    return {
                        shouldDiscover: true,
                        reason: `Optional discovery: links (${currentLinksCount}) < threshold (${discovery.linkThreshold})`,
                        mandatory: false,
                        linkThreshold: discovery.linkThreshold
                    };
                }
            }
            else {
                // Links >= threshold, but if this is a mandatory rule, we should still log it
                if (discovery.mandatory) {
                    console.log(`[YapGrow] Mandatory discovery rule "${rule.name}" matched but links (${currentLinksCount}) >= threshold (${discovery.linkThreshold}). Discovery not needed.`);
                }
            }
        }
    }
    // No matching discovery rule found or links >= threshold for all rules
    return {
        shouldDiscover: false,
        reason: `No discovery rule matched or links (${currentLinksCount}) >= all thresholds`,
        mandatory: false
    };
}
/**
 * Evaluate interaction rules for specific actions
 * Returns enabled status for like, comment, follow, and discovery
 */
async function evaluateInteractionRules(settings, context, drivers, currentLinksCount = 0) {
    const rules = getInteractionRules(settings);
    // Default: all actions enabled if no rules or rules disabled
    if (rules.length === 0 || !settings?.interactionRules?.settings?.enabled) {
        return {
            like: { enabled: true, reason: 'No interaction rules or rules disabled - default enabled' },
            comment: { enabled: true, reason: 'No interaction rules or rules disabled - default enabled' },
            follow: { enabled: true, reason: 'No interaction rules or rules disabled - default enabled' },
            discovery: { enabled: false, reason: 'No interaction rules or rules disabled - discovery disabled by default' }
        };
    }
    // Get profile data for rule evaluation
    const { followingCount, followersCount } = await getProfileDataForRules(context, drivers);
    // Evaluate each action based on rules
    const likeDecision = shouldLike(rules, followingCount, followersCount);
    const commentDecision = shouldComment(rules, followingCount, followersCount);
    const followDecision = shouldFollow(rules, followingCount, followersCount);
    const discoveryDecision = shouldDiscover(currentLinksCount, rules, followingCount, followersCount);
    return {
        like: {
            enabled: likeDecision.shouldLike,
            reason: likeDecision.reason || 'Rule evaluation'
        },
        comment: {
            enabled: commentDecision.shouldComment,
            reason: commentDecision.reason || 'Rule evaluation'
        },
        follow: {
            enabled: followDecision.shouldFollow,
            reason: followDecision.reason || 'Rule evaluation'
        },
        discovery: {
            enabled: discoveryDecision.shouldDiscover,
            reason: discoveryDecision.reason || 'Rule evaluation',
            linkThreshold: discoveryDecision.linkThreshold,
            mandatory: discoveryDecision.mandatory
        }
    };
}
