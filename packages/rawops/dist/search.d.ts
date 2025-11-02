import { WebDriver } from 'selenium-webdriver';
import { BaseOps, InteractionResult } from './base';
export interface SearchOptions {
    query: string;
    type?: 'top' | 'latest' | 'people' | 'photos' | 'videos';
    filters?: {
        from?: string;
        to?: string;
        mentions?: string;
        minReplies?: number;
        minRetweets?: number;
        minLikes?: number;
    };
}
export interface TweetData {
    id: string;
    url: string;
    username: string;
    content: string;
    timestamp: string;
    likes: number;
    retweets: number;
    replies: number;
    views?: number;
}
export declare class SearchOps extends BaseOps {
    constructor(driver: WebDriver);
    /**
     * Search for tweets by keyword/hashtag/user
     */
    searchTweets(options: SearchOptions): Promise<InteractionResult>;
    /**
     * Search for users
     */
    searchUsers(query: string): Promise<InteractionResult>;
    /**
     * Get trending topics
     */
    getTrendingTopics(): Promise<InteractionResult>;
    /**
     * Explore page content
     */
    explorePage(): Promise<InteractionResult>;
    /**
     * Get tweets from timeline
     */
    getTimelineTweets(count?: number): Promise<InteractionResult>;
    /**
     * Apply search filters
     */
    private applySearchFilters;
    /**
     * Search for hashtags
     */
    searchHashtag(hashtag: string): Promise<InteractionResult>;
    /**
     * Search for mentions
     */
    searchMentions(username: string): Promise<InteractionResult>;
}
