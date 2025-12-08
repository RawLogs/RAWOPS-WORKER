import { ProfileData, TweetInteractionData } from '@rawops/rawops';
export interface Step {
    action: string;
    [key: string]: any;
}
export type DelaySetting = number | {
    min: number;
    max: number;
};
export interface YapGrowSettings {
    steps: Step[];
    links: string[];
    delay_between_links?: DelaySetting;
    user_delay_follow?: DelaySetting;
    profileId?: string;
    enableLike?: boolean;
    enableComment?: boolean;
    tweetTimeFilterHours?: number;
    aiCommentEnabled?: boolean;
    geminiApiKey?: string;
    profileApiKeys?: {
        geminiApiKey?: string | null;
        openaiApiKey?: string | null;
        deepseekApiKey?: string | null;
        huggingfaceApiKey?: string | null;
        apiKeyPriority?: string[];
    };
    aiModel?: string;
    aiCommentPrompt?: string;
    aiLanguage?: string;
    commentStyle?: 'casual' | 'professional' | 'enthusiastic' | 'analytical' | 'friendly';
    commentLength?: 'short' | 'medium' | 'long';
    includeHashtags?: boolean;
    maxHashtags?: number;
    includeMentions?: boolean;
    maxMentions?: number;
    promptStyleMode?: 'manual' | 'random';
    selectedPromptStyles?: Array<{
        id: string;
        name: string;
        prompt: string;
        displayName: string;
        description: string;
        category: string;
        weight: number;
    }>;
    promptStyleCategory?: string;
    databasePrompt?: {
        finalPrompt: string;
        requirePrompt: string;
    } | null;
    interactionRules?: {
        rules: Array<{
            id: string;
            name: string;
            description: string;
            followingRange: {
                min: number;
                max: number;
                operator: 'always' | 'between_percent' | 'less_than_percent' | 'greater_than_percent';
            };
            actions: {
                follow: boolean;
                like: boolean;
                comment: boolean;
                discovery?: {
                    enabled: boolean;
                    linkThreshold: number;
                    mandatory: boolean;
                };
            };
            priority: number;
        }>;
        settings: {
            enabled: boolean;
            version: string;
            lastUpdated: string;
        };
    };
}
export interface YapGrowResult {
    success: boolean;
    processedLinks: string[];
    failedLinks: string[];
    errors: string[];
    duration: number;
    followedCount: number;
    profileExtractedCount: number;
    likedCount: number;
    commentedCount: number;
}
export interface FlowContext {
    current_link?: string;
    current_profile?: ProfileData | null;
    detected_tweets?: any[];
    detected_target_tweet?: TweetInteractionData | null;
    following_status?: boolean;
    variables?: Record<string, any>;
    interaction_result?: {
        liked?: boolean;
        commented?: boolean;
        ruleReason?: string;
    };
    target_status_id?: string | null;
    remainingLinksCount?: number;
}
