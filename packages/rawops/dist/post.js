"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostOps = void 0;
const selenium_webdriver_1 = require("selenium-webdriver");
const base_1 = require("./base");
class PostOps extends base_1.BaseOps {
    constructor(driver) {
        super(driver);
    }
    /**
     * Post a direct tweet with anti-detection
     */
    async postTweet(options) {
        try {
            const { content, scheduleTime, replyToTweetId, useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium', hoverDuration = 300, clickDelay = 200, includeHover = true } = options;
            // Navigate to compose page
            await this.driver.get('https://x.com/compose/post');
            await this.randomDelay(3000, 5000);
            // Find tweet input
            const tweetInputSelectors = [
                '[data-testid="tweetTextarea_0"]',
                '[aria-label="Post text"]',
                '[placeholder="What\'s happening?"]',
                '[data-testid*="tweetTextarea"]'
            ];
            let inputFound = false;
            for (const selector of tweetInputSelectors) {
                try {
                    const element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
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
                            inputFound = true;
                            break;
                        }
                    }
                    else {
                        // Legacy click without anti-detection
                        await element.click();
                        inputFound = true;
                        break;
                    }
                }
                catch (error) {
                    continue;
                }
            }
            if (!inputFound) {
                return { success: false, error: 'Could not find tweet input' };
            }
            await this.randomDelay(1000, 2000);
            // Type content character by character
            const typeSuccess = await this.typeCharacterByCharacter('[data-testid="tweetTextarea_0"]', content);
            if (!typeSuccess) {
                return { success: false, error: 'Failed to type tweet content' };
            }
            await this.randomDelay(2000, 3000);
            // Submit tweet with anti-detection
            const submitResult = await this.submitTweet({
                useAntiDetection,
                behavioralPattern,
                mouseIntensity,
                hoverDuration,
                clickDelay,
                includeHover
            });
            if (!submitResult.success) {
                return submitResult;
            }
            return { success: true, data: { content, antiDetection: useAntiDetection } };
        }
        catch (error) {
            return { success: false, error: `Error posting tweet: ${error}` };
        }
    }
    /**
     * Post a quote tweet
     */
    async postQuoteTweet(originalTweetUrl, quoteContent) {
        try {
            // Navigate to the original tweet
            await this.driver.get(originalTweetUrl);
            await this.randomDelay(3000, 5000);
            // Find and click quote tweet button
            const quoteButtonSelectors = [
                '[data-testid="retweet"]',
                'button[aria-label*="Quote" i]',
                'button[aria-label*="Quote Tweet" i]'
            ];
            let quoteButtonFound = false;
            for (const selector of quoteButtonSelectors) {
                try {
                    const element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                    await element.click();
                    quoteButtonFound = true;
                    break;
                }
                catch (error) {
                    continue;
                }
            }
            if (!quoteButtonFound) {
                return { success: false, error: 'Could not find quote tweet button' };
            }
            await this.randomDelay(2000, 3000);
            // Find quote tweet input
            const quoteInputSelectors = [
                '[data-testid="tweetTextarea_0"]',
                '[aria-label="Post text"]'
            ];
            let inputFound = false;
            for (const selector of quoteInputSelectors) {
                try {
                    const element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                    await element.click();
                    inputFound = true;
                    break;
                }
                catch (error) {
                    continue;
                }
            }
            if (!inputFound) {
                return { success: false, error: 'Could not find quote tweet input' };
            }
            await this.randomDelay(1000, 2000);
            // Type quote content
            const typeSuccess = await this.typeCharacterByCharacter('[data-testid="tweetTextarea_0"]', quoteContent);
            if (!typeSuccess) {
                return { success: false, error: 'Failed to type quote content' };
            }
            await this.randomDelay(2000, 3000);
            // Submit quote tweet
            const submitResult = await this.submitTweet();
            if (!submitResult.success) {
                return submitResult;
            }
            return { success: true, data: { originalTweetUrl, quoteContent } };
        }
        catch (error) {
            return { success: false, error: `Error posting quote tweet: ${error}` };
        }
    }
    /**
     * Schedule a tweet for later posting
     */
    async scheduleTweet(options) {
        try {
            const { content, scheduleTime } = options;
            if (!scheduleTime) {
                return { success: false, error: 'Schedule time is required' };
            }
            // Navigate to compose page
            await this.driver.get('https://x.com/compose/post');
            await this.randomDelay(3000, 5000);
            // Type content
            const typeSuccess = await this.typeCharacterByCharacter('[data-testid="tweetTextarea_0"]', content);
            if (!typeSuccess) {
                return { success: false, error: 'Failed to type tweet content' };
            }
            await this.randomDelay(2000, 3000);
            // Find schedule button
            const scheduleButtonSelectors = [
                '[data-testid="scheduleButton"]',
                'button[aria-label*="Schedule" i]',
                'button:has-text("Schedule")'
            ];
            let scheduleButtonFound = false;
            for (const selector of scheduleButtonSelectors) {
                try {
                    const element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                    await element.click();
                    scheduleButtonFound = true;
                    break;
                }
                catch (error) {
                    continue;
                }
            }
            if (!scheduleButtonFound) {
                return { success: false, error: 'Could not find schedule button' };
            }
            await this.randomDelay(2000, 3000);
            // Set schedule time (implementation depends on Twitter's schedule UI)
            // This is a simplified version - actual implementation would need to handle the date/time picker
            return { success: true, data: { content, scheduleTime } };
        }
        catch (error) {
            return { success: false, error: `Error scheduling tweet: ${error}` };
        }
    }
    /**
     * Submit tweet with retry logic and anti-detection
     */
    async submitTweet(options = {}) {
        const { useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium', hoverDuration = 300, clickDelay = 200, includeHover = true } = options;
        const submitButtonSelectors = [
            '[data-testid="tweetButton"]',
            '[data-testid="tweetButtonInline"]',
            'button[aria-label*="Post" i]',
            'button[aria-label*="Tweet" i]'
        ];
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                // Scroll to make sure submit button is visible
                await this.driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
                await this.randomDelay(1000, 2000);
                for (const selector of submitButtonSelectors) {
                    try {
                        const element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                        // Check if button is enabled
                        const isDisabled = await this.driver.executeScript((sel) => {
                            const element = document.querySelector(sel);
                            return element?.getAttribute('disabled') === 'true' ||
                                element?.getAttribute('aria-disabled') === 'true';
                        }, selector);
                        if (isDisabled) {
                            continue; // Try next selector
                        }
                        // Try to click with anti-detection
                        if (useAntiDetection) {
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
                                await this.randomDelay(3000, 5000);
                                return { success: true, data: { antiDetection: true } };
                            }
                        }
                        else {
                            // Legacy click without anti-detection
                            await element.click();
                            await this.randomDelay(3000, 5000);
                            return { success: true, data: { antiDetection: false } };
                        }
                    }
                    catch (error) {
                        continue; // Try next selector
                    }
                }
                if (attempt < 3) {
                    await this.randomDelay(1000, 2000);
                }
            }
            catch (error) {
                if (attempt === 3) {
                    return { success: false, error: `Failed to submit tweet after 3 attempts: ${error}` };
                }
            }
        }
        return { success: false, error: 'All submit attempts failed' };
    }
}
exports.PostOps = PostOps;
