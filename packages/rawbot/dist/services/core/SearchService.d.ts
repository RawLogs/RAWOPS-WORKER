import { Tweet, TargetUser, Project, Run, ISearchService } from '@rawops/shared';
import { XClient } from '../../client/XClient';
import { SearchOptions } from '../../types/types';
export type { SearchOptions } from '../../types/types';
export declare class SearchService implements ISearchService {
    private xClient;
    constructor(xClient?: XClient);
    discoverTargets(project: Project, run: Run): Promise<{
        tweets: Tweet[];
        users: TargetUser[];
    }>;
    /**
     * Search tweets by hashtags with advanced options
     */
    searchTweetsByHashtag(options: SearchOptions): Promise<Tweet[]>;
    /**
     * Transform raw tweet data to domain Tweet entity
     */
    private transformRawTweetToDomain;
}
