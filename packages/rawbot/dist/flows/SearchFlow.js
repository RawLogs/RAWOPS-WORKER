"use strict";
// packages/rawbot/src/flows/SearchFlow.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchFlow = void 0;
const BaseFlow_1 = require("./BaseFlow");
class SearchFlow extends BaseFlow_1.BaseFlow {
    constructor(config) {
        super(config);
        this.seenTweetIds = new Set();
        this.searchConfig = {
            maxTweets: 100,
            maxScrolls: 20,
            scrollDelay: 2000,
            searchType: 'keyword',
            ...config
        };
    }
    async execute() {
        if (!this.driver) {
            throw new Error('SearchFlow not initialized');
        }
        const startTime = Date.now();
        this.status = 'running';
        try {
            console.log(`[SearchFlow] Starting search for: ${this.searchConfig.query}`);
            // Build search URL
            const searchUrl = this.buildSearchUrl();
            await this.driver.get(searchUrl);
            await this.driver.sleep(3000);
            const tweets = [];
            const maxTweets = this.searchConfig.maxTweets || 10;
            const maxScrolls = this.searchConfig.maxScrolls || 20;
            let scrollCount = 0;
            let consecutiveEmptyScrolls = 0;
            const maxConsecutiveEmptyScrolls = 5;
            // Initial tweet extraction
            const initialTweets = await this.extractTweetsFromViewport();
            tweets.push(...this.filterAndDeduplicateTweets(initialTweets));
            while (consecutiveEmptyScrolls < maxConsecutiveEmptyScrolls &&
                tweets.length < maxTweets &&
                scrollCount < maxScrolls) {
                scrollCount++;
                console.log(`[SearchFlow] Scroll ${scrollCount}/${maxScrolls} - Found ${tweets.length}/${maxTweets} tweets`);
                // Scroll down
                await this.driver.executeScript('window.scrollBy(0, 1000);');
                await this.driver.sleep(this.searchConfig.scrollDelay || 2000);
                // Extract tweets
                const currentTweets = await this.extractTweetsFromViewport();
                const newTweets = this.filterAndDeduplicateTweets(currentTweets);
                tweets.push(...newTweets);
                // Check if we found new tweets
                if (newTweets.length === 0) {
                    consecutiveEmptyScrolls++;
                }
                else {
                    consecutiveEmptyScrolls = 0;
                }
                // Apply filters
                if (this.searchConfig.filters) {
                    this.applyFilters(tweets);
                }
            }
            const duration = Date.now() - startTime;
            this.results = {
                success: true,
                data: {
                    tweets: tweets.slice(0, maxTweets),
                    query: this.searchConfig.query,
                    totalTweets: tweets.length,
                    scrolls: scrollCount
                },
                duration
            };
            this.status = 'completed';
            console.log(`[SearchFlow] Search completed. Found ${tweets.length} tweets in ${duration}ms`);
            return this.results;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.results = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration
            };
            this.status = 'error';
            console.error(`[SearchFlow] Error during search:`, error);
            return this.results;
        }
    }
    buildSearchUrl() {
        const baseUrl = 'https://x.com/search';
        const params = new URLSearchParams();
        switch (this.searchConfig.searchType) {
            case 'hashtag':
                params.set('q', `#${this.searchConfig.query.replace('#', '')}`);
                break;
            case 'handle':
                params.set('q', `from:${this.searchConfig.query.replace('@', '')}`);
                break;
            default:
                params.set('q', this.searchConfig.query);
        }
        params.set('src', 'typed_query');
        params.set('f', 'top');
        return `${baseUrl}?${params.toString()}`;
    }
    filterAndDeduplicateTweets(tweets) {
        return tweets.filter(tweet => {
            if (this.seenTweetIds.has(tweet.url)) {
                return false;
            }
            this.seenTweetIds.add(tweet.url);
            if (tweet.textContent.length < 10)
                return false;
            if (tweet.textContent.length > 1000)
                return false;
            return true;
        });
    }
    applyFilters(tweets) {
        if (!this.searchConfig.filters)
            return;
        const filters = this.searchConfig.filters;
        for (let i = tweets.length - 1; i >= 0; i--) {
            const tweet = tweets[i];
            if (filters.minLikes && tweet.likes < filters.minLikes) {
                tweets.splice(i, 1);
                continue;
            }
            if (filters.minRetweets && tweet.retweets < filters.minRetweets) {
                tweets.splice(i, 1);
                continue;
            }
            if (filters.requireVerified && !tweet.isVerified) {
                tweets.splice(i, 1);
                continue;
            }
            if (filters.requireMedia && !tweet.hasMedia) {
                tweets.splice(i, 1);
                continue;
            }
            if (filters.excludeRetweets && tweet.textContent.startsWith('RT @')) {
                tweets.splice(i, 1);
                continue;
            }
            if (filters.excludeReplies && tweet.textContent.startsWith('@')) {
                tweets.splice(i, 1);
                continue;
            }
        }
    }
    async extractTweetsFromViewport() {
        try {
            const tweets = await this.driver.executeScript(`
        const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');
        const tweets = [];
        
        for (let i = 0; i < tweetElements.length; i++) {
          const tweetElement = tweetElements[i];
          
          try {
            const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
            const userElement = tweetElement.querySelector('[data-testid="User-Name"]');
            const handleElement = tweetElement.querySelector('[data-testid="User-Name"] a');
            const timeElement = tweetElement.querySelector('time');
            
            if (textElement && userElement) {
              const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
              const tweetId = tweetLink ? tweetLink.getAttribute('href')?.split('/status/')[1]?.split('?')[0] : '';
              
              const tweetData = {
                id: tweetId || '',
                url: tweetLink ? \`https://x.com\${tweetLink.getAttribute('href')}\` : '',
                handle: handleElement ? handleElement.getAttribute('href')?.slice(1) || '' : '',
                textContent: textElement.textContent || '',
                timestamp: timeElement ? timeElement.getAttribute('datetime') : '',
                likes: 0,
                retweets: 0,
                replies: 0,
                views: 0,
                isVerified: false,
                hasMedia: false
              };
              
              // Extract metrics
              const likeElement = tweetElement.querySelector('[data-testid="like"] span');
              const replyElement = tweetElement.querySelector('[data-testid="reply"] span');
              const retweetElement = tweetElement.querySelector('[data-testid="retweet"] span');
              
              tweetData.likes = parseInt(likeElement?.textContent?.replace(/[^\\d]/g, '') || '0') || 0;
              tweetData.replies = parseInt(replyElement?.textContent?.replace(/[^\\d]/g, '') || '0') || 0;
              tweetData.retweets = parseInt(retweetElement?.textContent?.replace(/[^\\d]/g, '') || '0') || 0;
              
              // Check verification and media
              tweetData.isVerified = tweetElement.querySelector('[data-testid="icon-verified"]') !== null;
              tweetData.hasMedia = tweetElement.querySelectorAll('[data-testid="tweetPhoto"], [data-testid="videoPlayer"]').length > 0;
              
              tweets.push(tweetData);
            }
          } catch (e) {
            console.warn('Error extracting tweet data:', e);
          }
        }
        
        return tweets;
      `);
            return tweets || [];
        }
        catch (error) {
            console.error(`[SearchFlow] Error extracting tweets:`, error);
            return [];
        }
    }
}
exports.SearchFlow = SearchFlow;
//# sourceMappingURL=SearchFlow.js.map