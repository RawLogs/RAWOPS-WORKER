"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngagementOps = void 0;
const selenium_webdriver_1 = require("selenium-webdriver");
const base_1 = require("./base");
class EngagementOps extends base_1.BaseOps {
    constructor(driver) {
        super(driver);
    }
    /**
     * Retweet the first tweet on the page with anti-detection
     */
    async retweetFirstTweet(options = {}) {
        try {
            const { useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium', hoverDuration = 300, clickDelay = 200, includeHover = true } = options;
            const retweetSelectors = [
                'article[data-testid="tweet"]:first-child [data-testid="retweet"]',
                'article[data-testid="tweet"]:first-child button[aria-label*="Retweet" i]',
                'article[data-testid="tweet"]:first-child button[aria-label*="Repost" i]'
            ];
            for (const selector of retweetSelectors) {
                try {
                    const element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                    // Scroll to element
                    await this.driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element);
                    await this.randomDelay(1000, 2000);
                    if (useAntiDetection) {
                        // Use anti-detection click with mouse movement
                        const clickSuccess = await this.antiDetection.clickWithMouseMovement(element, {
                            hoverDuration,
                            clickDelay,
                            includeHover,
                            pattern: behavioralPattern,
                            intensity: mouseIntensity,
                            includeMicroMovements: true,
                            includePauses: true
                        });
                        if (clickSuccess) {
                            await this.randomDelay(2000, 3000);
                            // Check if retweet modal opened
                            const retweetModal = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="retweetConfirm"]'));
                            if (retweetModal.length > 0) {
                                // Click confirm retweet button with anti-detection
                                const confirmButton = await this.driver.findElement(selenium_webdriver_1.By.css('[data-testid="retweetConfirm"]'));
                                const confirmSuccess = await this.antiDetection.clickWithMouseMovement(confirmButton, {
                                    hoverDuration,
                                    clickDelay,
                                    includeHover,
                                    pattern: behavioralPattern,
                                    intensity: mouseIntensity,
                                    includeMicroMovements: true,
                                    includePauses: true
                                });
                                if (confirmSuccess) {
                                    await this.randomDelay(2000, 3000);
                                }
                            }
                            return { success: true, data: { selector, antiDetection: true } };
                        }
                    }
                    else {
                        // Legacy click without anti-detection
                        await element.click();
                        await this.randomDelay(2000, 3000);
                        // Check if retweet modal opened
                        const retweetModal = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="retweetConfirm"]'));
                        if (retweetModal.length > 0) {
                            // Click confirm retweet button
                            const confirmButton = await this.driver.findElement(selenium_webdriver_1.By.css('[data-testid="retweetConfirm"]'));
                            await confirmButton.click();
                            await this.randomDelay(2000, 3000);
                        }
                        return { success: true, data: { selector, antiDetection: false } };
                    }
                }
                catch (error) {
                    continue; // Try next selector
                }
            }
            return { success: false, error: 'Could not find retweet button' };
        }
        catch (error) {
            return { success: false, error: `Error retweeting: ${error}` };
        }
    }
    /**
     * Bookmark the first tweet on the page with anti-detection
     */
    async bookmarkFirstTweet(options = {}) {
        try {
            const { useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium', hoverDuration = 300, clickDelay = 200, includeHover = true } = options;
            const bookmarkSelectors = [
                'article[data-testid="tweet"]:first-child [data-testid="bookmark"]',
                'article[data-testid="tweet"]:first-child button[aria-label*="Bookmark" i]',
                'article[data-testid="tweet"]:first-child button[aria-label*="Save" i]'
            ];
            for (const selector of bookmarkSelectors) {
                try {
                    const element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                    // Scroll to element
                    await this.driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element);
                    await this.randomDelay(1000, 2000);
                    if (useAntiDetection) {
                        // Use anti-detection click with mouse movement
                        const clickSuccess = await this.antiDetection.clickWithMouseMovement(element, {
                            hoverDuration,
                            clickDelay,
                            includeHover,
                            pattern: behavioralPattern,
                            intensity: mouseIntensity,
                            includeMicroMovements: true,
                            includePauses: true
                        });
                        if (clickSuccess) {
                            await this.randomDelay(2000, 3000);
                            return { success: true, data: { selector, antiDetection: true } };
                        }
                    }
                    else {
                        // Legacy click without anti-detection
                        await element.click();
                        await this.randomDelay(2000, 3000);
                        return { success: true, data: { selector, antiDetection: false } };
                    }
                }
                catch (error) {
                    continue; // Try next selector
                }
            }
            return { success: false, error: 'Could not find bookmark button' };
        }
        catch (error) {
            return { success: false, error: `Error bookmarking: ${error}` };
        }
    }
    /**
     * Share the first tweet on the page
     */
    async shareFirstTweet() {
        try {
            const shareSelectors = [
                'article[data-testid="tweet"]:first-child [data-testid="share"]',
                'article[data-testid="tweet"]:first-child button[aria-label*="Share" i]'
            ];
            for (const selector of shareSelectors) {
                try {
                    const element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                    // Scroll to element
                    await this.driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element);
                    await this.randomDelay(1000, 2000);
                    await element.click();
                    await this.randomDelay(2000, 3000);
                    return { success: true, data: { selector } };
                }
                catch (error) {
                    continue; // Try next selector
                }
            }
            return { success: false, error: 'Could not find share button' };
        }
        catch (error) {
            return { success: false, error: `Error sharing: ${error}` };
        }
    }
    /**
     * Follow a user from their profile with anti-detection
     */
    async followUser(options = {}) {
        try {
            const { useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium', hoverDuration = 300, clickDelay = 200, includeHover = true } = options;
            const followSelectors = [
                '[data-testid="follow"]',
                'button[aria-label*="Follow" i]',
                'button:has-text("Follow")'
            ];
            for (const selector of followSelectors) {
                try {
                    const element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                    if (await element.isDisplayed()) {
                        if (useAntiDetection) {
                            // Use anti-detection click with mouse movement
                            const clickSuccess = await this.antiDetection.clickWithMouseMovement(element, {
                                hoverDuration,
                                clickDelay,
                                includeHover,
                                pattern: behavioralPattern,
                                intensity: mouseIntensity,
                                includeMicroMovements: true,
                                includePauses: true
                            });
                            if (clickSuccess) {
                                await this.randomDelay(2000, 3000);
                                return { success: true, data: { selector, antiDetection: true } };
                            }
                        }
                        else {
                            // Legacy click without anti-detection
                            await element.click();
                            await this.randomDelay(2000, 3000);
                            return { success: true, data: { selector, antiDetection: false } };
                        }
                    }
                }
                catch (error) {
                    continue; // Try next selector
                }
            }
            return { success: false, error: 'Could not find follow button' };
        }
        catch (error) {
            return { success: false, error: `Error following user: ${error}` };
        }
    }
    /**
     * Unfollow a user
     */
    async unfollowUser() {
        try {
            const unfollowSelectors = [
                '[data-testid="unfollow"]',
                'button[aria-label*="Unfollow" i]',
                'button:has-text("Unfollow")'
            ];
            for (const selector of unfollowSelectors) {
                try {
                    const element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                    if (await element.isDisplayed()) {
                        await element.click();
                        await this.randomDelay(2000, 3000);
                        // Confirm unfollow if modal appears
                        const confirmModal = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="confirmationSheetConfirm"]'));
                        if (confirmModal.length > 0) {
                            const confirmButton = await this.driver.findElement(selenium_webdriver_1.By.css('[data-testid="confirmationSheetConfirm"]'));
                            await confirmButton.click();
                            await this.randomDelay(2000, 3000);
                        }
                        return { success: true, data: { selector } };
                    }
                }
                catch (error) {
                    continue; // Try next selector
                }
            }
            return { success: false, error: 'Could not find unfollow button' };
        }
        catch (error) {
            return { success: false, error: `Error unfollowing user: ${error}` };
        }
    }
    /**
     * Check if user is already followed
     */
    async isUserFollowed() {
        try {
            const unfollowButton = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="unfollow"]'));
            return unfollowButton.length > 0;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get engagement stats for first tweet
     */
    async getTweetEngagement() {
        try {
            const tweet = await this.driver.findElement(selenium_webdriver_1.By.css('article[data-testid="tweet"]:first-child'));
            const engagement = await this.driver.executeScript(`
        const tweet = arguments[0];
        
        const getCount = (selector) => {
          const element = tweet.querySelector(selector);
          if (!element) return 0;
          const text = element.textContent || '';
          const match = text.match(/[0-9,]+/);
          return match ? parseInt(match[0].replace(/,/g, '')) : 0;
        };
        
        return {
          likes: getCount('[data-testid="like"]'),
          retweets: getCount('[data-testid="retweet"]'),
          replies: getCount('[data-testid="reply"]'),
          bookmarks: getCount('[data-testid="bookmark"]')
        };
      `, tweet);
            return { success: true, data: { engagement } };
        }
        catch (error) {
            return { success: false, error: `Error getting engagement stats: ${error}` };
        }
    }
}
exports.EngagementOps = EngagementOps;
