"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchOps = void 0;
const selenium_webdriver_1 = require("selenium-webdriver");
const base_1 = require("./base");
class SearchOps extends base_1.BaseOps {
    constructor(driver) {
        super(driver);
    }
    /**
     * Search for tweets by keyword/hashtag/user
     */
    async searchTweets(options) {
        try {
            const { query, type = 'latest', filters } = options;
            // Navigate to search page
            const searchUrl = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=${type}`;
            await this.driver.get(searchUrl);
            await this.randomDelay(3000, 5000);
            // Wait for search results to load
            await this.driver.wait(async () => {
                const tweets = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="tweet"]'));
                return tweets.length > 0;
            }, 10000);
            await this.randomDelay(2000, 3000);
            // Apply filters if provided
            if (filters) {
                await this.applySearchFilters(filters);
            }
            return { success: true, data: { query, type, filters } };
        }
        catch (error) {
            return { success: false, error: `Error searching tweets: ${error}` };
        }
    }
    /**
     * Search for users
     */
    async searchUsers(query) {
        try {
            const searchUrl = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=user`;
            await this.driver.get(searchUrl);
            await this.randomDelay(3000, 5000);
            // Wait for user results to load
            await this.driver.wait(async () => {
                const users = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="UserCell"]'));
                return users.length > 0;
            }, 10000);
            return { success: true, data: { query } };
        }
        catch (error) {
            return { success: false, error: `Error searching users: ${error}` };
        }
    }
    /**
     * Get trending topics
     */
    async getTrendingTopics() {
        try {
            await this.driver.get('https://x.com/explore');
            await this.randomDelay(3000, 5000);
            // Wait for trending section to load
            await this.driver.wait(async () => {
                const trends = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="trend"]'));
                return trends.length > 0;
            }, 10000);
            // Extract trending topics
            const trends = await this.driver.executeScript(`
        const trendElements = document.querySelectorAll('[data-testid="trend"]');
        return Array.from(trendElements).map(el => ({
          text: el.textContent,
          url: el.href || ''
        }));
      `);
            return { success: true, data: { trends } };
        }
        catch (error) {
            return { success: false, error: `Error getting trending topics: ${error}` };
        }
    }
    /**
     * Explore page content
     */
    async explorePage() {
        try {
            await this.driver.get('https://x.com/explore');
            await this.randomDelay(3000, 5000);
            // Wait for content to load
            await this.driver.wait(async () => {
                const tweets = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="tweet"]'));
                return tweets.length > 0;
            }, 10000);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error exploring page: ${error}` };
        }
    }
    /**
     * Get tweets from timeline
     */
    async getTimelineTweets(count = 10) {
        try {
            await this.driver.get('https://x.com/home');
            await this.randomDelay(3000, 5000);
            // Wait for timeline to load
            await this.driver.wait(async () => {
                const tweets = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="tweet"]'));
                return tweets.length > 0;
            }, 10000);
            // Scroll to load more tweets if needed
            let currentCount = 0;
            while (currentCount < count) {
                const tweets = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="tweet"]'));
                currentCount = tweets.length;
                if (currentCount < count) {
                    await this.driver.executeScript('window.scrollBy(0, 1000);');
                    await this.randomDelay(2000, 3000);
                }
            }
            // Extract tweet data
            const tweets = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="tweet"]'));
            const tweetData = [];
            for (let i = 0; i < Math.min(count, tweets.length); i++) {
                const tweet = tweets[i];
                const data = await this.driver.executeScript(`
          const tweet = arguments[0];
          const textElement = tweet.querySelector('[data-testid="tweetText"]');
          const authorElement = tweet.querySelector('[data-testid="User-Name"]');
          const timeElement = tweet.querySelector('time');
          
          return {
            text: textElement ? textElement.textContent : '',
            author: authorElement ? authorElement.textContent : '',
            time: timeElement ? timeElement.getAttribute('datetime') : '',
            url: window.location.href
          };
        `, tweet);
                tweetData.push({
                    id: `tweet_${i}`,
                    url: data.url,
                    username: data.author,
                    content: data.text,
                    timestamp: data.time,
                    likes: 0,
                    retweets: 0,
                    replies: 0
                });
            }
            return { success: true, data: { tweets: tweetData } };
        }
        catch (error) {
            return { success: false, error: `Error getting timeline tweets: ${error}` };
        }
    }
    /**
     * Apply search filters
     */
    async applySearchFilters(filters) {
        try {
            // Click on filters button
            const filterButton = await this.driver.findElement(selenium_webdriver_1.By.css('[data-testid="searchFilters"]'));
            await filterButton.click();
            await this.randomDelay(1000, 2000);
            // Apply filters based on provided options
            if (filters.from) {
                const fromInput = await this.driver.findElement(selenium_webdriver_1.By.css('input[placeholder*="From"]'));
                await fromInput.clear();
                await fromInput.sendKeys(filters.from);
            }
            if (filters.to) {
                const toInput = await this.driver.findElement(selenium_webdriver_1.By.css('input[placeholder*="To"]'));
                await toInput.clear();
                await toInput.sendKeys(filters.to);
            }
            // Apply the filters
            const applyButton = await this.driver.findElement(selenium_webdriver_1.By.css('button[data-testid="applyFilters"]'));
            await applyButton.click();
            await this.randomDelay(2000, 3000);
        }
        catch (error) {
            console.error('Error applying filters:', error);
        }
    }
    /**
     * Search for hashtags
     */
    async searchHashtag(hashtag) {
        try {
            const cleanHashtag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
            return await this.searchTweets({ query: cleanHashtag, type: 'latest' });
        }
        catch (error) {
            return { success: false, error: `Error searching hashtag: ${error}` };
        }
    }
    /**
     * Search for mentions
     */
    async searchMentions(username) {
        try {
            const cleanUsername = username.startsWith('@') ? username : `@${username}`;
            return await this.searchTweets({ query: cleanUsername, type: 'latest' });
        }
        catch (error) {
            return { success: false, error: `Error searching mentions: ${error}` };
        }
    }
}
exports.SearchOps = SearchOps;
//# sourceMappingURL=search.js.map