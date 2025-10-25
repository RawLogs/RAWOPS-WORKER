"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseOps = void 0;
const selenium_webdriver_1 = require("selenium-webdriver");
const interaction_utils_1 = require("./utils/interaction-utils");
const wait_utils_1 = require("./utils/wait-utils");
const anti_detection_1 = require("./anti-detection");
class BaseOps {
    constructor(driver) {
        this.driver = driver;
        this.antiDetection = new anti_detection_1.AntiDetectionIntegration(driver, 'browsing');
    }
    async randomDelay(min = 1000, max = 3000) {
        const delay = Math.floor(Math.random() * (max - min)) + min;
        await this.driver.sleep(delay);
    }
    async randomMouseMovement() {
        await (0, interaction_utils_1.randomMouseMovement)(this.driver);
    }
    async smoothScroll(options = {}) {
        const { duration = 2000, speed = 50, direction = 'down', steps = 20 } = options;
        const stepDelay = duration / steps;
        const scrollAmount = direction === 'down' ? 100 : -100;
        for (let i = 0; i < steps; i++) {
            await this.driver.executeScript(`window.scrollBy(0, ${scrollAmount});`);
            await this.driver.sleep(stepDelay);
        }
    }
    async waitForStability(options = {}) {
        const { timeout = 5000, waitForNetworkIdle = true } = options;
        if (waitForNetworkIdle) {
            await (0, wait_utils_1.waitForNetworkIdle)(this.driver, timeout);
        }
        // Wait for any pending animations
        await this.driver.sleep(1000);
    }
    async safeClick(selector, options = {}) {
        try {
            const element = await (0, wait_utils_1.waitForElement)(this.driver, selector, options.timeout || 10000);
            if (element) {
                const { useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium', hoverDuration = 300, clickDelay = 200, includeHover = true } = options;
                // Switch behavioral pattern if specified
                if (behavioralPattern !== this.antiDetection.getCurrentPattern().name) {
                    this.antiDetection.switchPattern(behavioralPattern);
                }
                if (useAntiDetection) {
                    // Use anti-detection click with mouse movement
                    return await this.antiDetection.clickWithMouseMovement(element, {
                        hoverDuration,
                        clickDelay,
                        includeHover,
                        pattern: behavioralPattern,
                        intensity: mouseIntensity,
                        includeMicroMovements: true,
                        includePauses: true
                    });
                }
                else {
                    // Legacy click without anti-detection
                    await element.click();
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error(`Failed to click selector ${selector}:`, error);
            return false;
        }
    }
    async safeFill(selector, text, options = {}) {
        try {
            const element = await (0, wait_utils_1.waitForElement)(this.driver, selector, options.timeout || 10000);
            if (element) {
                await element.clear();
                await element.sendKeys(text);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`Failed to fill selector ${selector}:`, error);
            return false;
        }
    }
    async typeCharacterByCharacter(selector, text) {
        try {
            const element = await (0, wait_utils_1.waitForElement)(this.driver, selector);
            if (!element)
                return false;
            return await this.typeCharacterByCharacterElement(element, text);
        }
        catch (error) {
            console.error(`Failed to type text with selector ${selector}:`, error);
            return false;
        }
    }
    async typeCharacterByCharacterElement(element, text) {
        try {
            console.log('[BaseOps] Typing comment character by character...');
            // Click element first
            await element.click();
            await this.randomDelay(100, 200);
            // Clear any existing content first
            await element.sendKeys(selenium_webdriver_1.Key.CONTROL + "a");
            await this.randomDelay(100, 200);
            await element.sendKeys(selenium_webdriver_1.Key.DELETE);
            await this.randomDelay(200, 300);
            // Type character by character with human-like delays (like legacy)
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                // Type the character
                await element.sendKeys(char);
                // Random delay between characters (5-20ms) - 10x faster like legacy
                const delay = Math.random() * 15 + 5;
                await this.driver.sleep(delay);
                // Occasionally pause longer (like human thinking) - reduced frequency for speed
                if (Math.random() < 0.02) { // 2% chance (reduced from 10%)
                    const thinkingDelay = Math.random() * 200 + 100; // 100-300ms (reduced from 500-1500ms)
                    console.log('[BaseOps] Pausing to think...');
                    await this.driver.sleep(thinkingDelay);
                }
                // Show progress every 10 characters
                if ((i + 1) % 10 === 0) {
                    console.log(`[BaseOps] Typed ${i + 1}/${text.length} characters`);
                }
            }
            console.log('[BaseOps] Finished typing comment character by character');
            return true;
        }
        catch (error) {
            console.error('[BaseOps] Error typing character by character:', error);
            // Fallback to normal typing
            try {
                await element.sendKeys(text);
                return true;
            }
            catch (fallbackError) {
                console.error('[BaseOps] Fallback typing also failed:', fallbackError);
                return false;
            }
        }
    }
    async typeCommentForXEditor(element, comment) {
        try {
            console.log('[BaseOps] Typing comment for X.com editor with optimized method...');
            // Clear any existing content first
            await element.clear();
            await this.driver.sleep(100);
            // Focus the element
            await this.driver.executeScript("arguments[0].focus();", element);
            await this.driver.sleep(200);
            // Split comment into words for better handling
            const words = comment.split(' ');
            let typedText = '';
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                // Type each word
                await element.sendKeys(word);
                typedText += word;
                // Add space after word (except last word)
                if (i < words.length - 1) {
                    await element.sendKeys(' ');
                    typedText += ' ';
                }
                // Delay between words (20-50ms)
                const wordDelay = Math.random() * 30 + 20;
                await this.driver.sleep(wordDelay);
                // Special handling for @ mentions
                if (word.startsWith('@')) {
                    console.log(`[BaseOps] Typed @ mention: ${word}`);
                    // Extra delay after @ mentions to let X.com process it
                    await this.driver.sleep(100);
                }
                // Show progress every 5 words
                if ((i + 1) % 5 === 0) {
                    console.log(`[BaseOps] Typed ${i + 1}/${words.length} words`);
                }
            }
            // Final verification - check if text was actually typed
            await this.driver.sleep(500);
            const actualText = await element.getAttribute('value') || await element.getText();
            if (actualText && actualText.includes(comment.substring(0, 50))) {
                console.log('[BaseOps] Comment typed successfully for X.com editor');
                return true;
            }
            else {
                console.log('[BaseOps] Comment may not have been typed correctly, trying fallback');
                // Fallback: try typing the whole comment at once
                await element.clear();
                await this.driver.sleep(100);
                await element.sendKeys(comment);
                await this.driver.sleep(200);
                return true;
            }
        }
        catch (error) {
            console.error('[BaseOps] Error typing for X.com editor:', error);
            // Fallback to character by character
            return await this.typeCharacterByCharacterElement(element, comment);
        }
    }
    cleanExtractedContent(content, username) {
        if (!content)
            return content;
        try {
            let cleanedContent = content;
            // Pattern 1: Remove specific username + "Hình ảnh" + username + everything after
            if (username) {
                const usernamePattern = new RegExp(`^\\s*${username}\\s+Hình\\s+ảnh\\s+${username}.*$`, 'gm');
                cleanedContent = cleanedContent.replace(usernamePattern, '');
            }
            // Pattern 2: Remove username + "Hình ảnh" + username + everything after (generic)
            // Matches: "HeosRe Hình ảnh HeosRe ✨ 🦅 🟠 Ảnh hồ sơ hình vuông 🟧 Ảnh hồ sơ hình vuông 🐶 🐶"
            cleanedContent = cleanedContent.replace(/^\s*\w+\s+Hình\s+ảnh\s+\w+.*$/gm, '');
            // Pattern 3: Remove specific username from start of lines
            if (username) {
                const usernameStartPattern = new RegExp(`^\\s*${username}\\s*$`, 'gm');
                cleanedContent = cleanedContent.replace(usernameStartPattern, '');
            }
            // Pattern 3.5: Remove everything from username onwards in the same line
            if (username) {
                const usernameToEndPattern = new RegExp(`\\b${username}\\b.*$`, 'gm');
                cleanedContent = cleanedContent.replace(usernameToEndPattern, '');
            }
            // Pattern 4: Remove standalone image descriptions
            // Matches: "Ảnh hồ sơ hình vuông", "Hình ảnh", etc.
            cleanedContent = cleanedContent.replace(/\b(Ảnh|Hình)\s+(ảnh|hồ\s+sơ|đại\s+diện)[\s\w]*/gi, '');
            // Pattern 5: Remove lines that start with username only (generic)
            // Matches: "HeosRe" at start of line
            cleanedContent = cleanedContent.replace(/^\s*\w+\s*$/gm, '');
            // Pattern 7: Remove lines that are mostly emojis or symbols
            cleanedContent = cleanedContent.split('\n')
                .filter(line => {
                const trimmedLine = line.trim();
                if (trimmedLine.length === 0)
                    return false;
                // Count emoji/symbol characters vs text characters
                const emojiCount = (trimmedLine.match(/[^\w\sÀ-ỹ]/g) || []).length;
                const textCount = (trimmedLine.match(/[a-zA-ZÀ-ỹ0-9]/g) || []).length;
                // Only keep lines that have significantly more text than symbols
                return textCount > emojiCount * 2 && textCount > 3;
            })
                .join('\n');
            // Pattern 8: Remove leading username completely (generic)
            cleanedContent = cleanedContent.replace(/^\s*\w+\s+/gm, '');
            // Pattern 9: Clean up spaces and empty lines
            cleanedContent = cleanedContent
                .replace(/\s+/g, ' ') // Multiple spaces to single space
                .replace(/\n\s*\n/g, '\n') // Multiple newlines to single newline
                .trim();
            // Pattern 10: Remove any remaining lines that are just symbols or very short
            cleanedContent = cleanedContent.split('\n')
                .filter(line => {
                const trimmedLine = line.trim();
                if (trimmedLine.length === 0)
                    return false;
                // Remove lines that are too short or contain mostly symbols
                const textCount = (trimmedLine.match(/[a-zA-ZÀ-ỹ0-9]/g) || []).length;
                return textCount >= 3 && trimmedLine.length >= 5;
            })
                .join('\n');
            // Final cleanup
            cleanedContent = cleanedContent.replace(/\s+/g, ' ').trim();
            console.log(`[BaseOps] Content cleaned (username: ${username || 'none'}): "${cleanedContent}"`);
            return cleanedContent;
        }
        catch (error) {
            console.log(`[BaseOps] Error cleaning content: ${error}`);
            return content; // Return original content if cleaning fails
        }
    }
}
exports.BaseOps = BaseOps;
//# sourceMappingURL=base.js.map