export interface RawTweetData {
    id: string;
    url: string;
    handle: string;
    textContent: string;
    timestamp: string;
    likes: number;
    replies: number;
    retweets: number;
    views: number;
    isVerified: boolean;
    hasMedia: boolean;
}
export interface SearchOptions {
    hashtags?: string[];
    handles?: string[];
    links?: string[];
    officialHandle?: string;
    maxTweetsPerQuery?: number;
    maxScrollsPerQuery?: number;
    timeLimitHours?: number;
    requireVerified?: boolean;
    requireMedia?: boolean;
    minLikes?: number;
    excludeSpam?: boolean;
    maxMentions?: number;
    maxHashtags?: number;
}
export interface FilterOptions {
    timeLimitHours?: number;
    requireVerified?: boolean;
    requireMedia?: boolean;
    minLikes?: number;
    minViews?: number;
    excludeSpam?: boolean;
    maxMentions?: number;
    maxHashtags?: number;
    excludeRetweets?: boolean;
    excludeReplies?: boolean;
}
export interface FlowConfig {
    timeout?: number;
    retries?: number;
    delay?: number;
}
export interface FlowResult {
    success: boolean;
    data?: any;
    error?: string;
    duration: number;
}
export interface IAutomationFlow {
    initialize(driver: any): void;
    execute(): Promise<FlowResult>;
    cleanup(): Promise<void>;
    getStatus(): 'idle' | 'running' | 'completed' | 'error';
    getResults(): FlowResult | null;
}
//# sourceMappingURL=types.d.ts.map