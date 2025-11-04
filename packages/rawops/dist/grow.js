"use strict";
// packages/rawops/src/grow.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowOps = void 0;
const selenium_webdriver_1 = require("selenium-webdriver");
const base_1 = require("./base");
/**
 * GrowOps - Operations for grow workflow automation
 * Provides methods for navigation, scrolling, interaction, and discovery
 */
class GrowOps extends base_1.BaseOps {
    constructor(driver) {
        super(driver);
    }
    /**
     * Parse X/Twitter URL to extract profile URL and status ID
     * Normalizes URLs to x.com format
     */
    parseTwitterUrl(url) {
        let profileUrl = url;
        let statusId = null;
        let username = null;
        try {
            // Check if URL contains status ID
            // Pattern: https://x.com/username/status/1234567890
            // Pattern: https://twitter.com/username/status/1234567890
            const statusMatch = url.match(/\/(?:status|statuses)\/(\d+)/);
            if (statusMatch) {
                statusId = statusMatch[1];
                // Extract username from URL and create profile URL only
                const profileMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([^\/\?]+)/);
                if (profileMatch) {
                    username = profileMatch[1];
                    // Normalize to profile URL only (remove status part)
                    profileUrl = `https://x.com/${username}`;
                }
            }
            else {
                // For profile links, normalize to profile URL
                const profileMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([^\/\?]+)/);
                if (profileMatch) {
                    username = profileMatch[1];
                    // Normalize to x.com format
                    profileUrl = `https://x.com/${username}`;
                }
            }
        }
        catch (error) {
            console.error('[GrowOps] Error parsing URL:', error);
            // Fallback to original URL
            profileUrl = url;
            statusId = null;
            username = null;
        }
        return {
            profileUrl,
            statusId,
            username
        };
    }
    /**
     * Navigate to profile URL (parsed from any Twitter URL format)
     */
    async navigateToProfileUrl(url) {
        try {
            const parsed = this.parseTwitterUrl(url);
            await this.driver.get(parsed.profileUrl);
            await this.driver.sleep(2000);
            return {
                success: true,
                data: {
                    profileUrl: parsed.profileUrl,
                    statusId: parsed.statusId,
                    username: parsed.username
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Error navigating to profile: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Navigate to URL directly without parsing (mode 1: default)
     */
    async navigateToUrl(url, resolveVariable) {
        try {
            // Resolve variable if needed
            let finalUrl;
            if (typeof url === 'string' && url.startsWith('{{') && url.endsWith('}}') && resolveVariable) {
                const resolved = resolveVariable(url);
                finalUrl = String(resolved);
            }
            else {
                finalUrl = String(url);
            }
            if (!finalUrl) {
                return { success: false, error: 'URL not provided' };
            }
            // Navigate directly without parsing
            await this.driver.get(finalUrl);
            await this.driver.sleep(2000);
            return {
                success: true,
                data: { url: finalUrl }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Error navigating: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Navigate to URL with variable resolution and context management (mode 2: parse URL)
     * Returns parsed URL data for context updates
     */
    async navigateWithContext(url, resolveVariable) {
        try {
            // Resolve variable if needed
            let finalUrl;
            if (typeof url === 'string' && url.startsWith('{{') && url.endsWith('}}') && resolveVariable) {
                const resolved = resolveVariable(url);
                finalUrl = String(resolved);
            }
            else {
                finalUrl = String(url);
            }
            if (!finalUrl) {
                return { success: false, error: 'URL not provided' };
            }
            const parsed = this.parseTwitterUrl(finalUrl);
            const result = await this.navigateToProfileUrl(finalUrl);
            if (result.success) {
                return {
                    success: true,
                    parsed
                };
            }
            else {
                return {
                    success: false,
                    error: result.error
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Error navigating: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Follow user with status checking and context management
     * Returns follow status for context updates
     */
    async followWithStatus(options = {}) {
        try {
            // Note: This method needs ProfileOps which is not accessible here
            // This is a placeholder - actual implementation should use ProfileOps
            return {
                success: false,
                isFollowing: false,
                error: 'This method requires ProfileOps integration'
            };
        }
        catch (error) {
            return {
                success: false,
                isFollowing: false,
                error: `Error following: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Scroll to element by selector
     */
    async scrollToElement(selector, by = 'css') {
        try {
            let element;
            if (by === 'xpath') {
                element = await this.driver.findElement(selenium_webdriver_1.By.xpath(selector));
            }
            else {
                element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
            }
            if (element) {
                await this.driver.executeScript('arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });', element);
                await this.randomDelay(500, 1000);
            }
            return { success: true };
        }
        catch (error) {
            // Element not found is not an error, just continue
            return { success: true };
        }
    }
    /**
     * Extract timestamp from tweet element
     * Handles stale element errors by retrying with fresh element lookup
     * Based on actual HTML structure: <time datetime="2025-10-23T10:04:10.000Z">Oct 23</time>
     */
    async extractTweetTimestamp(tweetElement, link, maxRetries = 3) {
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Try to extract timestamp using executeScript (works better with stale elements)
                // Try multiple selectors to find time element accurately
                const timestamp = await this.driver.executeScript(`
          const tweet = arguments[0];
          try {
            // Method 1: Direct time element query (most common)
            let timeElement = tweet.querySelector('time[datetime]');
            if (timeElement) {
              const datetime = timeElement.getAttribute('datetime');
              if (datetime) {
                return new Date(datetime).toISOString();
              }
            }
            
            // Method 2: Find time element within a link containing status
            const statusLinks = tweet.querySelectorAll('a[href*="/status/"]');
            for (const link of statusLinks) {
              timeElement = link.querySelector('time[datetime]');
              if (timeElement) {
                const datetime = timeElement.getAttribute('datetime');
                if (datetime) {
                  return new Date(datetime).toISOString();
                }
              }
            }
            
            // Method 3: Find any time element in tweet
            timeElement = tweet.querySelector('time');
            if (timeElement) {
              const datetime = timeElement.getAttribute('datetime');
              if (datetime) {
                return new Date(datetime).toISOString();
              }
            }
            
            return null;
          } catch (e) {
            return null;
          }
        `, tweetElement);
                if (timestamp) {
                    try {
                        const date = new Date(timestamp);
                        // Validate the date is valid
                        if (!isNaN(date.getTime())) {
                            return date;
                        }
                    }
                    catch (parseError) {
                        // Invalid date, continue to retry
                    }
                }
                // If no timestamp found and this is not the last attempt, continue to retry
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    continue;
                }
                return null;
            }
            catch (error) {
                lastError = error;
                // Check if it's a stale element error
                const isStaleError = error.name === 'StaleElementReferenceError' ||
                    error.message?.includes('stale element') ||
                    error.message?.includes('stale element reference');
                if (isStaleError && attempt < maxRetries) {
                    // If we have a link, try to find the element again
                    if (link && attempt > 1) {
                        try {
                            // Try to find element by link using XPath
                            const statusMatch = link.match(/\/status\/(\d+)/);
                            if (statusMatch) {
                                const statusId = statusMatch[1];
                                const newElement = await this.driver.findElement(selenium_webdriver_1.By.xpath(`//a[contains(@href, '/status/${statusId}')]/ancestor::article[@data-testid='tweet']`));
                                if (newElement) {
                                    tweetElement = newElement;
                                }
                            }
                        }
                        catch (findError) {
                            // If can't find element, continue with retry
                        }
                    }
                    // Wait a bit before retry (longer delay for later attempts)
                    const delay = Math.min(100 * attempt, 500);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                // If not stale error or last attempt, break
                if (!isStaleError || attempt >= maxRetries) {
                    break;
                }
            }
        }
        // All retries failed
        if (lastError) {
            const errorMsg = lastError.name || lastError.message || 'Unknown error';
            console.log(`[GrowOps] Error extracting timestamp after ${maxRetries} attempts: ${errorMsg}`);
        }
        return null;
    }
    /**
     * Filter tweets by time (within last N hours)
     * Uses timestamp from detectedTweets if available, otherwise extracts from element
     */
    async filterTweetsByTime(tweets, timeFilterHours) {
        const cutoffTime = new Date(Date.now() - (timeFilterHours * 60 * 60 * 1000));
        const filteredTweets = [];
        for (const tweet of tweets) {
            try {
                // Use timestamp from detectedTweets if available (from scrollAndDetectTweets)
                let timestamp = null;
                if (tweet.timestamp) {
                    // Parse timestamp string from detectedTweets
                    try {
                        timestamp = new Date(tweet.timestamp);
                        if (isNaN(timestamp.getTime())) {
                            timestamp = null;
                        }
                    }
                    catch (e) {
                        timestamp = null;
                    }
                }
                // If no timestamp from detectedTweets, try to extract from element (fallback)
                if (!timestamp) {
                    timestamp = await this.extractTweetTimestamp(tweet.element, tweet.link);
                }
                if (timestamp) {
                    // Filter by time (only include tweets after cutoff time)
                    if (timestamp >= cutoffTime) {
                        filteredTweets.push({
                            element: tweet.element,
                            link: tweet.link,
                            statusId: tweet.statusId,
                            cellInnerDiv: tweet.cellInnerDiv,
                            timestamp
                        });
                    }
                }
                else {
                    // If timestamp not found, include it anyway (might be a recent tweet)
                    // This is a fallback to avoid missing tweets
                    filteredTweets.push({
                        element: tweet.element,
                        link: tweet.link,
                        statusId: tweet.statusId,
                        cellInnerDiv: tweet.cellInnerDiv,
                        timestamp: null
                    });
                }
            }
            catch (error) {
                // Log error but continue processing
                const errorMsg = error.name || error.message || 'Unknown error';
                console.log(`[GrowOps] Error filtering tweet ${tweet.statusId || 'unknown'}: ${errorMsg}`);
                // Include tweet anyway if timestamp extraction fails
                filteredTweets.push({
                    element: tweet.element,
                    link: tweet.link,
                    statusId: tweet.statusId,
                    cellInnerDiv: tweet.cellInnerDiv,
                    timestamp: null
                });
            }
        }
        return filteredTweets;
    }
    /**
     * Extract post content from tweet element
     */
    async extractPostContent(tweetElement) {
        try {
            const postContent = await this.driver.executeScript(`
        const tweet = arguments[0];
        // Find the tweet text element
        const textElement = tweet.querySelector('[data-testid="tweetText"]');
        if (textElement) {
          return textElement.innerText || textElement.textContent || '';
        }
        // Fallback: try to get text from article
        const article = tweet.closest('article');
        if (article) {
          const spans = article.querySelectorAll('span');
          let text = '';
          spans.forEach(span => {
            const spanText = span.innerText || span.textContent || '';
            if (spanText.length > 10 && !spanText.includes('@') && !spanText.startsWith('http')) {
              text += spanText + ' ';
            }
          });
          return text.trim();
        }
        return '';
      `, tweetElement);
            return postContent && postContent.trim().length > 0 ? postContent.trim() : null;
        }
        catch (error) {
            console.error('[GrowOps] Error extracting post content:', error);
            return null;
        }
    }
    /**
     * Scroll to tweet element
     */
    async scrollToTweet(cellInnerDiv) {
        try {
            await this.driver.executeScript('arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });', cellInnerDiv);
            await this.randomDelay(2000, 3000);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: `Error scrolling to tweet: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Extract status ID from various sources (params, context, URL)
     */
    extractStatusId(options) {
        const { params, context } = options;
        // Priority 1: Explicit parameter
        if (params?.target_status_id !== undefined || params?.targetStatusId !== undefined) {
            return params.target_status_id || params.targetStatusId || null;
        }
        // Priority 2: Context
        if (context?.target_status_id !== undefined) {
            return context.target_status_id;
        }
        // Priority 3: Extract from current_link
        if (context?.current_link) {
            const match = context.current_link.match(/\/(?:status|statuses)\/(\d+)/);
            return match ? match[1] : null;
        }
        return null;
    }
}
exports.GrowOps = GrowOps;
