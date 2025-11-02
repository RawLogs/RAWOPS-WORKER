"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeOps = void 0;
const selenium_webdriver_1 = require("selenium-webdriver");
const base_1 = require("./base");
class LikeOps extends base_1.BaseOps {
    constructor(driver) {
        super(driver);
    }
    /**
     * Like a tweet by targeting the first tweet on the page with anti-detection
     */
    async likeFirstTweet(options = {}) {
        try {
            const { useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium', hoverDuration = 300, clickDelay = 200, includeHover = true } = options;
            // Legacy selectors from xaicommentService.js with comprehensive fallback
            const likeSelectors = [
                // XPath selectors
                '//article[@data-testid="tweet"][1]//button[@data-testid="like"]',
                '//article[@data-testid="tweet"]//div[@role="group"]//button[@data-testid="like"]',
                '//article[@data-testid="tweet"][1]//*[@data-testid="like"]',
                '//article[@data-testid="tweet"][1]//button[@aria-label="Like"]',
                '//article[@data-testid="tweet"][1]//button[@aria-label*="like"]',
                '//article[@data-testid="tweet"][1]//button[@aria-label*="Thích"]',
                '//article[@data-testid="tweet"]//span[text()="Like"]/ancestor::button[1]',
                // CSS selectors
                'article[data-testid="tweet"]:first-child [data-testid="like"]',
                'article[data-testid="tweet"]:first-child button[aria-label*="like" i]',
                'article[data-testid="tweet"]:first-child button[aria-label*="Thích" i]',
                'article[data-testid="tweet"]:first-child div[role="button"][aria-label*="like" i]',
                '[data-testid="tweet"]:first-child [data-testid="like"]',
                '[data-testid="tweet"]:first-child button[aria-label*="like" i]',
                '[data-testid="tweet"]:first-child button[aria-label*="Thích" i]',
                '[data-testid="tweet"]:first-child div[role="button"][aria-label*="like" i]'
            ];
            // Try xpath first for like button
            try {
                const likeElement = await this.driver.findElement(selenium_webdriver_1.By.xpath(likeSelectors[0]));
                // Scroll to element first to ensure it's visible
                await this.driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", likeElement);
                await this.randomDelay(1000, 2000);
                if (useAntiDetection) {
                    const clickSuccess = await this.antiDetection.clickWithMouseMovement(likeElement, {
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
                        return { success: true, data: { selector: likeSelectors[0], antiDetection: true } };
                    }
                }
                else {
                    await likeElement.click();
                    await this.randomDelay(2000, 3000);
                    return { success: true, data: { selector: likeSelectors[0], antiDetection: false } };
                }
            }
            catch (xpathError) {
                // Try remaining XPath selectors
                for (let i = 1; i < 7; i++) { // XPath selectors are indices 0-6
                    try {
                        const element = await this.driver.findElement(selenium_webdriver_1.By.xpath(likeSelectors[i]));
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
                                await this.randomDelay(2000, 3000);
                                return { success: true, data: { selector: likeSelectors[i], antiDetection: true } };
                            }
                        }
                        else {
                            await element.click();
                            await this.randomDelay(2000, 3000);
                            return { success: true, data: { selector: likeSelectors[i], antiDetection: false } };
                        }
                    }
                    catch (error) {
                        continue;
                    }
                }
                // Try CSS selectors if XPath failed
                for (const selector of likeSelectors.slice(7)) { // CSS selectors start from index 7
                    try {
                        const element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
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
                                await this.randomDelay(2000, 3000);
                                return { success: true, data: { selector, antiDetection: true } };
                            }
                        }
                        else {
                            await element.click();
                            await this.randomDelay(2000, 3000);
                            return { success: true, data: { selector, antiDetection: false } };
                        }
                    }
                    catch (error) {
                        continue;
                    }
                }
            }
            return { success: false, error: 'Could not find like button' };
        }
        catch (error) {
            return { success: false, error: `Error liking tweet: ${error}` };
        }
    }
    /**
     * Like a specific tweet by its element with anti-detection
     */
    async likeTweetByElement(tweetElement, options = {}) {
        try {
            const { useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium', hoverDuration = 300, clickDelay = 200, includeHover = true } = options;
            const likeButton = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="like"]'));
            if (await likeButton.isDisplayed()) {
                await this.driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", likeButton);
                await this.randomDelay(1000, 2000);
                if (useAntiDetection) {
                    // Use anti-detection click with mouse movement
                    const clickSuccess = await this.antiDetection.clickWithMouseMovement(likeButton, {
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
                        return { success: true, data: { antiDetection: true } };
                    }
                }
                else {
                    // Legacy click without anti-detection
                    await likeButton.click();
                    await this.randomDelay(2000, 3000);
                    return { success: true, data: { antiDetection: false } };
                }
            }
            return { success: false, error: 'Like button not visible' };
        }
        catch (error) {
            return { success: false, error: `Error liking tweet by element: ${error}` };
        }
    }
    /**
     * Check if a tweet is already liked
     */
    async isTweetLiked() {
        try {
            const likedSelector = 'article[data-testid="tweet"]:first-child [data-testid="like"][aria-pressed="true"]';
            const element = await this.driver.findElement(selenium_webdriver_1.By.css(likedSelector));
            return element !== null;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Unlike a tweet if it's currently liked with anti-detection
     */
    async unlikeFirstTweet(options = {}) {
        try {
            const isLiked = await this.isTweetLiked();
            if (!isLiked) {
                return { success: true, data: { message: 'Tweet was not liked' } };
            }
            // Click the like button again to unlike with anti-detection
            const result = await this.likeFirstTweet(options);
            return result;
        }
        catch (error) {
            return { success: false, error: `Error unliking tweet: ${error}` };
        }
    }
}
exports.LikeOps = LikeOps;
