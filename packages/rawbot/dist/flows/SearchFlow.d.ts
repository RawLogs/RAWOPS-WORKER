import { BaseFlow } from './BaseFlow';
import { FlowConfig, FlowResult } from '../types/types';
export interface SearchFlowConfig extends FlowConfig {
    query: string;
    maxTweets?: number;
    maxScrolls?: number;
    scrollDelay?: number;
    searchType?: 'hashtag' | 'handle' | 'keyword' | 'mixed';
    filters?: {
        minLikes?: number;
        minRetweets?: number;
        requireVerified?: boolean;
        requireMedia?: boolean;
        excludeRetweets?: boolean;
        excludeReplies?: boolean;
    };
}
export declare class SearchFlow extends BaseFlow {
    private searchConfig;
    private seenTweetIds;
    constructor(config: SearchFlowConfig);
    execute(): Promise<FlowResult>;
    private buildSearchUrl;
    private filterAndDeduplicateTweets;
    private applyFilters;
    private extractTweetsFromViewport;
}
