import { Project, Run } from '@rawops/shared';
import { XClient } from '../../client/XClient';
export interface YapProjectSettings {
    hashtags: string[];
    handles: string[];
    links: string[];
    officialHandle: string;
    maxTweetsPerSearch: number;
    timeLimitHours: number;
    requireVerified: boolean;
    requireMedia: boolean;
    minLikes: number;
    excludeSpam: boolean;
    maxMentions: number;
    maxHashtags: number;
    maxInteractions: number;
    delayBetweenActions: number;
    delayBetweenTweets: number;
    scrollDelay: number;
    retryAttempts: number;
    aiCommentEnabled: boolean;
    aiCommentPrompt: string;
    geminiApiKey: string;
}
export interface YapProjectResult {
    success: boolean;
    tweetsCollected: number;
    tweetsFiltered: number;
    interactionsExecuted: number;
    errors: string[];
    duration: number;
}
export declare class YapProjectService {
    private searchService;
    private filterService;
    xClient: XClient;
    constructor();
    /**
     * Initialize XClient with profile and proxy configuration
     * @param profile Profile to use for automation
     * @param proxyConfig Proxy configuration (optional)
     */
    initializeWithProfile(profile: any, proxyConfig?: any): Promise<void>;
    /**
     * Run the complete yapproject automation workflow
     * @param project Project configuration
     * @param run Current run instance
     * @param settings YapProject settings
     * @param interactionRules User's interaction rules
     * @returns Result of the automation workflow
     */
    runYapProjectWorkflow(project: Project, run: Run, settings: YapProjectSettings, interactionRules?: any): Promise<YapProjectResult>;
    /**
     * Save filtered tweets to database immediately after filtering
     */
    private saveFilteredTweets;
    /**
     * Save workflow results to database
     */
    private saveResults;
    /**
     * Load yapproject settings from database
     */
    loadYapProjectSettings(projectId: string): Promise<YapProjectSettings>;
    /**
     * Save yapproject settings to database
     */
    saveYapProjectSettings(projectId: string, settings: YapProjectSettings): Promise<void>;
}
//# sourceMappingURL=YapProjectService.d.ts.map