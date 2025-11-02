import { Tweet, Project } from '@rawops/shared';
import { IFilterService } from '@rawops/shared';
export declare class FilterService implements IFilterService {
    /**
     * Applies the filtering rules of a project to an array of tweets.
     */
    applyFilters(tweets: Tweet[], project: Project): Promise<Tweet[]>;
    /**
     * Extracts and merges filter options from a project's rules.
     */
    private getFilterOptionsFromProject;
    /**
     * Check if tweet is within time limit.
     */
    private isWithinTimeLimit;
    /**
     * Detect spam tweets based on mentions, hashtags, and keywords.
     */
    private isSpamTweet;
}
