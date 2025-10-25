import { BaseAI, AIResult, AIConfig } from './base';
export interface SelectionOptions {
    criteria?: {
        minEngagement?: number;
        maxEngagement?: number;
        minQuality?: number;
        maxQuality?: number;
        sentiment?: 'positive' | 'negative' | 'neutral' | 'any';
        topics?: string[];
        excludeTopics?: string[];
    };
    maxResults?: number;
    prioritizeBy?: 'engagement' | 'quality' | 'relevance' | 'sentiment';
}
export interface TweetSelection {
    index: number;
    content: string;
    score: number;
    reasons: string[];
}
export declare class SelectionAI extends BaseAI {
    constructor(config: AIConfig);
    /**
     * Select best tweets from a list based on criteria
     */
    selectBestTweets(tweets: string[], options?: SelectionOptions): Promise<AIResult>;
    /**
     * Select tweets suitable for specific actions
     */
    selectTweetsForAction(tweets: string[], action: 'like' | 'retweet' | 'comment' | 'quote', options?: SelectionOptions): Promise<AIResult>;
    /**
     * Select tweets for content creation
     */
    selectTweetsForContent(tweets: string[], contentType: 'thread' | 'quote' | 'analysis', options?: SelectionOptions): Promise<AIResult>;
    /**
     * Rank tweets by multiple criteria
     */
    rankTweets(tweets: string[], criteria?: string[]): Promise<AIResult>;
}
//# sourceMappingURL=selection.d.ts.map