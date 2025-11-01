"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorDriver = void 0;
exports.extractErrorDetails = extractErrorDetails;
exports.hasPageError = hasPageError;
const selenium_webdriver_1 = require("selenium-webdriver");
/**
 * Error Driver for extracting error details from Twitter/X pages
 * Handles various error scenarios and extracts meaningful error information
 */
class ErrorDriver {
    constructor(driver, options = {}) {
        this.driver = driver;
        this.options = {
            timeout: 5000,
            retries: 2,
            ...options
        };
    }
    /**
     * Extract error details from the current page
     * Checks for data-testid="error-detail" and other error indicators
     */
    async extractErrorDetails() {
        try {
            // Check for main error detail element
            const errorDetail = await this.checkErrorDetailElement();
            if (errorDetail) {
                return errorDetail;
            }
            // Check for other common error patterns
            const commonError = await this.checkCommonErrorPatterns();
            if (commonError) {
                return commonError;
            }
            // Check page title for error indicators
            const titleError = await this.checkPageTitleForErrors();
            if (titleError) {
                return titleError;
            }
            return null;
        }
        catch (error) {
            console.error('[ErrorDriver] Error extracting error details:', error);
            return {
                type: 'unknown',
                message: 'Failed to extract error details',
                originalText: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * Check for error elements in various locations
     */
    async checkErrorDetailElement() {
        try {
            // Check for data-testid="error-detail" element first
            try {
                const errorElement = await this.driver.findElement(selenium_webdriver_1.By.css('[data-testid="error-detail"]'));
                const errorText = await errorElement.getText();
                if (errorText) {
                    const errorType = this.classifyErrorType(errorText);
                    return {
                        type: errorType,
                        message: this.extractErrorMessage(errorText),
                        originalText: errorText,
                        timestamp: new Date().toISOString()
                    };
                }
            }
            catch (error) {
                // data-testid="error-detail" not found, continue
            }
            // Check for error messages in article elements (like suspended account posts)
            try {
                const articleElements = await this.driver.findElements(selenium_webdriver_1.By.css('article[role="article"]'));
                for (const article of articleElements) {
                    const articleText = await article.getText();
                    if (articleText && this.containsErrorText(articleText)) {
                        const errorType = this.classifyErrorType(articleText);
                        return {
                            type: errorType,
                            message: this.extractErrorMessage(articleText),
                            originalText: articleText,
                            timestamp: new Date().toISOString()
                        };
                    }
                }
            }
            catch (error) {
                // Article elements not found or error, continue
            }
            // Check for error messages in any div with specific classes
            try {
                const errorDivs = await this.driver.findElements(selenium_webdriver_1.By.css('div[class*="css-146c3p1"]'));
                for (const div of errorDivs) {
                    const divText = await div.getText();
                    if (divText && this.containsErrorText(divText)) {
                        const errorType = this.classifyErrorType(divText);
                        return {
                            type: errorType,
                            message: this.extractErrorMessage(divText),
                            originalText: divText,
                            timestamp: new Date().toISOString()
                        };
                    }
                }
            }
            catch (error) {
                // Error divs not found or error, continue
            }
        }
        catch (error) {
            // General error, continue to other checks
        }
        return null;
    }
    /**
     * Check if text contains error indicators
     */
    containsErrorText(text) {
        const lowerText = text.toLowerCase();
        const errorIndicators = [
            'this post is from a suspended account',
            'this account has been suspended',
            'this account doesn\'t exist',
            'this tweet is unavailable',
            'hmm...this page doesn\'t exist'
        ];
        return errorIndicators.some(indicator => lowerText.includes(indicator));
    }
    /**
     * Check for common error patterns on Twitter/X using improved selectors
     */
    async checkCommonErrorPatterns() {
        try {
            // Use more flexible XPath selectors to find error text anywhere on the page
            const errorPatterns = [
                {
                    xpath: "//*[contains(text(), 'This account doesn't exist')]",
                    type: 'page_not_found',
                    message: 'Account does not exist'
                },
                {
                    xpath: "//*[contains(text(), 'This account has been suspended')]",
                    type: 'account_suspended',
                    message: 'Account has been suspended'
                },
                {
                    xpath: "//*[contains(text(), 'This Post is from a suspended account')]",
                    type: 'account_suspended',
                    message: 'Post from suspended account'
                },
                {
                    xpath: "//*[contains(text(), 'This Tweet is unavailable')]",
                    type: 'tweet_unavailable',
                    message: 'Tweet is unavailable'
                },
                {
                    xpath: "//*[contains(text(), 'Hmm...this page doesn')]",
                    type: 'page_not_found',
                    message: 'Page does not exist'
                }
            ];
            for (const pattern of errorPatterns) {
                try {
                    const elements = await this.driver.findElements(selenium_webdriver_1.By.xpath(pattern.xpath));
                    if (elements.length > 0) {
                        const text = await elements[0].getText();
                        return {
                            type: pattern.type,
                            message: pattern.message,
                            originalText: text,
                            timestamp: new Date().toISOString()
                        };
                    }
                }
                catch (error) {
                    // Continue to next pattern
                }
            }
        }
        catch (error) {
            // Continue to other checks
        }
        return null;
    }
    /**
     * Check page title for error indicators
     */
    async checkPageTitleForErrors() {
        try {
            const title = await this.driver.getTitle();
            if (title.includes('Error') || title.includes('Not Found')) {
                return {
                    type: 'page_not_found',
                    message: 'Page not found or error',
                    originalText: title,
                    timestamp: new Date().toISOString()
                };
            }
        }
        catch (error) {
            // Continue
        }
        return null;
    }
    /**
     * Classify error type based on error text
     */
    classifyErrorType(errorText) {
        const text = errorText.toLowerCase();
        if (text.includes('page doesn\'t exist') || text.includes('not found') || text.includes('hmm...this page doesn')) {
            return 'page_not_found';
        }
        if (text.includes('suspended') || text.includes('banned') || text.includes('this post is from a suspended account')) {
            return 'account_suspended';
        }
        if (text.includes('tweet is unavailable') || text.includes('unavailable') || text.includes('this tweet is unavailable')) {
            return 'tweet_unavailable';
        }
        return 'unknown';
    }
    /**
     * Extract clean error message from error text
     */
    extractErrorMessage(errorText) {
        // Remove extra whitespace and clean up the message
        let message = errorText.trim();
        // Extract the main error message (usually the first sentence)
        const sentences = message.split(/[.!?]/);
        if (sentences.length > 0) {
            message = sentences[0].trim();
        }
        // Common error message mappings
        const errorMappings = {
            'hmm...this page doesn\'t exist': 'Page not found',
            'this account doesn\'t exist': 'Account does not exist',
            'this account has been suspended': 'Account suspended',
            'this post is from a suspended account': 'Post from suspended account',
            'this tweet is unavailable': 'Tweet unavailable'
        };
        const lowerMessage = message.toLowerCase();
        for (const [key, value] of Object.entries(errorMappings)) {
            if (lowerMessage.includes(key)) {
                return value;
            }
        }
        return message;
    }
    /**
     * Check if current page has any error indicators
     */
    async hasError() {
        const errorDetail = await this.extractErrorDetails();
        return errorDetail !== null;
    }
    /**
     * Get detailed error information for logging
     */
    async getErrorInfo() {
        const errorDetail = await this.extractErrorDetails();
        const currentUrl = await this.driver.getCurrentUrl();
        const pageTitle = await this.driver.getTitle();
        return {
            hasError: errorDetail !== null,
            errorDetail,
            currentUrl,
            pageTitle
        };
    }
}
exports.ErrorDriver = ErrorDriver;
/**
 * Utility function to extract error details from a page
 */
async function extractErrorDetails(driver, options) {
    const errorDriver = new ErrorDriver(driver, options);
    return await errorDriver.extractErrorDetails();
}
/**
 * Utility function to check if page has errors
 */
async function hasPageError(driver, options) {
    const errorDriver = new ErrorDriver(driver, options);
    return await errorDriver.hasError();
}
//# sourceMappingURL=error-driver.js.map