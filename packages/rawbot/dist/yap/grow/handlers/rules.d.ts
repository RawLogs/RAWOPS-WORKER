import { FlowContext, YapGrowSettings } from '../types';
import { Drivers } from '../../../driver/drivers';
interface FollowingRange {
    min: number;
    max: number;
    operator: 'always' | 'between_percent' | 'less_than_percent' | 'greater_than_percent';
}
interface DiscoveryAction {
    enabled: boolean;
    linkThreshold: number;
    mandatory: boolean;
}
interface RuleActions {
    follow: boolean;
    like: boolean;
    comment: boolean;
    discovery?: DiscoveryAction;
}
interface InteractionRule {
    id: string;
    name: string;
    description: string;
    followingRange: FollowingRange;
    actions: RuleActions;
    priority: number;
}
/**
 * Get interaction rules from grow-settings
 */
export declare function getInteractionRules(settings: YapGrowSettings | undefined): InteractionRule[];
/**
 * Get profile data for rule evaluation
 * Returns followingCount and followersCount from context or extracts from current page
 * Prioritizes data from context.current_profile (set by extract_profile step)
 */
export declare function getProfileDataForRules(context: FlowContext, drivers: Drivers | undefined): Promise<{
    followingCount: number;
    followersCount: number;
}>;
/**
 * Evaluate which rule should apply based on following ratio
 */
export declare function evaluateRule(followingCount: number, followersCount: number, rules: InteractionRule[]): InteractionRule | null;
/**
 * Evaluate all rules that match based on following/followers ratio
 * Returns all matching rules (sorted by priority)
 */
export declare function evaluateAllRules(followingCount: number, followersCount: number, rules: InteractionRule[]): InteractionRule[];
/**
 * Check if like action should be enabled based on rules
 * Returns true only if the matching rule explicitly enables like (actions.like === true)
 * Returns all matching rules in reason for comprehensive logging
 */
export declare function shouldLike(rules: InteractionRule[], followingCount: number, followersCount: number): {
    shouldLike: boolean;
    reason: string;
    ruleName?: string;
};
/**
 * Check if comment action should be enabled based on rules
 * Returns true only if the matching rule explicitly enables comment (actions.comment === true)
 * Returns all matching rules in reason for comprehensive logging
 */
export declare function shouldComment(rules: InteractionRule[], followingCount: number, followersCount: number): {
    shouldComment: boolean;
    reason: string;
    ruleName?: string;
};
/**
 * Check if follow action should be enabled based on rules
 * Returns true only if the matching rule explicitly enables follow (actions.follow === true)
 * Returns all matching rules in reason for comprehensive logging
 */
export declare function shouldFollow(rules: InteractionRule[], followingCount: number, followersCount: number): {
    shouldFollow: boolean;
    reason: string;
    ruleName?: string;
};
/**
 * Check if discovery should be enabled based on current links count and rules
 * Discovery logic:
 * - If rule has discovery.enabled = true and links < linkThreshold, discovery is enabled
 * - If discovery.mandatory = true, discovery is ALWAYS enabled when links < threshold (regardless of other rules)
 * - If discovery.mandatory = false, discovery is optional (can be overridden by higher priority rules)
 */
export declare function shouldDiscover(currentLinksCount: number, rules: InteractionRule[], followingCount: number, followersCount: number): {
    shouldDiscover: boolean;
    reason: string;
    mandatory: boolean;
    linkThreshold?: number;
};
/**
 * Evaluate interaction rules for specific actions
 * Returns enabled status for like, comment, follow, and discovery
 */
export declare function evaluateInteractionRules(settings: YapGrowSettings | undefined, context: FlowContext, drivers: Drivers | undefined, currentLinksCount?: number): Promise<{
    like: {
        enabled: boolean;
        reason: string;
    };
    comment: {
        enabled: boolean;
        reason: string;
    };
    follow: {
        enabled: boolean;
        reason: string;
    };
    discovery: {
        enabled: boolean;
        reason: string;
        linkThreshold?: number;
        mandatory?: boolean;
    };
}>;
export {};
