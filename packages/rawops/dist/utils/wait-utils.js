"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomDelay = randomDelay;
exports.waitForElement = waitForElement;
exports.waitForNetworkIdle = waitForNetworkIdle;
exports.waitForPageLoad = waitForPageLoad;
exports.waitForElementVisible = waitForElementVisible;
exports.waitForElementClickable = waitForElementClickable;
exports.waitForTextInElement = waitForTextInElement;
exports.waitForUrlChange = waitForUrlChange;
exports.waitForConditions = waitForConditions;
exports.smartWait = smartWait;
const selenium_webdriver_1 = require("selenium-webdriver");
/**
 * Random delay function with customizable range
 */
async function randomDelay(minMs = 1000, maxMs = 3000) {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
}
/**
 * Wait for element to be present
 */
async function waitForElement(driver, selector, timeout = 10000) {
    try {
        await driver.sleep(1000);
        return await driver.findElement(selenium_webdriver_1.By.css(selector));
    }
    catch (error) {
        console.log(`Element not found within timeout: ${selector}`);
        throw error;
    }
}
/**
 * Wait for network idle state
 */
async function waitForNetworkIdle(driver, timeout = 10000) {
    try {
        await driver.executeScript(`
      return new Promise((resolve) => {
        let timeoutId = setTimeout(resolve, ${timeout});
        
        const checkNetworkIdle = () => {
          if (performance.getEntriesByType('navigation').length > 0) {
            const lastNavigation = performance.getEntriesByType('navigation')[0];
            if (performance.now() - lastNavigation.startTime > 1000) {
              clearTimeout(timeoutId);
              resolve();
            }
          }
        };
        
        setInterval(checkNetworkIdle, 100);
      });
    `);
    }
    catch (error) {
        // Fallback to simple wait
        await driver.sleep(2000);
    }
}
/**
 * Wait for page to be fully loaded
 */
async function waitForPageLoad(driver, timeout = 30000) {
    try {
        await driver.wait(async () => {
            const readyState = await driver.executeScript('return document.readyState');
            return readyState === 'complete';
        }, timeout);
    }
    catch (error) {
        console.log('Page load timeout, continuing...');
    }
}
/**
 * Wait for element to be visible
 */
async function waitForElementVisible(driver, selector, timeout = 10000) {
    try {
        const element = await driver.findElement(selenium_webdriver_1.By.css(selector));
        await driver.wait(async () => {
            return await element.isDisplayed();
        }, timeout);
        return element;
    }
    catch (error) {
        console.log(`Element not visible within timeout: ${selector}`);
        throw error;
    }
}
/**
 * Wait for element to be clickable
 */
async function waitForElementClickable(driver, selector, timeout = 10000) {
    try {
        const element = await driver.findElement(selenium_webdriver_1.By.css(selector));
        await driver.wait(async () => {
            return await element.isDisplayed() && await element.isEnabled();
        }, timeout);
        return element;
    }
    catch (error) {
        console.log(`Element not clickable within timeout: ${selector}`);
        throw error;
    }
}
/**
 * Wait for text to be present in element
 */
async function waitForTextInElement(driver, selector, expectedText, timeout = 10000) {
    try {
        await driver.wait(async () => {
            const element = await driver.findElement(selenium_webdriver_1.By.css(selector));
            const text = await element.getText();
            return text.includes(expectedText);
        }, timeout);
    }
    catch (error) {
        console.log(`Text "${expectedText}" not found in element ${selector} within timeout`);
        throw error;
    }
}
/**
 * Wait for URL to change
 */
async function waitForUrlChange(driver, currentUrl, timeout = 10000) {
    try {
        await driver.wait(async () => {
            const newUrl = await driver.getCurrentUrl();
            return newUrl !== currentUrl;
        }, timeout);
    }
    catch (error) {
        console.log('URL did not change within timeout');
        throw error;
    }
}
/**
 * Wait for multiple conditions
 */
async function waitForConditions(driver, options) {
    if (options.waitForNetworkIdle) {
        await waitForNetworkIdle(driver, options.timeout);
    }
    if (options.waitForElement) {
        await waitForElement(driver, options.waitForElement, options.timeout);
    }
    // Default wait if no specific conditions
    if (!options.waitForNetworkIdle && !options.waitForElement) {
        await driver.sleep(options.timeout || 2000);
    }
}
/**
 * Smart wait that adapts based on page state
 */
async function smartWait(driver, timeout = 5000) {
    try {
        // Check if page is still loading
        const isLoading = await driver.executeScript(`
      return document.readyState !== 'complete' || 
             document.querySelectorAll('[data-testid="loading"]').length > 0 ||
             document.querySelectorAll('.loading').length > 0;
    `);
        if (isLoading) {
            await waitForPageLoad(driver, timeout);
        }
        else {
            await randomDelay(500, 1500);
        }
    }
    catch (error) {
        // Fallback to random delay
        await randomDelay(1000, 2000);
    }
}
