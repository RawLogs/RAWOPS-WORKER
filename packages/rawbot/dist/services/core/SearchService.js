"use strict";
// packages/rawbot/src/core/SearchService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const XClient_1 = require("../../client/XClient");
const SearchFlow_1 = require("../../flows/SearchFlow");
class SearchService {
    constructor(xClient) {
        this.xClient = xClient || new XClient_1.XClient();
    }
    async discoverTargets(project, run) {
        console.log(`[SearchService] Discovering targets for project ${project.id}`);
        try {
            // Initialize client but skip login and search for now
            // These methods were removed from XClient
            console.log(`[SearchService] Client initialized, skipping login and search`);
            const savedUsers = [];
            const savedTweets = [];
            // Return empty results for now since search method was removed
            console.log(`[SearchService] Returning empty results - search functionality removed`);
            return { tweets: savedTweets, users: savedUsers };
        }
        catch (error) {
            console.error("[SearchService] An error occurred during target discovery:", error);
            return { users: [], tweets: [] };
        }
        finally {
            await this.xClient.close();
        }
    }
    /**
     * Search tweets by hashtags with advanced options
     */
    async searchTweetsByHashtag(options) {
        console.log(`[SearchService] Starting advanced hashtag search with ${options.hashtags?.length || 0} hashtags`);
        try {
            const allTweets = [];
            // Search by hashtags
            if (options.hashtags && options.hashtags.length > 0) {
                for (const hashtag of options.hashtags) {
                    console.log(`[SearchService] Searching hashtag: #${hashtag}`);
                    const searchFlowConfig = {
                        query: `#${hashtag}`,
                        maxTweets: options.maxTweetsPerQuery || 50,
                        maxScrolls: undefined,
                        scrollDelay: 2000,
                        searchType: 'hashtag',
                        filters: {
                            minLikes: options.minLikes,
                            requireVerified: options.requireVerified,
                            requireMedia: options.requireMedia,
                            excludeRetweets: true,
                            excludeReplies: false
                        }
                    };
                    const searchFlow = new SearchFlow_1.SearchFlow(searchFlowConfig);
                    await searchFlow.initialize(this.xClient.getDriver());
                    const flowResult = await searchFlow.execute();
                    const rawTweets = flowResult.data?.tweets || [];
                    for (const rawTweet of rawTweets) {
                        const tweet = await this.transformRawTweetToDomain(rawTweet);
                        if (tweet) {
                            allTweets.push(tweet);
                        }
                    }
                }
            }
            // Search by handles
            if (options.handles && options.handles.length > 0) {
                for (const handle of options.handles) {
                    console.log(`[SearchService] Searching handle: @${handle}`);
                    const searchFlowConfig = {
                        query: handle,
                        maxTweets: options.maxTweetsPerQuery || 30,
                        maxScrolls: undefined,
                        scrollDelay: 2000,
                        searchType: 'handle',
                        filters: {
                            minLikes: options.minLikes,
                            requireVerified: options.requireVerified,
                            requireMedia: options.requireMedia,
                            excludeRetweets: false,
                            excludeReplies: false
                        }
                    };
                    const searchFlow = new SearchFlow_1.SearchFlow(searchFlowConfig);
                    await searchFlow.initialize(this.xClient.getDriver());
                    const flowResult = await searchFlow.execute();
                    const rawTweets = flowResult.data?.tweets || [];
                    for (const rawTweet of rawTweets) {
                        const tweet = await this.transformRawTweetToDomain(rawTweet);
                        if (tweet) {
                            allTweets.push(tweet);
                        }
                    }
                }
            }
            // Search by links
            if (options.links && options.links.length > 0) {
                for (const link of options.links) {
                    console.log(`[SearchService] Searching link: ${link}`);
                    const searchFlowConfig = {
                        query: link,
                        maxTweets: options.maxTweetsPerQuery || 20,
                        maxScrolls: undefined,
                        scrollDelay: 2000,
                        searchType: 'keyword',
                        filters: {
                            minLikes: options.minLikes,
                            requireVerified: options.requireVerified,
                            requireMedia: options.requireMedia
                        }
                    };
                    const searchFlow = new SearchFlow_1.SearchFlow(searchFlowConfig);
                    await searchFlow.initialize(this.xClient.getDriver());
                    const flowResult = await searchFlow.execute();
                    const rawTweets = flowResult.data?.tweets || [];
                    for (const rawTweet of rawTweets) {
                        const tweet = await this.transformRawTweetToDomain(rawTweet);
                        if (tweet) {
                            allTweets.push(tweet);
                        }
                    }
                }
            }
            console.log(`[SearchService] Found ${allTweets.length} total tweets`);
            return allTweets;
        }
        catch (error) {
            console.error("[SearchService] An error occurred during hashtag search:", error);
            return [];
        }
    }
    /**
     * Transform raw tweet data to domain Tweet entity
     */
    async transformRawTweetToDomain(rawTweet) {
        try {
            const tweet = {
                id: rawTweet.id || '',
                targetUserId: rawTweet.handle,
                text: rawTweet.textContent,
                username: rawTweet.handle,
                postedAt: new Date(rawTweet.timestamp),
                url: rawTweet.url,
                metrics: {
                    likes: rawTweet.likes,
                    retweets: rawTweet.retweets,
                    replies: rawTweet.replies,
                    views: rawTweet.views
                },
                isVerified: rawTweet.isVerified,
                hasMedia: rawTweet.hasMedia,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            return tweet;
        }
        catch (error) {
            console.error("[SearchService] Error transforming raw tweet:", error);
            return null;
        }
    }
}
exports.SearchService = SearchService;
//# sourceMappingURL=SearchService.js.map