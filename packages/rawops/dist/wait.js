"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitOps = void 0;
const selenium_webdriver_1 = require("selenium-webdriver");
const base_1 = require("./base");
class WaitOps extends base_1.BaseOps {
    constructor(driver) {
        super(driver);
    }
    /**
     * Wait for network to be idle
     */
    async waitForNetworkIdle(timeout = 5000) {
        try {
            await this.waitForStability({ timeout, waitForNetworkIdle: true });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error waiting for network idle: ${error}` };
        }
    }
    /**
     * Wait for element to be visible and stable
     */
    async waitForElementStable(selector, timeout = 10000) {
        try {
            await this.driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css(selector)), timeout);
            const element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
            await this.driver.wait(selenium_webdriver_1.until.elementIsVisible(element), timeout);
            // Wait for element to be stable (no animations)
            await this.driver.wait(async () => {
                const rect = await this.driver.executeScript(`
          const element = document.querySelector('${selector}');
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        `);
                return rect;
            }, 5000);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error waiting for element stable: ${error}` };
        }
    }
    /**
     * Wait for text to appear
     */
    async waitForText(text, timeout = 10000) {
        try {
            await this.driver.wait(async () => {
                const bodyText = await this.driver.executeScript('return document.body.textContent;');
                return bodyText?.includes(text) || false;
            }, timeout);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error waiting for text: ${error}` };
        }
    }
    /**
     * Wait for page to be fully loaded
     */
    async waitForPageLoad(timeout = 30000) {
        try {
            await this.driver.wait(async () => {
                return await this.driver.executeScript('return document.readyState === "complete";');
            }, timeout);
            await this.waitForStability({ timeout: 10000, waitForNetworkIdle: true });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error waiting for page load: ${error}` };
        }
    }
    /**
     * Wait for tweets to load
     */
    async waitForTweetsToLoad(timeout = 15000) {
        try {
            await this.driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('[data-testid="tweet"]')), timeout);
            // Wait for at least one tweet to be fully rendered
            await this.driver.wait(async () => {
                const tweetHeight = await this.driver.executeScript(`
          const tweets = document.querySelectorAll('[data-testid="tweet"]');
          return tweets.length > 0 && tweets[0].getBoundingClientRect().height > 0;
        `);
                return tweetHeight;
            }, 5000);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error waiting for tweets to load: ${error}` };
        }
    }
    /**
     * Wait for specific number of tweets
     */
    async waitForTweetCount(count, timeout = 20000) {
        try {
            await this.driver.wait(async () => {
                const tweetCount = await this.driver.executeScript(`
          return document.querySelectorAll('[data-testid="tweet"]').length;
        `);
                return tweetCount >= count;
            }, timeout);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error waiting for tweet count: ${error}` };
        }
    }
    /**
     * Wait for element to disappear
     */
    async waitForElementToDisappear(selector, timeout = 10000) {
        try {
            await this.driver.wait(async () => {
                const isVisible = await this.driver.executeScript(`
          const element = document.querySelector('${selector}');
          return !element || element.offsetParent === null;
        `);
                return isVisible;
            }, timeout);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error waiting for element to disappear: ${error}` };
        }
    }
    /**
     * Wait for URL to change
     */
    async waitForUrlChange(currentUrl, timeout = 10000) {
        try {
            await this.driver.wait(async () => {
                const currentPageUrl = await this.driver.getCurrentUrl();
                return currentPageUrl !== currentUrl;
            }, timeout);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error waiting for URL change: ${error}` };
        }
    }
    /**
     * Wait for specific condition
     */
    async waitForCondition(condition, timeout = 10000, interval = 100) {
        try {
            const startTime = Date.now();
            while (Date.now() - startTime < timeout) {
                const result = await condition();
                if (result) {
                    return { success: true };
                }
                await this.driver.sleep(interval);
            }
            return { success: false, error: 'Condition timeout' };
        }
        catch (error) {
            return { success: false, error: `Error waiting for condition: ${error}` };
        }
    }
    /**
     * Wait for random time (human-like behavior)
     */
    async waitRandom(min = 1000, max = 3000) {
        try {
            const delay = Math.floor(Math.random() * (max - min)) + min;
            await this.driver.sleep(delay);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error waiting random time: ${error}` };
        }
    }
    /**
     * Wait for element to be clickable
     */
    async waitForClickable(selector, timeout = 10000) {
        try {
            await this.driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css(selector)), timeout);
            const element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
            await this.driver.wait(selenium_webdriver_1.until.elementIsVisible(element), timeout);
            await this.driver.wait(async () => {
                const isClickable = await this.driver.executeScript(`
          const element = document.querySelector('${selector}');
          if (!element) return false;
          
          const rect = element.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          const isEnabled = !element.hasAttribute('disabled') && 
                           element.getAttribute('aria-disabled') !== 'true';
          
          return isVisible && isEnabled;
        `);
                return isClickable;
            }, 5000);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error waiting for clickable element: ${error}` };
        }
    }
    /**
     * Wait for form to be ready
     */
    async waitForFormReady(formSelector = 'form', timeout = 10000) {
        try {
            await this.driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css(formSelector)), timeout);
            // Wait for form inputs to be ready
            await this.driver.wait(async () => {
                const hasInputs = await this.driver.executeScript(`
          const form = document.querySelector('${formSelector}');
          if (!form) return false;
          
          const inputs = form.querySelectorAll('input, textarea, select');
          return inputs.length > 0;
        `);
                return hasInputs;
            }, 5000);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error waiting for form ready: ${error}` };
        }
    }
}
exports.WaitOps = WaitOps;
