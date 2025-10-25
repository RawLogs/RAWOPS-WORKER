"use strict";
// packages/core/src/yapproject.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YapProjectService = void 0;
const SearchService_1 = require("../../services/core/SearchService");
const FilterService_1 = require("../../services/core/FilterService");
const XClient_1 = require("../../client/XClient");
const DatabaseService_1 = __importDefault(require("../../services/DatabaseService"));
class YapProjectService {
    constructor() {
        this.xClient = new XClient_1.XClient();
        this.searchService = new SearchService_1.SearchService(this.xClient);
        this.filterService = new FilterService_1.FilterService();
    }
    /**
     * Initialize XClient with profile and proxy configuration
     * @param profile Profile to use for automation
     * @param proxyConfig Proxy configuration (optional)
     */
    async initializeWithProfile(profile, proxyConfig) {
        console.log(`[YapProjectService] Initializing browser for profile: ${profile.handle}`);
        try {
            // Initialize XClient with profile for automation
            await this.xClient.initializeForAutomation(profile.handle, proxyConfig);
            // Auto mode now spawns Chrome directly with search page URL
            // No need to navigate - Chrome opens directly to search page
            console.log(`[YapProjectService] Chrome launched directly to search page for automation`);
            console.log(`[YapProjectService] Successfully initialized browser for ${profile.handle}`);
        }
        catch (error) {
            console.error(`[YapProjectService] Failed to initialize browser:`, error);
            throw error;
        }
    }
    /**
     * Run the complete yapproject automation workflow
     * @param project Project configuration
     * @param run Current run instance
     * @param settings YapProject settings
     * @param interactionRules User's interaction rules
     * @returns Result of the automation workflow
     */
    async runYapProjectWorkflow(project, run, settings, interactionRules) {
        const startTime = Date.now();
        const errors = [];
        console.log(`[YapProjectService] Starting yapproject workflow for project ${project.id}`);
        // Log interaction rules if provided
        if (interactionRules) {
            console.log(`[YapProjectService] Using interaction rules:`, {
                enabled: interactionRules.settings?.enabled,
                rulesCount: interactionRules.rules?.length || 0
            });
        }
        try {
            // Step 1: Search for tweets
            console.log(`[YapProjectService] Step 1: Searching for tweets`);
            const searchOptions = {
                hashtags: settings.hashtags,
                handles: settings.handles,
                links: settings.links,
                officialHandle: settings.officialHandle,
                maxTweetsPerQuery: settings.maxTweetsPerSearch,
                // maxScrollsPerQuery removed - unlimited scrolling until maxTweets reached
                timeLimitHours: settings.timeLimitHours,
                requireVerified: settings.requireVerified,
                requireMedia: settings.requireMedia,
                minLikes: settings.minLikes,
                excludeSpam: settings.excludeSpam,
                maxMentions: settings.maxMentions,
                maxHashtags: settings.maxHashtags
            };
            const tweets = await this.searchService.searchTweetsByHashtag(searchOptions);
            console.log(`[YapProjectService] Collected ${tweets.length} tweets`);
            if (tweets.length === 0) {
                return {
                    success: false,
                    tweetsCollected: 0,
                    tweetsFiltered: 0,
                    interactionsExecuted: 0,
                    errors: ['No tweets found'],
                    duration: Date.now() - startTime
                };
            }
            // Step 2: Filter tweets
            console.log(`[YapProjectService] Step 2: Filtering tweets`);
            const filterOptions = {
                timeLimitHours: settings.timeLimitHours,
                requireVerified: settings.requireVerified,
                requireMedia: settings.requireMedia,
                minLikes: settings.minLikes,
                excludeSpam: settings.excludeSpam,
                maxMentions: settings.maxMentions,
                maxHashtags: settings.maxHashtags
            };
            // Create a mock project for filtering (FilterService expects a Project object)
            const mockProjectForFiltering = {
                id: project.id,
                name: project.name,
                description: project.description,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            };
            const filteredTweets = await this.filterService.applyFilters(tweets, mockProjectForFiltering);
            console.log(`[YapProjectService] Filtered to ${filteredTweets.length} tweets`);
            if (filteredTweets.length === 0) {
                return {
                    success: false,
                    tweetsCollected: tweets.length,
                    tweetsFiltered: 0,
                    interactionsExecuted: 0,
                    errors: ['No tweets passed filters'],
                    duration: Date.now() - startTime
                };
            }
            // Save filtered tweets to database immediately after filtering
            console.log(`[YapProjectService] Saving ${filteredTweets.length} filtered tweets to database`);
            await this.saveFilteredTweets(project, run, filteredTweets);
            // Step 3: Execute interactions
            console.log(`[YapProjectService] Step 3: Executing interactions`);
            // Interaction rules are no longer handled by InteractionService
            if (interactionRules && interactionRules.settings?.enabled) {
                console.log(`[YapProjectService] Interaction rules provided: ${interactionRules.rules.length} rules`);
            }
            // Interactions are no longer handled by InteractionService
            console.log(`[YapProjectService] Skipping interactions - InteractionService removed`);
            // Step 4: Save results to database
            console.log(`[YapProjectService] Step 4: Saving results to database`);
            await this.saveResults(project, run, tweets, filteredTweets, []);
            const duration = Date.now() - startTime;
            console.log(`[YapProjectService] Workflow completed in ${duration}ms`);
            return {
                success: true,
                tweetsCollected: tweets.length,
                tweetsFiltered: filteredTweets.length,
                interactionsExecuted: 0,
                errors,
                duration
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[YapProjectService] Workflow failed:`, error);
            errors.push(errorMessage);
            return {
                success: false,
                tweetsCollected: 0,
                tweetsFiltered: 0,
                interactionsExecuted: 0,
                errors,
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * Save filtered tweets to database immediately after filtering
     */
    async saveFilteredTweets(project, run, filteredTweets) {
        try {
            console.log(`[YapProjectService] Saving ${filteredTweets.length} filtered tweets to database`);
            // Save tweets to Tweet table and track successful saves
            const savedTweets = [];
            for (const tweet of filteredTweets) {
                try {
                    // Skip tweets without targetUserId
                    if (!tweet.targetUserId) {
                        console.log(`[YapProjectService] Skipping tweet ${tweet.url} - no targetUserId`);
                        continue;
                    }
                    // First, ensure TargetUser exists
                    await DatabaseService_1.default.upsertTargetUser({
                        id: tweet.targetUserId,
                        platformId: tweet.targetUserId,
                        handle: tweet.username || 'unknown',
                        displayName: tweet.displayName || tweet.username || 'Unknown User',
                        bio: null,
                        lang: tweet.lang || null,
                        tags: null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    await DatabaseService_1.default.upsertTweet({
                        id: tweet.id,
                        url: tweet.url,
                        text: tweet.text,
                        targetUserId: tweet.targetUserId,
                        postedAt: tweet.postedAt,
                        metrics: tweet.metrics,
                        isVerified: tweet.isVerified,
                        hasMedia: tweet.hasMedia,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    // Track successfully saved tweets
                    savedTweets.push(tweet);
                }
                catch (error) {
                    console.error(`[YapProjectService] Error saving tweet ${tweet.url}:`, error);
                    // Continue with other tweets even if one fails
                }
            }
            // Create interaction records only for successfully saved tweets
            for (const tweet of savedTweets) {
                try {
                    await DatabaseService_1.default.createInteraction({
                        projectId: project.id,
                        runId: run.id,
                        accountId: project.userId, // Use project userId directly
                        targetUserId: tweet.targetUserId,
                        tweetId: tweet.id,
                        type: 'COLLECT',
                        status: 'SUCCESS',
                        result: {
                            tweetUrl: tweet.url,
                            tweetText: tweet.text.substring(0, 200), // Truncate for storage
                            metrics: tweet.metrics,
                            isVerified: tweet.isVerified,
                            hasMedia: tweet.hasMedia,
                            filteredAt: new Date().toISOString()
                        },
                        executedAt: new Date()
                    });
                }
                catch (error) {
                    console.error(`[YapProjectService] Error creating interaction for tweet ${tweet.url}:`, error);
                    // Continue with other tweets even if one fails
                }
            }
            console.log(`[YapProjectService] Successfully saved ${savedTweets.length} filtered tweets and ${savedTweets.length} collection records`);
        }
        catch (error) {
            console.error(`[YapProjectService] Error saving filtered tweets:`, error);
            throw error;
        }
    }
    /**
     * Save workflow results to database
     */
    async saveResults(project, run, tweets, filteredTweets, interactionResults) {
        try {
            // Save interactions from interaction results (user interactions)
            for (const result of interactionResults) {
                await DatabaseService_1.default.createInteraction({
                    projectId: project.id,
                    runId: run.id,
                    accountId: project.userId, // User who owns the project
                    targetUserId: '', // Will be populated from tweet data
                    tweetId: '', // Will be populated from tweet data
                    type: result.action.toUpperCase(),
                    status: result.success ? 'SUCCESS' : 'FAILED',
                    result: {
                        error: result.error || null,
                        comment: result.comment || null
                    },
                    executedAt: new Date()
                });
            }
            console.log(`[YapProjectService] Saved ${interactionResults.length} user interactions (tweets and collection records already saved during filtering)`);
        }
        catch (error) {
            console.error(`[YapProjectService] Error saving results:`, error);
            throw error;
        }
    }
    /**
     * Load yapproject settings from database
     */
    async loadYapProjectSettings(projectId) {
        try {
            const project = await DatabaseService_1.default.findProject(projectId);
            if (!project) {
                throw new Error(`Project ${projectId} not found`);
            }
            // Extract settings from project rules
            const settings = {
                hashtags: [],
                handles: [],
                links: [],
                officialHandle: '',
                maxTweetsPerSearch: 100,
                timeLimitHours: 24,
                requireVerified: false,
                requireMedia: false,
                minLikes: 0,
                excludeSpam: true,
                maxMentions: 5,
                maxHashtags: 3,
                maxInteractions: 50,
                delayBetweenActions: 2000,
                delayBetweenTweets: 5000,
                scrollDelay: 1000,
                retryAttempts: 3,
                aiCommentEnabled: false,
                aiCommentPrompt: '',
                geminiApiKey: ''
            };
            // Parse project rules to extract settings
            for (const rule of project.Rules) {
                if (rule.payload) {
                    const payload = rule.payload;
                    switch (rule.type) {
                        case 'SEARCH':
                            if (payload.hashtags)
                                settings.hashtags = payload.hashtags;
                            if (payload.handles)
                                settings.handles = payload.handles;
                            if (payload.links)
                                settings.links = payload.links;
                            if (payload.officialHandle)
                                settings.officialHandle = payload.officialHandle;
                            if (payload.maxTweetsPerSearch)
                                settings.maxTweetsPerSearch = payload.maxTweetsPerSearch;
                            break;
                        case 'FILTER':
                            if (payload.timeLimitHours)
                                settings.timeLimitHours = payload.timeLimitHours;
                            if (payload.requireVerified !== undefined)
                                settings.requireVerified = payload.requireVerified;
                            if (payload.requireMedia !== undefined)
                                settings.requireMedia = payload.requireMedia;
                            if (payload.minLikes)
                                settings.minLikes = payload.minLikes;
                            if (payload.excludeSpam !== undefined)
                                settings.excludeSpam = payload.excludeSpam;
                            if (payload.maxMentions)
                                settings.maxMentions = payload.maxMentions;
                            if (payload.maxHashtags)
                                settings.maxHashtags = payload.maxHashtags;
                            break;
                        case 'INTERACTION':
                            if (payload.maxInteractions)
                                settings.maxInteractions = payload.maxInteractions;
                            if (payload.delayBetweenActions)
                                settings.delayBetweenActions = payload.delayBetweenActions;
                            if (payload.delayBetweenTweets)
                                settings.delayBetweenTweets = payload.delayBetweenTweets;
                            if (payload.scrollDelay)
                                settings.scrollDelay = payload.scrollDelay;
                            if (payload.retryAttempts)
                                settings.retryAttempts = payload.retryAttempts;
                            break;
                        case 'AI':
                            if (payload.aiCommentEnabled !== undefined)
                                settings.aiCommentEnabled = payload.aiCommentEnabled;
                            if (payload.aiCommentPrompt)
                                settings.aiCommentPrompt = payload.aiCommentPrompt;
                            if (payload.geminiApiKey)
                                settings.geminiApiKey = payload.geminiApiKey;
                            break;
                    }
                }
            }
            console.log(`[YapProjectService] Loaded settings:`, {
                maxTweetsPerSearch: settings.maxTweetsPerSearch,
                hashtags: settings.hashtags.length,
                handles: settings.handles.length,
                links: settings.links.length
            });
            return settings;
        }
        catch (error) {
            console.error(`[YapProjectService] Error loading settings:`, error);
            throw error;
        }
    }
    /**
     * Save yapproject settings to database
     */
    async saveYapProjectSettings(projectId, settings) {
        try {
            // TODO: Save settings to project rules
            console.log(`[YapProjectService] Saving settings for project ${projectId}`);
        }
        catch (error) {
            console.error(`[YapProjectService] Error saving settings:`, error);
            throw error;
        }
    }
}
exports.YapProjectService = YapProjectService;
//# sourceMappingURL=YapProjectService.js.map