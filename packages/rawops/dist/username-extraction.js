"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsernameExtractionOps = void 0;
const selenium_webdriver_1 = require("selenium-webdriver");
const base_1 = require("./base");
class UsernameExtractionOps extends base_1.BaseOps {
    constructor(driver) {
        super(driver);
    }
    /**
     * Extract username from interaction link
     * Supports various Twitter/X link formats
     */
    extractUsernameFromLink(link) {
        try {
            // Remove any query parameters
            const cleanLink = link.split('?')[0];
            // Pattern 1: https://x.com/username/status/1234567890
            const statusMatch = cleanLink.match(/x\.com\/([^\/]+)\/status\/\d+/);
            if (statusMatch) {
                return statusMatch[1];
            }
            // Pattern 2: https://twitter.com/username/status/1234567890
            const twitterStatusMatch = cleanLink.match(/twitter\.com\/([^\/]+)\/status\/\d+/);
            if (twitterStatusMatch) {
                return twitterStatusMatch[1];
            }
            // Pattern 3: https://x.com/username
            const profileMatch = cleanLink.match(/x\.com\/([^\/]+)$/);
            if (profileMatch) {
                return profileMatch[1];
            }
            // Pattern 4: https://twitter.com/username
            const twitterProfileMatch = cleanLink.match(/twitter\.com\/([^\/]+)$/);
            if (twitterProfileMatch) {
                return twitterProfileMatch[1];
            }
            // Pattern 5: @username format
            const mentionMatch = cleanLink.match(/@([a-zA-Z0-9_]+)/);
            if (mentionMatch) {
                return mentionMatch[1];
            }
            console.log(`[UsernameExtraction] Could not extract username from link: ${link}`);
            return null;
        }
        catch (error) {
            console.error(`[UsernameExtraction] Error extracting username from link: ${error}`);
            return null;
        }
    }
    /**
     * Search for username and click on the user profile using explore tab
     */
    async searchAndClickUsername(username, options = {}) {
        try {
            const { useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium' } = options;
            console.log(`[UsernameExtraction] Searching for username: @${username}`);
            // Step 2: Click on explore ta
            console.log(`[UsernameExtraction] Clicking on explore tab...`);
            const exploreLink = await this.driver.findElement(selenium_webdriver_1.By.css('a[href="/explore"][aria-label="Search and explore"]'));
            if (useAntiDetection) {
                const success = await this.clickWithAntiDetection(exploreLink, {
                    behavioralPattern,
                    mouseIntensity
                });
                if (!success) {
                    return {
                        username,
                        profileUrl: '',
                        found: false,
                        error: 'Failed to click on explore tab'
                    };
                }
            }
            else {
                await exploreLink.click();
            }
            await this.randomDelay(1000, 2000);
            // Step 3: Wait and click on search form
            console.log(`[UsernameExtraction] Clicking on search form...`);
            const searchForm = await this.driver.findElement(selenium_webdriver_1.By.css('form[aria-label="Search"][role="search"]'));
            if (useAntiDetection) {
                const success = await this.clickWithAntiDetection(searchForm, {
                    behavioralPattern,
                    mouseIntensity
                });
                if (!success) {
                    return {
                        username,
                        profileUrl: '',
                        found: false,
                        error: 'Failed to click on search form'
                    };
                }
            }
            else {
                await searchForm.click();
            }
            await this.randomDelay(1000, 2000);
            // Step 4: Type username with @ prefix
            console.log(`[UsernameExtraction] Typing @${username}...`);
            const searchInput = await this.driver.findElement(selenium_webdriver_1.By.css('input[data-testid="SearchBox_Search_Input"]'));
            await searchInput.clear();
            await searchInput.sendKeys(`${username}`);
            await this.randomDelay(1000, 2000);
            // Additional step: Click on the search input again to ensure focus
            try {
                await searchInput.click();
                await this.randomDelay(500, 1000);
                console.log(`[UsernameExtraction] Re-clicked search input to ensure focus`);
            }
            catch (error) {
                console.log(`[UsernameExtraction] Could not re-click search input: ${error}`);
            }
            // Step 5: Wait for dropdown to appear
            console.log(`[UsernameExtraction] Waiting for dropdown to appear...`);
            // First, wait a bit for the dropdown to start loading
            await this.randomDelay(2000, 3000);
            // Then wait for dropdown to appear with multiple selectors
            const dropdownFound = await this.driver.wait(async () => {
                // Try multiple selectors for the dropdown
                const selectors = [
                    '[role="listbox"][id*="typeaheadDropdown"]',
                    '[role="listbox"]',
                    '[data-testid*="typeahead"]'
                ];
                for (const selector of selectors) {
                    const dropdown = await this.driver.findElements(selenium_webdriver_1.By.css(selector));
                    if (dropdown.length > 0) {
                        return true;
                    }
                }
                return false;
            }, 15000); // Increased timeout to 15 seconds
            if (!dropdownFound) {
                console.log(`[UsernameExtraction] Dropdown did not appear within timeout, retrying with character-by-character typing`);
                // Clear the search input first
                try {
                    await searchInput.clear();
                    await this.randomDelay(500, 1000);
                }
                catch (clearError) {
                    // Silent fail for clear operation
                }
                // Retry typing with character-by-character method
                try {
                    console.log(`[UsernameExtraction] Retrying with character-by-character typing: @${username}`);
                    const success = await this.typeCharacterByCharacterElement(searchInput, `${username}`);
                    if (!success) {
                        return {
                            username,
                            profileUrl: '',
                            found: false,
                            error: 'Failed to type username character-by-character'
                        };
                    }
                    // Wait for dropdown to appear again
                    await this.randomDelay(2000, 3000);
                    // Check if dropdown appears now
                    const retryDropdownFound = await this.driver.wait(async () => {
                        const selectors = [
                            '[role="listbox"][id*="typeaheadDropdown"]',
                            '[role="listbox"]',
                            '[data-testid*="typeahead"]'
                        ];
                        for (const selector of selectors) {
                            const dropdown = await this.driver.findElements(selenium_webdriver_1.By.css(selector));
                            if (dropdown.length > 0) {
                                return true;
                            }
                        }
                        return false;
                    }, 10000); // 10 second timeout for retry
                    if (!retryDropdownFound) {
                        console.log(`[UsernameExtraction] Dropdown still did not appear after retry`);
                        return {
                            username,
                            profileUrl: '',
                            found: false,
                            error: 'Dropdown did not appear even after character-by-character retry'
                        };
                    }
                }
                catch (retryError) {
                    console.error(`[UsernameExtraction] Error during retry: ${retryError}`);
                    return {
                        username,
                        profileUrl: '',
                        found: false,
                        error: `Retry failed: ${retryError instanceof Error ? retryError.message : String(retryError)}`
                    };
                }
            }
            // Step 6: Find and click on the correct user from dropdown
            console.log(`[UsernameExtraction] Looking for user in dropdown...`);
            // Try multiple selectors to find user options
            let userOptions = [];
            const optionSelectors = [
                '[role="option"][data-testid="typeaheadResult"]',
                '[role="option"]',
                '[data-testid="typeaheadResult"]',
                '.css-175oi2r[role="option"]'
            ];
            for (const selector of optionSelectors) {
                userOptions = await this.driver.findElements(selenium_webdriver_1.By.css(selector));
                if (userOptions.length > 0) {
                    break;
                }
            }
            let targetUserElement = null;
            let profileUrl = '';
            const foundUsernames = [];
            for (const userOption of userOptions) {
                try {
                    // Check if this is a user option (not search suggestion)
                    const userButton = await userOption.findElements(selenium_webdriver_1.By.css('[data-testid="TypeaheadUser"]'));
                    if (userButton.length === 0)
                        continue;
                    // Get username from the user element - try multiple approaches
                    let usernameText = '';
                    let foundUsername = '';
                    // Method 1: Extract from data-testid attribute (most reliable)
                    try {
                        const avatarContainer = await userOption.findElement(selenium_webdriver_1.By.css('[data-testid*="UserAvatar-Container-"]'));
                        const testId = await avatarContainer.getAttribute('data-testid');
                        if (testId) {
                            const usernameMatch = testId.match(/UserAvatar-Container-(.+)/i); // Case-insensitive match
                            if (usernameMatch) {
                                foundUsername = usernameMatch[1];
                            }
                        }
                    }
                    catch (error) {
                        // Silent fail for data-testid extraction
                    }
                    // Method 2: Get all text content from the user option
                    if (!foundUsername) {
                        try {
                            usernameText = await userOption.getText();
                        }
                        catch (error) {
                            // Silent fail for text extraction
                        }
                        // Method 3: Try specific selectors if no @ found in full text
                        if (!usernameText || !usernameText.includes('@')) {
                            const selectors = [
                                '[data-testid="User-Name"]',
                                'span[dir="ltr"]',
                                '.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3'
                            ];
                            for (const selector of selectors) {
                                const elements = await userOption.findElements(selenium_webdriver_1.By.css(selector));
                                if (elements.length > 0) {
                                    const elementText = await elements[0].getText();
                                    if (elementText.includes('@')) {
                                        usernameText = elementText;
                                        break;
                                    }
                                }
                            }
                        }
                        // Extract username from text if found
                        if (usernameText && usernameText.includes('@')) {
                            const usernameMatch = usernameText.match(/@([a-zA-Z0-9_]+)/);
                            if (usernameMatch) {
                                foundUsername = usernameMatch[1];
                            }
                        }
                    }
                    if (!foundUsername) {
                        continue;
                    }
                    // Use the found username for comparison
                    foundUsernames.push(foundUsername);
                    if (foundUsername.toLowerCase() === username.toLowerCase()) {
                        targetUserElement = userButton[0];
                        // Get profile URL from the link
                        const profileLinks = await userOption.findElements(selenium_webdriver_1.By.css('a[href*="/"]'));
                        if (profileLinks.length > 0) {
                            profileUrl = await profileLinks[0].getAttribute('href');
                        }
                        console.log(`[UsernameExtraction] Found matching user: @${foundUsername}`);
                        break;
                    }
                }
                catch (error) {
                    // Continue to next user element
                    continue;
                }
            }
            if (!targetUserElement) {
                // Fallback: try to click on the first user option if available
                const firstUserButton = await this.driver.findElements(selenium_webdriver_1.By.css('[role="option"][data-testid="typeaheadResult"] [data-testid="TypeaheadUser"]'));
                if (firstUserButton.length > 0) {
                    targetUserElement = firstUserButton[0];
                    // Try to get profile URL from first option
                    const firstUserOption = await this.driver.findElements(selenium_webdriver_1.By.css('[role="option"][data-testid="typeaheadResult"]'));
                    if (firstUserOption.length > 0) {
                        const profileLinks = await firstUserOption[0].findElements(selenium_webdriver_1.By.css('a[href*="/"]'));
                        if (profileLinks.length > 0) {
                            profileUrl = await profileLinks[0].getAttribute('href');
                        }
                    }
                }
                else {
                    return {
                        username,
                        profileUrl: '',
                        found: false,
                        error: 'User not found in dropdown and no fallback available'
                    };
                }
            }
            // Step 7: Click on the user profile with anti-detection
            console.log(`[UsernameExtraction] Clicking on user profile...`);
            // Add some mouse movement to hover over the dropdown before clicking
            try {
                const { AntiDetectionIntegration } = await Promise.resolve().then(() => __importStar(require('./anti-detection')));
                const antiDetection = new AntiDetectionIntegration(this.driver, behavioralPattern);
                // Simulate mouse movement over the dropdown area
                await antiDetection.simulateMouseMovement({
                    pattern: behavioralPattern,
                    intensity: 'low',
                    duration: 1000,
                    includeMicroMovements: true,
                    includePauses: true
                });
                // Small delay before clicking
                await this.randomDelay(500, 1000);
            }
            catch (mouseError) {
                // Silent fail for mouse movement
            }
            if (useAntiDetection) {
                const success = await this.clickWithAntiDetection(targetUserElement, {
                    behavioralPattern,
                    mouseIntensity
                });
                if (!success) {
                    return {
                        username,
                        profileUrl,
                        found: true,
                        error: 'Failed to click on user profile'
                    };
                }
            }
            else {
                await targetUserElement.click();
            }
            // Step 8: Wait for profile page to load
            await this.randomDelay(3000, 5000);
            console.log(`[UsernameExtraction] Successfully navigated to @${username}'s profile`);
            return {
                username,
                profileUrl,
                found: true
            };
        }
        catch (error) {
            console.error(`[UsernameExtraction] Error searching for username @${username}:`, error);
            return {
                username,
                profileUrl: '',
                found: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Click with anti-detection mouse movement using rawops anti-detection
     */
    async clickWithAntiDetection(element, options) {
        try {
            // Import anti-detection integration from rawops
            const { AntiDetectionIntegration } = await Promise.resolve().then(() => __importStar(require('./anti-detection')));
            const antiDetection = new AntiDetectionIntegration(this.driver, options.behavioralPattern);
            // Scroll element into view first
            await this.driver.executeScript('arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });', element);
            await this.randomDelay(1000, 2000);
            // Click with mouse movement using the anti-detection library
            return await antiDetection.clickWithMouseMovement(element, {
                pattern: options.behavioralPattern,
                intensity: options.mouseIntensity,
                hoverDuration: 300,
                clickDelay: 200,
                includeHover: true,
                includeMicroMovements: true,
                includePauses: true
            });
        }
        catch (error) {
            console.error('[UsernameExtraction] Anti-detection click failed:', error);
            // Fallback to regular click
            try {
                await element.click();
                return true;
            }
            catch (fallbackError) {
                console.error('[UsernameExtraction] Fallback click also failed:', fallbackError);
                return false;
            }
        }
    }
    /**
     * Process multiple links and extract usernames
     */
    async processInteractionLinks(links) {
        const results = [];
        for (const link of links) {
            const username = this.extractUsernameFromLink(link);
            results.push({ link, username });
            // Silent processing for individual links
        }
        return results;
    }
    /**
     * Get unique usernames from links
     */
    getUniqueUsernames(links) {
        const usernames = new Set();
        for (const link of links) {
            const username = this.extractUsernameFromLink(link);
            if (username) {
                usernames.add(username);
            }
        }
        return Array.from(usernames);
    }
}
exports.UsernameExtractionOps = UsernameExtractionOps;
