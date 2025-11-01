"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentOps = void 0;
const selenium_webdriver_1 = require("selenium-webdriver");
const base_1 = require("./base");
const extraction_1 = require("./extraction");
class CommentOps extends base_1.BaseOps {
    constructor(driver) {
        super(driver);
    }
    /**
     * Comment on the first tweet on the page with anti-detection
     * This is the main method for commenting on tweets
     */
    async commentOnFirstTweet(content, options = {}) {
        try {
            const { useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium', hoverDuration = 300, clickDelay = 200, includeHover = true } = options;
            // Legacy selectors from xaicommentService.js with comprehensive fallback
            const replyButtonSelectors = [
                // New specific Reply button selectors (based on provided HTML)
                '//button[@data-testid="tweetButtonInline"][@role="button"][@type="button"][.//span[text()="Reply"]]',
                '//button[@data-testid="tweetButtonInline"][@role="button"][@type="button"][.//span[text()="Trả lời"]]',
                '//button[@data-testid="tweetButton"][@role="button"][@type="button"][.//span[text()="Reply"]]',
                '//button[@data-testid="tweetButton"][@role="button"][@type="button"][.//span[text()="Trả lời"]]',
                '//button[@data-testid="tweetButton"][@role="button"][.//span[text()="Reply"]]',
                '//button[@data-testid="tweetButton"][@role="button"][.//span[text()="Trả lời"]]',
                '//button[@data-testid="tweetButton"][@type="button"][.//span[text()="Reply"]]',
                '//button[@data-testid="tweetButton"][@type="button"][.//span[text()="Trả lời"]]',
                // Original selectors
                '//article[@data-testid="tweet"][1]//button[@data-testid="reply"]',
                '//article[@data-testid="tweet"]//div[@role="group"]//button[@data-testid="reply"]',
                '//article[@data-testid="tweet"][1]//div[@data-testid="reply"]',
                '//article[@data-testid="tweet"][1]//button[contains(@aria-label,"Reply")]',
                '//article[@data-testid="tweet"][1]//button[contains(@aria-label,"Trả lời")]',
                '//article[@data-testid="tweet"]//span[text()="Reply"]/ancestor::button[1]',
                '//article[@data-testid="tweet"]//span[text()="Trả lời"]/ancestor::button[1]',
                // Additional reply button selectors
                '//button[@data-testid="tweetButton"][.//span[text()="Reply"]]',
                '//button[@data-testid="tweetButton"][.//span[text()="Trả lời"]]',
                '//button[@data-testid="tweetButton"]//span[text()="Reply"]/ancestor::button[1]',
                '//button[@data-testid="tweetButton"]//span[text()="Trả lời"]/ancestor::button[1]',
                // CSS selectors
                '[data-testid="tweetButtonInline"]',
                'button[data-testid="tweetButtonInline"]',
                '[data-testid="tweet"]:first-child [data-testid="reply"]',
                '[data-testid="tweet"]:first-child button[aria-label*="reply" i]',
                '[data-testid="tweet"]:first-child button[aria-label*="Trả lời" i]',
                '[data-testid="tweetButton"]',
                'button[data-testid="tweetButton"]'
            ];
            let replyButtonFound = false;
            // Try xpath first for reply button
            try {
                const replyElement = await this.driver.findElement(selenium_webdriver_1.By.xpath(replyButtonSelectors[0]));
                // Scroll to element first to ensure it's visible
                await this.driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", replyElement);
                await this.randomDelay(1000, 2000);
                if (useAntiDetection) {
                    const clickSuccess = await this.antiDetection.clickWithMouseMovement(replyElement, {
                        hoverDuration,
                        clickDelay,
                        includeHover,
                        pattern: behavioralPattern,
                        intensity: mouseIntensity,
                        includeMicroMovements: true,
                        includePauses: true
                    });
                    if (clickSuccess) {
                        replyButtonFound = true;
                    }
                }
                else {
                    await replyElement.click();
                    replyButtonFound = true;
                }
            }
            catch (xpathError) {
                // Try remaining XPath selectors
                for (let i = 1; i < 19; i++) { // XPath selectors are indices 0-18
                    try {
                        const element = await this.driver.findElement(selenium_webdriver_1.By.xpath(replyButtonSelectors[i]));
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
                                replyButtonFound = true;
                                break;
                            }
                        }
                        else {
                            await element.click();
                            replyButtonFound = true;
                            break;
                        }
                    }
                    catch (error) {
                        continue;
                    }
                }
                // Try CSS selectors if XPath failed
                if (!replyButtonFound) {
                    for (const selector of replyButtonSelectors.slice(19)) { // CSS selectors start from index 19
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
                                    replyButtonFound = true;
                                    break;
                                }
                            }
                            else {
                                await element.click();
                                replyButtonFound = true;
                                break;
                            }
                        }
                        catch (error) {
                            continue;
                        }
                    }
                }
            }
            if (!replyButtonFound) {
                return { success: false, error: 'Could not find reply button' };
            }
            await this.randomDelay(3000, 5000);
            // Legacy input check selectors from xaicommentService.js
            const commentInputSelectors = [
                // New X.com reply modal selectors
                '//div[@data-testid="tweetTextarea_0"]',
                '//div[@aria-label="Đăng văn bản"]',
                '//div[@aria-label="Post text"]',
                '//div[@data-testid*="tweetTextarea"]',
                '//div[@class="public-DraftEditor-content"]',
                // Textarea selectors (new addition)
                '//textarea[@data-testid="tweetTextarea_0"]',
                '//textarea[@aria-label="Post text"]',
                '//textarea[@placeholder="Post your reply"]',
                '//textarea[@data-testid*="tweetTextarea"]',
                // Additional selectors for better detection
                '//div[@data-testid="tweetTextarea_0" and @contenteditable="true"]',
                '//div[@class="public-DraftEditor-content" and @contenteditable="true"]',
                '//div[@role="textbox" and @contenteditable="true"]',
                // Legacy selectors
                '//div[@data-offset-key]',
                '//div[@contenteditable="true"]',
                '//div[@data-testid*="TextArea"]',
                '//div[@role="textbox"]',
                // Additional fallback selectors
                '//div[@data-testid="tweetComposeTextInput"]',
                '//div[@data-testid="tweetTextarea_0"]//div[@contenteditable="true"]',
                '//div[@data-testid="tweetTextarea_0"]//div[@role="textbox"]',
                // CSS selectors
                '[data-testid="tweetTextarea_0"]',
                '[aria-label="Post text"]',
                '[aria-label="Đăng văn bản"]',
                '[data-testid*="tweetTextarea"]',
                '[contenteditable="true"]'
            ];
            let inputFound = false;
            let foundElement = null;
            // Try multiple times with different wait strategies
            for (let attempt = 0; attempt < 3; attempt++) {
                for (const selector of commentInputSelectors) {
                    try {
                        let element;
                        if (selector.startsWith('//')) {
                            // XPath selector
                            element = await this.driver.findElement(selenium_webdriver_1.By.xpath(selector));
                        }
                        else {
                            // CSS selector
                            element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                        }
                        const isDisplayed = await element.isDisplayed();
                        const isEnabled = await element.isEnabled();
                        if (element && isDisplayed && isEnabled) {
                            inputFound = true;
                            foundElement = element;
                            break;
                        }
                    }
                    catch (e) {
                        continue;
                    }
                }
                if (inputFound)
                    break;
                // If not found, wait a bit more and try again
                if (attempt < 2) {
                    await this.randomDelay(2000, 3000);
                }
            }
            // If we found an element but it's not clickable, try to make it clickable
            if (foundElement && !inputFound) {
                try {
                    // Try to scroll the element into view
                    await this.driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", foundElement);
                    await this.randomDelay(1000, 2000);
                    // Check again if it's now clickable
                    const isDisplayed = await foundElement.isDisplayed();
                    const isEnabled = await foundElement.isEnabled();
                    if (isDisplayed && isEnabled) {
                        inputFound = true;
                    }
                }
                catch (scrollError) {
                    // Ignore scroll errors
                }
            }
            if (!inputFound) {
                return { success: false, error: 'Could not find comment input' };
            }
            await this.randomDelay(1000, 2000);
            // Type comment character by character
            try {
                // Find the input element first
                const inputElement = await this.driver.findElement(selenium_webdriver_1.By.css('[data-testid="tweetTextarea_0"]'));
                // Use the enhanced typing method from BaseOps
                const typeSuccess = await this.typeCharacterByCharacterElement(inputElement, content);
                if (!typeSuccess) {
                    return { success: false, error: 'Failed to type comment' };
                }
                console.log('[CommentOps] Comment typed character by character');
            }
            catch (typeError) {
                console.log('[CommentOps] Failed to type comment:', typeError);
                return { success: false, error: 'Failed to type comment' };
            }
            await this.randomDelay(2000, 3000);
            // Skip submit button check - button will appear automatically when content is typed
            console.log('[CommentOps] Content typed, submit button should appear automatically...');
            // Submit comment with anti-detection
            const submitResult = await this.submitComment({
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
            // Verify comment was actually posted
            console.log('[CommentOps] Verifying comment was posted...');
            const verificationResult = await this.checkCommentSuccess(content);
            if (!verificationResult.success) {
                console.log('[CommentOps] Comment verification failed:', verificationResult.error);
                return { success: false, error: 'Comment verification failed' };
            }
            console.log('[CommentOps] Comment successfully posted and verified');
            return { success: true, data: { content, antiDetection: useAntiDetection } };
        }
        catch (error) {
            return { success: false, error: `Error commenting: ${error}` };
        }
    }
    /**
     * Comment on a specific tweet by URL
     * Navigates to the tweet and then comments on it
     */
    async commentOnTweetByUrl(tweetUrl, content, options = {}) {
        try {
            // Navigate to the tweet
            await this.driver.get(tweetUrl);
            await this.randomDelay(3000, 5000);
            // Use the same logic as commentOnFirstTweet
            return await this.commentOnFirstTweet(content, options);
        }
        catch (error) {
            return { success: false, error: `Error commenting on tweet by URL: ${error}` };
        }
    }
    /**
     * Reply to a specific comment in a thread (enhanced with legacy logic)
     * This method handles replying to individual comments within a thread
     */
    async replyToComment(commentElement, content, options = {}) {
        try {
            const { useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium', hoverDuration = 300, clickDelay = 200, includeHover = true } = options;
            // Scroll to the comment first (like legacy)
            await this.driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", commentElement);
            await this.randomDelay(1000, 2000);
            // Find reply button within the comment using legacy selectors
            const replyButtonSelectors = [
                '[data-testid="reply"]',
                'button[aria-label*="Reply" i]',
                'button[aria-label*="Trả lời" i]',
                'div[role="button"][aria-label*="Reply" i]',
                'div[role="button"][aria-label*="Trả lời" i]'
            ];
            let replyButtonFound = false;
            let replyButton = null;
            for (const selector of replyButtonSelectors) {
                try {
                    replyButton = await commentElement.findElement(selenium_webdriver_1.By.css(selector));
                    if (useAntiDetection) {
                        const clickSuccess = await this.antiDetection.clickWithMouseMovement(replyButton, {
                            hoverDuration,
                            clickDelay,
                            includeHover,
                            pattern: behavioralPattern,
                            intensity: mouseIntensity,
                            includeMicroMovements: true,
                            includePauses: true
                        });
                        if (clickSuccess) {
                            replyButtonFound = true;
                            break;
                        }
                    }
                    else {
                        await replyButton.click();
                        replyButtonFound = true;
                        break;
                    }
                }
                catch (error) {
                    continue;
                }
            }
            if (!replyButtonFound) {
                return { success: false, error: 'Reply button not found in comment' };
            }
            await this.randomDelay(2000, 3000);
            // Find comment input using legacy selectors
            const commentInputSelectors = [
                // Legacy input check selectors from xaicommentService.js
                '//div[@data-testid="tweetTextarea_0"]',
                '//div[@aria-label="Đăng văn bản"]',
                '//div[@aria-label="Post text"]',
                '//div[@data-testid*="tweetTextarea"]',
                '//div[@class="public-DraftEditor-content"]',
                // Textarea selectors (new addition)
                '//textarea[@data-testid="tweetTextarea_0"]',
                '//textarea[@aria-label="Post text"]',
                '//textarea[@placeholder="Post your reply"]',
                '//textarea[@data-testid*="tweetTextarea"]',
                // Additional selectors for better detection
                '//div[@data-testid="tweetTextarea_0" and @contenteditable="true"]',
                '//div[@class="public-DraftEditor-content" and @contenteditable="true"]',
                '//div[@role="textbox" and @contenteditable="true"]',
                // Legacy selectors
                '//div[@data-offset-key]',
                '//div[@contenteditable="true"]',
                '//div[@data-testid*="TextArea"]',
                '//div[@role="textbox"]',
                // CSS selectors
                '[data-testid="tweetTextarea_0"]',
                '[aria-label="Post text"]',
                '[aria-label="Đăng văn bản"]',
                '[data-testid*="tweetTextarea"]',
                '[contenteditable="true"]'
            ];
            let inputFound = false;
            let foundElement = null;
            // Try multiple times with different wait strategies (like legacy)
            for (let attempt = 0; attempt < 3; attempt++) {
                for (const selector of commentInputSelectors) {
                    try {
                        let element;
                        if (selector.startsWith('//')) {
                            // XPath selector
                            element = await this.driver.findElement(selenium_webdriver_1.By.xpath(selector));
                        }
                        else {
                            // CSS selector
                            element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                        }
                        const isDisplayed = await element.isDisplayed();
                        const isEnabled = await element.isEnabled();
                        if (element && isDisplayed && isEnabled) {
                            inputFound = true;
                            foundElement = element;
                            break;
                        }
                    }
                    catch (e) {
                        continue;
                    }
                }
                if (inputFound)
                    break;
                // If not found, wait a bit more and try again
                if (attempt < 2) {
                    await this.randomDelay(2000, 3000);
                }
            }
            // If we found an element but it's not clickable, try to make it clickable
            if (foundElement && !inputFound) {
                try {
                    // Try to scroll the element into view
                    await this.driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", foundElement);
                    await this.randomDelay(1000, 2000);
                    // Check again if it's now clickable
                    const isDisplayed = await foundElement.isDisplayed();
                    const isEnabled = await foundElement.isEnabled();
                    if (isDisplayed && isEnabled) {
                        inputFound = true;
                    }
                }
                catch (scrollError) {
                    // Ignore scroll errors
                }
            }
            if (!inputFound) {
                return { success: false, error: 'Could not find comment input' };
            }
            await this.randomDelay(1000, 2000);
            // Type comment character by character (like legacy)
            try {
                // Use the enhanced typing method from BaseOps
                if (foundElement) {
                    const typeSuccess = await this.typeCharacterByCharacterElement(foundElement, content);
                    if (!typeSuccess) {
                        return { success: false, error: 'Failed to type comment' };
                    }
                    console.log('[CommentOps] Comment typed character by character');
                }
                else {
                    return { success: false, error: 'Could not find comment input element' };
                }
            }
            catch (typeError) {
                console.log('[CommentOps] Failed to type comment:', typeError);
                return { success: false, error: 'Failed to type comment' };
            }
            await this.randomDelay(2000, 3000);
            // Submit comment with enhanced logic
            const submitResult = await this.submitComment({
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
            // Check if reply was successful (like legacy)
            const replySuccess = await this.checkCommentSuccess(content);
            return {
                success: replySuccess.success,
                data: {
                    content,
                    antiDetection: useAntiDetection,
                    verification: replySuccess.data?.verification
                },
                error: replySuccess.error
            };
        }
        catch (error) {
            return { success: false, error: `Error replying to comment: ${error}` };
        }
    }
    /**
     * Check if comment was posted successfully
     * This method verifies that a comment was successfully submitted using extraction methods
     */
    async checkCommentSuccess(expectedContent) {
        try {
            console.log('[CommentOps] Checking comment success...');
            // Wait for comment to appear
            await this.randomDelay(3000, 5000);
            // Check if comment input area disappeared (indicates successful submission)
            const inputElements = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid*="tweetTextarea"][contenteditable="true"]'));
            console.log(`[CommentOps] Found ${inputElements.length} input elements after submission`);
            if (inputElements.length === 0) {
                console.log('[CommentOps] Input area disappeared - comment likely successful');
                return { success: true, data: { verification: 'input_disappeared' } };
            }
            // Enhanced content verification using ExtractionOps methods
            if (expectedContent) {
                try {
                    console.log(`[CommentOps] Verifying comment content: "${expectedContent.substring(0, 50)}..."`);
                    // Use ExtractionOps to extract reply tweets
                    const extractionOps = new extraction_1.ExtractionOps(this.driver);
                    // Use ExtractionOps to get all reply tweets
                    const replyTweets = await extractionOps.extractReplyTweets();
                    console.log(`[CommentOps] Found ${replyTweets.length} reply tweets for content verification`);
                    // Check each reply tweet for content match
                    for (const replyTweet of replyTweets) {
                        try {
                            const tweetContent = replyTweet.content;
                            console.log(`[CommentOps] Checking reply from @${replyTweet.username}: "${tweetContent.substring(0, 50)}..."`);
                            // Check if this tweet content matches the beginning of expected content
                            const expectedStart = expectedContent.substring(0, Math.min(30, expectedContent.length));
                            const tweetStart = tweetContent.substring(0, Math.min(30, tweetContent.length));
                            console.log(`[CommentOps] Comparing:`);
                            console.log(`  Expected start: "${expectedStart}"`);
                            console.log(`  Tweet start: "${tweetStart}"`);
                            // Check for content match (case insensitive, trim whitespace)
                            if (tweetStart.toLowerCase().trim() === expectedStart.toLowerCase().trim()) {
                                console.log('[CommentOps] ✅ Found exact content match in thread');
                                return { success: true, data: { verification: 'content_exact_match' } };
                            }
                            // Check for partial match (first 20 characters)
                            const expectedPartial = expectedContent.substring(0, Math.min(20, expectedContent.length));
                            const tweetPartial = tweetContent.substring(0, Math.min(20, tweetContent.length));
                            if (tweetPartial.toLowerCase().trim() === expectedPartial.toLowerCase().trim()) {
                                console.log('[CommentOps] ✅ Found partial content match in thread');
                                return { success: true, data: { verification: 'content_partial_match' } };
                            }
                            // Check for word overlap (at least 3 words match)
                            const expectedWords = expectedContent.toLowerCase().split(/\s+/).slice(0, 5);
                            const tweetWords = tweetContent.toLowerCase().split(/\s+/).slice(0, 5);
                            const matchingWords = expectedWords.filter(word => tweetWords.includes(word));
                            if (matchingWords.length >= 3) {
                                console.log(`[CommentOps] ✅ Found word overlap match (${matchingWords.length} words): ${matchingWords.join(', ')}`);
                                return { success: true, data: { verification: 'content_word_overlap' } };
                            }
                        }
                        catch (tweetError) {
                            console.log(`[CommentOps] Error processing reply tweet: ${tweetError.message}`);
                            continue;
                        }
                    }
                    console.log('[CommentOps] No content match found in any reply tweets');
                }
                catch (extractionError) {
                    console.log('[CommentOps] Content verification failed:', extractionError);
                }
            }
            console.log('[CommentOps] Comment verification failed - no success indicators found');
            return { success: false, error: 'No success indicators found' };
        }
        catch (error) {
            console.error('[CommentOps] Error checking comment success:', error);
            return { success: false, error: `Verification error: ${error}` };
        }
    }
    /**
     * Submit comment with retry logic and anti-detection
     * This is the core method for submitting comments with comprehensive fallback strategies
     */
    async submitComment(options = {}) {
        const { useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium', hoverDuration = 300, clickDelay = 200, includeHover = true } = options;
        // Legacy submit selectors from xaicommentService.js
        const submitButtonSelectors = [
            // Specific tweetButtonInline selector (most common for reply modal)
            '//button[@data-testid="tweetButtonInline"]',
            '//button[@data-testid="tweetButtonInline"][@role="button"]',
            '//button[@data-testid="tweetButtonInline"][@type="button"]',
            // New X.com reply modal submit selectors
            '//div[@data-testid="tweetTextarea_0"]/ancestor::div//button[@data-testid*="tweetButton"]',
            '//div[@aria-label="Đăng văn bản"]/ancestor::div//button[@data-testid*="tweetButton"]',
            '//div[@data-testid*="tweetTextarea"]/ancestor::div//button[@data-testid*="tweetButton"]',
            '//div[@class="public-DraftEditor-content"]/ancestor::div//button[@data-testid*="tweetButton"]',
            // Legacy selectors
            '//div[@role="textbox"]/ancestor::form//button[@data-testid*="tweetButton"]',
            '//div[contains(@data-testid,"TextArea")]/ancestor::div[@data-testid*="toolbar"]//button[@data-testid*="tweetButton"]',
            '//div[@contenteditable="true"]/ancestor::div[@role="toolbar"]//button',
            '//div[@role="textbox"]/following-sibling::div[@role="toolbar"]//button[contains(@aria-label,"Post")]',
            '//div[@data-offset-key]/ancestor::div[@data-testid]//button[@data-testid*="tweetButton"]',
            // CSS selectors
            '[data-testid="tweetButtonInline"]',
            '[data-testid*="tweetButton"]',
            'button[aria-label*="Post" i]',
            'button[aria-label*="Reply" i]',
            'button[aria-label*="Trả lời" i]',
            'button[aria-label="Tweet"]',
            '[role="toolbar"] button'
        ];
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`[CommentOps] Submit attempt ${attempt}/3...`);
                // Try multiple strategies to find and click submit button (like legacy)
                for (let i = 0; i < submitButtonSelectors.length; i++) {
                    const selector = submitButtonSelectors[i];
                    try {
                        console.log(`[CommentOps] Trying submit selector ${i + 1}/${submitButtonSelectors.length}: ${selector}`);
                        let element;
                        if (selector.startsWith('//')) {
                            // XPath selector
                            element = await this.driver.findElement(selenium_webdriver_1.By.xpath(selector));
                        }
                        else {
                            // CSS selector
                            element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                        }
                        if (!element) {
                            console.log(`[CommentOps] Submit element not found with selector ${i + 1}`);
                            continue;
                        }
                        // Check if submit button is disabled (like legacy)
                        const isDisabled = await element.getAttribute('disabled');
                        const ariaDisabled = await element.getAttribute('aria-disabled');
                        const isClickable = await element.isEnabled();
                        const isDisplayed = await element.isDisplayed();
                        console.log(`[CommentOps] Submit button status - Disabled: ${isDisabled}, Aria-disabled: ${ariaDisabled}, Enabled: ${isClickable}, Displayed: ${isDisplayed}`);
                        if (isDisabled === 'true' || ariaDisabled === 'true' || !isClickable || !isDisplayed) {
                            console.log(`[CommentOps] Submit button is disabled with selector ${i + 1}, trying next...`);
                            continue;
                        }
                        // Try multiple click strategies
                        let clickSuccess = false;
                        // Strategy 1: Direct click (no anti-detection to avoid scrolling)
                        try {
                            await element.click();
                            clickSuccess = true;
                            console.log(`[CommentOps] Comment posted successfully with direct click (selector ${i + 1})!`);
                        }
                        catch (clickError) {
                            console.log(`[CommentOps] Direct click failed with selector ${i + 1}: ${clickError.message}`);
                            // Strategy 2: JavaScript click
                            try {
                                await this.driver.executeScript("arguments[0].click();", element);
                                clickSuccess = true;
                                console.log(`[CommentOps] Comment posted successfully with JavaScript click (selector ${i + 1})!`);
                            }
                            catch (jsClickError) {
                                console.log(`[CommentOps] JavaScript click failed with selector ${i + 1}: ${jsClickError.message}`);
                                // Strategy 3: Force click with JavaScript
                                try {
                                    await this.driver.executeScript(`
                    const element = arguments[0];
                    element.style.pointerEvents = 'auto';
                    element.click();
                  `, element);
                                    clickSuccess = true;
                                    console.log(`[CommentOps] Comment posted successfully with force click (selector ${i + 1})!`);
                                }
                                catch (forceClickError) {
                                    console.log(`[CommentOps] Force click failed with selector ${i + 1}: ${forceClickError.message}`);
                                }
                            }
                        }
                        if (clickSuccess) {
                            await this.randomDelay(3000, 5000);
                            return { success: true, data: { antiDetection: useAntiDetection } };
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
                    return { success: false, error: `Failed to submit comment after 3 attempts: ${error}` };
                }
            }
        }
        return { success: false, error: 'All submit attempts failed' };
    }
    /**
     * Process interaction with a specific tweet (like and comment)
     * Similar to processTweetInteractionWithArticle in cbp.ts
     */
    async processTweetInteraction(tweetData, options = {}) {
        const { enableLike = true, enableComment = true, commentText, useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium' } = options;
        let liked = false;
        let commented = false;
        try {
            // Step 1: Like the tweet
            if (enableLike) {
                try {
                    const likeButton = await this.driver.executeScript(`
            const tweet = arguments[0];
            const likeButton = tweet.querySelector('[data-testid="like"]');
            return likeButton;
          `, tweetData.element);
                    if (likeButton) {
                        await this.driver.executeScript('arguments[0].click();', likeButton);
                        await this.randomDelay(1000, 2000);
                        liked = true;
                    }
                }
                catch (error) {
                    // Failed to like, continue
                }
                // Wait after like
                await this.randomDelay(2000, 3000);
            }
            // Step 2: Comment on the tweet
            if (enableComment) {
                try {
                    const replyButton = await this.driver.executeScript(`
            const tweet = arguments[0];
            const replyButton = tweet.querySelector('[data-testid="reply"]');
            return replyButton;
          `, tweetData.element);
                    if (replyButton) {
                        await this.driver.executeScript('arguments[0].click();', replyButton);
                        await this.randomDelay(2000, 3000);
                        // Use comment text if provided, otherwise use default
                        const finalCommentText = commentText || '👍';
                        const commentResult = await this.commentOnFirstTweet(finalCommentText, {
                            useAntiDetection,
                            behavioralPattern,
                            mouseIntensity
                        });
                        commented = commentResult.success;
                        // Close comment modal if opened
                        // Try to close modal without navigating away (use ESC key first, then back button)
                        try {
                            // First try ESC key - less likely to navigate away
                            await this.driver.actions().sendKeys('\uE00C').perform();
                            await this.randomDelay(1500, 2000);
                            // Check if modal is still open by looking for input field
                            try {
                                const inputCheck = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="tweetTextarea_0"]'));
                                if (inputCheck.length > 0) {
                                    // Modal still open, try back button
                                    console.log('[CommentOps] ESC key did not close modal, trying back button');
                                    const backButton = await this.driver.findElement(selenium_webdriver_1.By.css('[data-testid="app-bar-back"]'));
                                    await backButton.click();
                                    await this.randomDelay(1500, 2000);
                                }
                                else {
                                    console.log('[CommentOps] Modal closed successfully with ESC key');
                                }
                            }
                            catch (checkError) {
                                // If we can't find input, assume modal is closed
                                console.log('[CommentOps] Could not verify modal state, assuming closed');
                            }
                        }
                        catch (e) {
                            // ESC failed, try back button
                            try {
                                console.log('[CommentOps] ESC key failed, trying back button');
                                const backButton = await this.driver.findElement(selenium_webdriver_1.By.css('[data-testid="app-bar-back"]'));
                                await backButton.click();
                                await this.randomDelay(1500, 2000);
                            }
                            catch (e2) {
                                console.log('[CommentOps] Failed to close modal with both ESC and back button');
                                // Ignore - modal may have closed automatically or we're on wrong page
                            }
                        }
                    }
                }
                catch (error) {
                    // Failed to comment, continue
                }
            }
            return { liked, commented };
        }
        catch (error) {
            return { liked, commented };
        }
    }
}
exports.CommentOps = CommentOps;
//# sourceMappingURL=comment.js.map