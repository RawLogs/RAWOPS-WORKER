import { BaseAI, AIResult, AIConfig } from './base';
export interface AnalysisOptions {
    includeSentiment?: boolean;
    includeTopics?: boolean;
    includeEngagement?: boolean;
    includeQuality?: boolean;
}
export interface TweetAnalysis {
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
    engagementScore: number;
    qualityScore: number;
    summary: string;
    recommendations: string[];
}
export declare class AnalysisAI extends BaseAI {
    constructor(config: AIConfig);
    /**
     * Analyze tweet content
     */
    analyzeTweet(tweetContent: string, options?: AnalysisOptions): Promise<AIResult>;
    /**
     * Analyze multiple tweets for comparison
     */
    analyzeTweetBatch(tweets: string[], options?: AnalysisOptions): Promise<AIResult>;
    /**
     * Analyze user's tweet history for patterns
     */
    analyzeUserPatterns(tweets: string[], username: string): Promise<AIResult>;
    /**
     * Analyze trending topics
     */
    analyzeTrendingTopics(topics: string[], context?: string): Promise<AIResult>;
}
