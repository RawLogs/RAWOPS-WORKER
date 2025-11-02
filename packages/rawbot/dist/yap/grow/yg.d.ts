import { Project, Run } from '@rawops/shared';
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
    aiCommentEnabled?: boolean;
    geminiApiKey?: string;
    aiModel?: string;
    aiCommentPrompt?: string;
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
    };
    target_status_id?: string | null;
}
/**
 * YapGrow - Automated flow execution based on JSON settings
 * Parses flow configuration and executes actions using driver functions
 */
export declare class YapGrow {
    private xClient;
    private drivers;
    private contentAI;
    private profileHandle;
    private profileId;
    private cacheDir;
    private runId;
    private runType;
    private isClosed;
    private context;
    private processedSettings;
    constructor();
    initializeWithProfile(profile: any, proxyConfig?: any): Promise<void>;
    runYapGrowWorkflow(project: Project, run: Run, settings: YapGrowSettings): Promise<YapGrowResult>;
    /**
     * Execute steps in order
     */
    private executeSteps;
    /**
     * Execute a single step
     */
    private executeStep;
    /**
     * Resolve step params (convert step object to params, excluding 'action' and 'ms')
     */
    private resolveStepParams;
    /**
     * Get delay value from DelaySetting (number or {min, max})
     * If it's an object, returns random value between min and max
     */
    private getDelayValue;
    /**
     * Resolve a variable value
     */
    private resolveVariable;
    /**
     * Step handlers
     */
    private handleOpen;
    private handleScrollRandom;
    private handleExtractProfile;
    private handleWaitUntilExtractDone;
    private handleScrollAndDetectTweets;
    private handleScrollStep;
    private handleWait;
    private handleScrollToElement;
    private handleFollowUser;
    close(): Promise<void>;
}
