"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractionOps = void 0;
const selenium_webdriver_1 = require("selenium-webdriver");
const base_1 = require("./base");
class ExtractionOps extends base_1.BaseOps {
    constructor(driver) {
        super(driver);
    }
    /**
     * Extract post content from the first tweet on the page (legacy integration)
     * This is the main method for content extraction with comprehensive fallback
     */
    async getPostContent(options = {}) {
        try {
            const { includeEmojis = true, cleanContent = true, username = null, debugMode = false } = options;
            if (debugMode) {
                console.log('[ExtractionOps] Extracting post content...');
            }
            // Enhanced legacy selectors from xaicommentService.js with comprehensive fallback
            const contentSelectors = [
                // Primary XPath selectors
                '//article[@data-testid="tweet"][1]//*[@data-testid="tweetText"]',
                '//article[@data-testid="tweet"][1]//div[@lang]//span[@class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3"]',
                '//article[@data-testid="tweet"][1]//div[@data-testid="tweet"]//span[@class="css-1jxf684"]',
                '//article[@data-testid="tweet"][1]//div[contains(@class,"css-146c3p1")][@dir="auto"]',
                '//article[@data-testid="tweet"][1]//div[@lang]',
                '//article[@data-testid="tweet"][1]//span[contains(@class,"css-1jxf684")]',
                // Additional XPath selectors
                '//article[@data-testid="tweet"][1]//div[@data-testid="tweetText"]',
                '//article[@data-testid="tweet"][1]//div[@role="textbox"]',
                '//article[@data-testid="tweet"][1]//div[@contenteditable="true"]',
                // CSS selectors
                '[data-testid="tweet"]:first-child [data-testid="tweetText"]',
                '[data-testid="tweet"]:first-child div[lang]',
                'article[data-testid="tweet"]:first-child div[lang]',
                '[data-testid="tweet"]:first-child span.css-1jxf684',
                '[data-testid="tweet"]:first-child div[data-testid="tweetText"]',
                '[data-testid="tweet"]:first-child div[role="textbox"]',
                '[data-testid="tweet"]:first-child div[contenteditable="true"]'
            ];
            let content = null;
            // Try xpath first for tweet content (like legacy)
            try {
                const contentElement = await this.driver.findElement(selenium_webdriver_1.By.xpath(contentSelectors[0]));
                // Get the full content including emojis and images
                const fullContent = await contentElement.getText();
                // Also try to get alt text from images/emojis (like legacy)
                if (includeEmojis) {
                    try {
                        const emojiElements = await this.driver.findElements(selenium_webdriver_1.By.xpath('//img[@alt]'));
                        let emojiText = '';
                        for (const element of emojiElements) {
                            const altText = await element.getAttribute('alt');
                            if (altText) {
                                emojiText += altText + ' ';
                            }
                        }
                        if (emojiText && !fullContent.includes(emojiText.trim())) {
                            content = fullContent + ' ' + emojiText.trim();
                        }
                        else {
                            content = fullContent;
                        }
                    }
                    catch (emojiError) {
                        content = fullContent;
                    }
                }
                else {
                    content = fullContent;
                }
                if (debugMode) {
                    console.log('[ExtractionOps] Post content extracted successfully with xpath!');
                    // Debug: Log additional information (like legacy)
                    try {
                        const innerHTML = await contentElement.getAttribute('innerHTML');
                        console.log(`[ExtractionOps] Content innerHTML length: ${innerHTML ? innerHTML.length : 0}`);
                    }
                    catch (debugError) {
                        // Ignore debug errors
                    }
                }
            }
            catch (xpathError) {
                if (debugMode) {
                    console.log(`[ExtractionOps] XPath selector 0 failed: ${xpathError.message}`);
                }
                // Try remaining XPath selectors (indices 1-8)
                for (let i = 1; i < 9; i++) {
                    try {
                        const contentElement = await this.driver.findElement(selenium_webdriver_1.By.xpath(contentSelectors[i]));
                        content = await contentElement.getText();
                        if (debugMode) {
                            console.log(`[ExtractionOps] Post content extracted with XPath selector ${i}: ${contentSelectors[i]}`);
                        }
                        break;
                    }
                    catch (xpathError2) {
                        if (debugMode) {
                            console.log(`[ExtractionOps] XPath selector ${i} failed: ${xpathError2.message}`);
                        }
                        continue;
                    }
                }
                // Fallback to CSS selectors if XPath failed
                if (!content) {
                    if (debugMode) {
                        console.log('[ExtractionOps] All XPath failed, trying CSS selectors...');
                    }
                    for (const selector of contentSelectors.slice(9)) { // CSS selectors start from index 9
                        try {
                            const contentElement = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                            content = await contentElement.getText();
                            if (debugMode) {
                                console.log(`[ExtractionOps] Post content extracted with CSS selector: ${selector}`);
                            }
                            break;
                        }
                        catch (cssError) {
                            if (debugMode) {
                                console.log(`[ExtractionOps] CSS selector failed: ${cssError.message}`);
                            }
                            continue;
                        }
                    }
                }
            }
            if (content && content.trim().length > 0) {
                // Clean the extracted content to remove usernames and image descriptions (like legacy)
                if (cleanContent) {
                    const cleanedContent = this.cleanExtractedContent(content.trim(), username);
                    if (debugMode) {
                        console.log(`[ExtractionOps] Content extracted: "${cleanedContent}"`);
                    }
                    return cleanedContent;
                }
                else {
                    if (debugMode) {
                        console.log(`[ExtractionOps] Content extracted (uncleaned): "${content.trim()}"`);
                    }
                    return content.trim();
                }
            }
            else {
                if (debugMode) {
                    console.log('[ExtractionOps] Could not extract post content, trying alternative methods...');
                }
                // Try alternative extraction methods (like legacy)
                try {
                    // Method 1: Try to get all text from the first tweet article
                    const firstTweet = await this.driver.findElement(selenium_webdriver_1.By.css('article[data-testid="tweet"]:first-child'));
                    const allText = await firstTweet.getText();
                    if (allText && allText.trim().length > 0) {
                        // Extract just the main content (remove username, timestamp, etc.)
                        const lines = allText.split('\n');
                        const contentLines = lines.filter(line => line.trim().length > 0 &&
                            !line.includes('@') &&
                            !line.includes('·') &&
                            !line.includes('Replying to') &&
                            !line.includes('Show this thread'));
                        if (contentLines.length > 0) {
                            content = contentLines.join(' ').trim();
                            if (debugMode) {
                                console.log(`[ExtractionOps] Extracted post content via alternative method: "${content.substring(0, 100)}..."`);
                            }
                        }
                    }
                }
                catch (altError) {
                    if (debugMode) {
                        console.log('[ExtractionOps] Alternative extraction method also failed');
                    }
                }
                if (!content) {
                    if (debugMode) {
                        console.log('[ExtractionOps] All extraction methods failed, debugging DOM structure...');
                    }
                    // Debug: Check what elements are actually available (like legacy)
                    try {
                        const firstTweet = await this.driver.findElement(selenium_webdriver_1.By.css('article[data-testid="tweet"]:first-child'));
                        const tweetHTML = await firstTweet.getAttribute('innerHTML');
                        console.log(`[ExtractionOps] First tweet HTML length: ${tweetHTML ? tweetHTML.length : 0}`);
                        // Check for any text elements
                        const allElements = await firstTweet.findElements(selenium_webdriver_1.By.css('*'));
                        console.log(`[ExtractionOps] Found ${allElements.length} elements in first tweet`);
                        // Try to find any element with text
                        for (let i = 0; i < Math.min(allElements.length, 10); i++) {
                            try {
                                const element = allElements[i];
                                const tagName = await element.getTagName();
                                const text = await element.getText();
                                if (text && text.trim().length > 10 && text.trim().length < 500) {
                                    console.log(`[ExtractionOps] Found potential content in ${tagName}: "${text.substring(0, 50)}..."`);
                                    if (!content) {
                                        content = text.trim();
                                        console.log(`[ExtractionOps] Using fallback content: "${content.substring(0, 100)}..."`);
                                    }
                                }
                            }
                            catch (debugError) {
                                continue;
                            }
                        }
                    }
                    catch (debugError) {
                        console.log(`[ExtractionOps] Debug failed: ${debugError.message}`);
                    }
                    if (!content) {
                        if (debugMode) {
                            console.log('[ExtractionOps] All extraction methods failed, proceeding without content');
                        }
                        return null;
                    }
                }
                // Clean the content if requested
                if (cleanContent && content) {
                    const cleanedContent = this.cleanExtractedContent(content, username);
                    return cleanedContent;
                }
                return content;
            }
        }
        catch (error) {
            console.error('[ExtractionOps] Error extracting post content:', error);
            return null;
        }
    }
    /**
     * Extract metadata from a tweet element (legacy integration)
     * This is the main method for extracting comprehensive tweet metadata
     */
    /**
     * Extract metadata from a tweet element (like xaicommentReplyService.js)
     * @param tweetElement - The tweet element
     * @param index - Index of the tweet
     * @returns Tweet metadata object
     */
    async extractTweetMetadata(tweetElement, index) {
        try {
            // Extract username (like xaicommentReplyService.js)
            let username = '';
            try {
                const usernameElement = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="User-Name"] a[role="link"]'));
                const href = await usernameElement.getAttribute('href');
                username = href.replace('/', '');
            }
            catch (error) {
                console.log(`[ExtractionOps] Could not extract username for tweet ${index}`);
            }
            // Extract tweet content (like xaicommentReplyService.js)
            let content = '';
            try {
                const contentElement = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="tweetText"]'));
                content = await contentElement.getText();
            }
            catch (error) {
                console.log(`[ExtractionOps] Could not extract content for tweet ${index}`);
            }
            // Extract tweet URL (like xaicommentReplyService.js)
            let tweetUrl = '';
            try {
                const timeElement = await tweetElement.findElement(selenium_webdriver_1.By.css('time'));
                const tweetUrlElement = await timeElement.findElement(selenium_webdriver_1.By.xpath('..'));
                tweetUrl = await tweetUrlElement.getAttribute('href');
            }
            catch (error) {
                console.log(`[ExtractionOps] Could not extract tweet URL for tweet ${index}`);
            }
            // Extract engagement metrics (like xaicommentReplyService.js)
            let likeCount = 0;
            let retweetCount = 0;
            let replyCount = 0;
            try {
                const replyButton = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="reply"]'));
                const replyCountElement = await replyButton.findElement(selenium_webdriver_1.By.css('span'));
                const replyCountText = await replyCountElement.getText();
                replyCount = parseInt(replyCountText) || 0;
            }
            catch (error) {
                console.log(`[ExtractionOps] Could not extract reply count for tweet ${index}`);
            }
            try {
                const likeButton = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="unlike"], [data-testid="like"]'));
                const likeCountElement = await likeButton.findElement(selenium_webdriver_1.By.css('span'));
                const likeCountText = await likeCountElement.getText();
                likeCount = parseInt(likeCountText) || 0;
            }
            catch (error) {
                console.log(`[ExtractionOps] Could not extract like count for tweet ${index}`);
            }
            try {
                const retweetButton = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="retweet"]'));
                const retweetCountElement = await retweetButton.findElement(selenium_webdriver_1.By.css('span'));
                const retweetCountText = await retweetCountElement.getText();
                retweetCount = parseInt(retweetCountText) || 0;
            }
            catch (error) {
                console.log(`[ExtractionOps] Could not extract retweet count for tweet ${index}`);
            }
            return {
                username,
                content: content.trim(),
                likeCount,
                retweetCount,
                replyCount,
                isReply: index > 0,
                index,
                timestamp: new Date().toISOString(),
                element: tweetElement,
                tweetUrl
            };
        }
        catch (error) {
            console.error(`[ExtractionOps] Error extracting tweet metadata for index ${index}:`, error);
            return null;
        }
    }
    /**
     * Detect reply comments in the current tweet page (legacy integration)
     * This is the main method for detecting and filtering reply comments
     */
    /**
     * Detect reply comments in the current tweet page (like xaicommentReplyService.js)
     * @returns {Promise<TweetMetadata[]>} Array of reply comment objects with metadata
     */
    async detectReplyComments() {
        try {
            console.log('[ExtractionOps] Detecting reply comments in current page...');
            // Wait for page to load completely (like legacy)
            await this.randomDelay(2000, 3000);
            // Find all tweet articles in the conversation (like legacy)
            const tweetElements = await this.driver.findElements(selenium_webdriver_1.By.css('article[data-testid="tweet"]'));
            const replyComments = [];
            for (let i = 0; i < tweetElements.length; i++) {
                try {
                    const tweetElement = tweetElements[i];
                    // Skip the main tweet (first one) - we only want replies (like legacy)
                    if (i === 0)
                        continue;
                    // Extract tweet metadata (like legacy)
                    const tweetData = await this.extractTweetMetadata(tweetElement, i);
                    if (tweetData && tweetData.isReply) {
                        replyComments.push(tweetData);
                        console.log(`[ExtractionOps] Found reply comment from @${tweetData.username}: "${tweetData.content.substring(0, 50)}..."`);
                    }
                }
                catch (error) {
                    console.log(`[ExtractionOps] Error processing tweet element ${i}: ${error.message}`);
                    continue;
                }
            }
            console.log(`[ExtractionOps] Total reply comments detected: ${replyComments.length}`);
            return replyComments;
        }
        catch (error) {
            console.log(`[ExtractionOps] Error detecting reply comments: ${error.message}`);
            return [];
        }
    }
    /**
     * Clean extracted content to remove usernames and image descriptions (legacy integration)
     */
    cleanExtractedContent(content, username = null) {
        if (!content)
            return '';
        let cleanedContent = content;
        // Remove username mentions if provided
        if (username) {
            const usernamePattern = new RegExp(`@${username}\\b`, 'gi');
            cleanedContent = cleanedContent.replace(usernamePattern, '');
        }
        // Remove common image descriptions and metadata
        const imagePatterns = [
            /\[Image\]/gi,
            /\[Video\]/gi,
            /\[GIF\]/gi,
            /\[Link\]/gi,
            /Image may contain:/gi,
            /This image contains:/gi,
            /Alt text:/gi,
            /Description:/gi
        ];
        for (const pattern of imagePatterns) {
            cleanedContent = cleanedContent.replace(pattern, '');
        }
        // Clean up extra whitespace
        cleanedContent = cleanedContent.replace(/\s+/g, ' ').trim();
        return cleanedContent;
    }
    /**
     * Check if a reply comment is worth responding to based on criteria (legacy integration)
     */
    isReplyWorthResponding(replyComment, criteria = {}) {
        const { minLikeCount = 0, minReplyCount = 0, maxContentLength = 500, minContentLength = 10, excludeKeywords = [], requireKeywords = [] } = criteria;
        // Check content length
        if (replyComment.content.length < minContentLength || replyComment.content.length > maxContentLength) {
            return false;
        }
        // Check engagement metrics
        if (replyComment.likeCount < minLikeCount || replyComment.replyCount < minReplyCount) {
            return false;
        }
        // Check for excluded keywords
        const contentLower = replyComment.content.toLowerCase();
        for (const keyword of excludeKeywords) {
            if (contentLower.includes(keyword.toLowerCase())) {
                return false;
            }
        }
        // Check for required keywords (if any)
        if (requireKeywords.length > 0) {
            const hasRequiredKeyword = requireKeywords.some(keyword => contentLower.includes(keyword.toLowerCase()));
            if (!hasRequiredKeyword) {
                return false;
            }
        }
        return true;
    }
    /**
     * Extract all tweets from current page (main tweet + replies)
     */
    async extractAllTweets() {
        try {
            await this.randomDelay(2000, 3000);
            const tweetElements = await this.driver.findElements(selenium_webdriver_1.By.css('article[data-testid="tweet"]'));
            const tweets = [];
            for (let i = 0; i < tweetElements.length; i++) {
                try {
                    const tweetElement = tweetElements[i];
                    const tweetData = await this.extractTweetMetadata(tweetElement, i);
                    if (tweetData) {
                        tweets.push(tweetData);
                    }
                }
                catch (error) {
                    continue;
                }
            }
            return tweets;
        }
        catch (error) {
            console.error('[ExtractionOps] Error extracting all tweets:', error);
            return [];
        }
    }
    /**
     * Extract only the main tweet (first tweet) from current page
     */
    async extractMainTweet() {
        try {
            await this.randomDelay(2000, 3000);
            const tweetElements = await this.driver.findElements(selenium_webdriver_1.By.css('article[data-testid="tweet"]'));
            if (tweetElements.length === 0) {
                return null;
            }
            const mainTweetElement = tweetElements[0];
            return await this.extractTweetMetadata(mainTweetElement, 0);
        }
        catch (error) {
            console.error('[ExtractionOps] Error extracting main tweet:', error);
            return null;
        }
    }
    /**
     * Extract only reply tweets (excluding main tweet) from current page
     */
    async extractReplyTweets() {
        try {
            await this.randomDelay(2000, 3000);
            const tweetElements = await this.driver.findElements(selenium_webdriver_1.By.css('article[data-testid="tweet"]'));
            const replyTweets = [];
            // Skip the first tweet (main tweet) and process replies
            for (let i = 1; i < tweetElements.length; i++) {
                try {
                    const tweetElement = tweetElements[i];
                    const tweetData = await this.extractTweetMetadata(tweetElement, i);
                    if (tweetData && tweetData.isReply) {
                        replyTweets.push(tweetData);
                    }
                }
                catch (error) {
                    continue;
                }
            }
            return replyTweets;
        }
        catch (error) {
            console.error('[ExtractionOps] Error extracting reply tweets:', error);
            return [];
        }
    }
    /**
     * Get tweet count on current page
     */
    async getTweetCount() {
        try {
            const tweetElements = await this.driver.findElements(selenium_webdriver_1.By.css('article[data-testid="tweet"]'));
            return tweetElements.length;
        }
        catch (error) {
            console.error('[ExtractionOps] Error getting tweet count:', error);
            return 0;
        }
    }
    /**
     * Check if current page has replies
     */
    async hasReplies() {
        try {
            const tweetCount = await this.getTweetCount();
            console.log(`[ExtractionOps] Found ${tweetCount} tweets on page`);
            if (tweetCount <= 1) {
                console.log('[ExtractionOps] No replies found (only main tweet)');
                return false;
            }
            // Additional check: look for reply-specific elements
            try {
                const replyElements = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="reply"]'));
                const replyCount = replyElements.length;
                console.log(`[ExtractionOps] Found ${replyCount} reply elements`);
                // Also check for comment-like elements
                const commentElements = await this.driver.findElements(selenium_webdriver_1.By.css('[role="article"]'));
                console.log(`[ExtractionOps] Found ${commentElements.length} article elements`);
                return tweetCount > 1 || replyCount > 0;
            }
            catch (replyError) {
                console.log('[ExtractionOps] Reply detection failed, using tweet count:', replyError);
                return tweetCount > 1;
            }
        }
        catch (error) {
            console.error('[ExtractionOps] Error checking for replies:', error);
            return false;
        }
    }
    /**
     * Check if the last cellInnerDiv contains a tweet from the current profile handle
     * This helps determine if we should reply to a comment instead of the main post
     */
    async checkLastCellForProfileHandle(currentProfileHandle) {
        try {
            console.log(`[ExtractionOps] Checking last cellInnerDiv for profile handle: ${currentProfileHandle}`);
            // Get all cellInnerDiv elements
            const cellElements = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="cellInnerDiv"]'));
            if (cellElements.length === 0) {
                console.log('[ExtractionOps] No cellInnerDiv elements found');
                return { isLastCellFromProfile: false, lastCellContent: null, lastCellUsername: null };
            }
            console.log(`[ExtractionOps] Found ${cellElements.length} cellInnerDiv elements`);
            // Get the last cellInnerDiv (index -1)
            const lastCell = cellElements[cellElements.length - 1];
            // Debug: Check if last cell contains a tweet
            try {
                const hasTweet = await lastCell.findElements(selenium_webdriver_1.By.css('[data-testid="tweet"]'));
                console.log(`[ExtractionOps] Last cell contains ${hasTweet.length} tweet elements`);
                if (hasTweet.length === 0) {
                    console.log('[ExtractionOps] Last cell does not contain a tweet, skipping analysis');
                    return { isLastCellFromProfile: false, lastCellContent: null, lastCellUsername: null };
                }
            }
            catch (debugError) {
                console.log('[ExtractionOps] Could not check for tweet in last cell');
            }
            try {
                // Extract username from the last cell with multiple selectors
                let lastCellUsername = null;
                const usernameSelectors = [
                    '[data-testid="User-Name"] a[role="link"]',
                    '[data-testid="User-Name"] a',
                    'a[href^="/"][role="link"]',
                    'a[href*="/"]'
                ];
                for (const selector of usernameSelectors) {
                    try {
                        const usernameElement = await lastCell.findElement(selenium_webdriver_1.By.css(selector));
                        const href = await usernameElement.getAttribute('href');
                        if (href && href.startsWith('/') && !href.includes('/status/')) {
                            lastCellUsername = href.replace('/', '');
                            console.log(`[ExtractionOps] Last cell username: ${lastCellUsername} (using selector: ${selector})`);
                            break;
                        }
                    }
                    catch (selectorError) {
                        continue;
                    }
                }
                if (!lastCellUsername) {
                    console.log('[ExtractionOps] Could not extract username from last cell with any selector');
                }
                // Extract content from the last cell with multiple selectors
                let lastCellContent = null;
                const contentSelectors = [
                    '[data-testid="tweetText"]',
                    '[data-testid="tweet"] [data-testid="tweetText"]',
                    'div[lang] span',
                    'div[dir="auto"]'
                ];
                for (const selector of contentSelectors) {
                    try {
                        const contentElement = await lastCell.findElement(selenium_webdriver_1.By.css(selector));
                        const text = await contentElement.getText();
                        if (text && text.trim().length > 0) {
                            lastCellContent = text.trim();
                            console.log(`[ExtractionOps] Last cell content: "${lastCellContent?.substring(0, 100)}..." (using selector: ${selector})`);
                            break;
                        }
                    }
                    catch (selectorError) {
                        continue;
                    }
                }
                if (!lastCellContent) {
                    console.log('[ExtractionOps] Could not extract content from last cell with any selector');
                }
                // Check if the last cell is from the current profile
                const isLastCellFromProfile = lastCellUsername === currentProfileHandle;
                console.log(`[ExtractionOps] Last cell analysis:`);
                console.log(`  - Username: ${lastCellUsername}`);
                console.log(`  - Current profile: ${currentProfileHandle}`);
                console.log(`  - Is from profile: ${isLastCellFromProfile}`);
                console.log(`  - Has content: ${!!lastCellContent}`);
                return {
                    isLastCellFromProfile,
                    lastCellContent,
                    lastCellUsername
                };
            }
            catch (extractionError) {
                console.log(`[ExtractionOps] Error extracting data from last cell: ${extractionError.message}`);
                return { isLastCellFromProfile: false, lastCellContent: null, lastCellUsername: null };
            }
        }
        catch (error) {
            console.error('[ExtractionOps] Error checking last cell for profile handle:', error);
            return { isLastCellFromProfile: false, lastCellContent: null, lastCellUsername: null };
        }
    }
    /**
     * Find a random tweet from OTHER users (not current profile)
     * This helps determine if we should reply to a comment instead of the main post
     */
    async findRandomTweetFromOtherUsers(currentProfileHandle) {
        try {
            console.log(`[ExtractionOps] Finding random tweet from other users (not ${currentProfileHandle})`);
            // Get all tweet elements
            const tweetElements = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="tweet"]'));
            if (tweetElements.length === 0) {
                console.log('[ExtractionOps] No tweet elements found');
                return { hasOtherUserTweet: false, randomTweetContent: null, randomTweetUsername: null, randomTweetElement: null };
            }
            // Collect all tweets from other users
            const otherUserTweets = [];
            // Check all tweets to find tweets from other users
            for (let i = 0; i < tweetElements.length; i++) {
                try {
                    const tweetElement = tweetElements[i];
                    // Extract username from this tweet with improved selectors
                    let tweetUsername = null;
                    const usernameSelectors = [
                        '[data-testid="User-Name"] a[role="link"]',
                        '[data-testid="User-Name"] a',
                        'a[href^="/"][role="link"]',
                        'a[href*="/"]',
                        'a[href^="/"][tabindex="-1"]',
                        'a[href*="/"][tabindex="-1"]'
                    ];
                    for (const selector of usernameSelectors) {
                        try {
                            const usernameElements = await tweetElement.findElements(selenium_webdriver_1.By.css(selector));
                            for (const usernameElement of usernameElements) {
                                const href = await usernameElement.getAttribute('href');
                                if (href && (href.startsWith('/') || href.includes('x.com/')) && !href.includes('/status/') && !href.includes('/photo/') && !href.includes('/analytics') && !href.includes('/hashtag/')) {
                                    // Extract username from both formats: /username or https://x.com/username
                                    if (href.startsWith('/')) {
                                        tweetUsername = href.replace('/', '');
                                    }
                                    else if (href.includes('x.com/')) {
                                        tweetUsername = href.split('x.com/')[1];
                                    }
                                    break;
                                }
                            }
                            if (tweetUsername)
                                break;
                        }
                        catch (selectorError) {
                            continue;
                        }
                    }
                    // If still no username found, try alternative approach
                    if (!tweetUsername) {
                        try {
                            // Look for any link that contains @username pattern
                            const allLinks = await tweetElement.findElements(selenium_webdriver_1.By.css('a'));
                            for (const link of allLinks) {
                                const href = await link.getAttribute('href');
                                if (href && (href.startsWith('/') || href.includes('x.com/')) && !href.includes('/status/') && !href.includes('/photo/') && !href.includes('/analytics') && !href.includes('/hashtag/')) {
                                    // Extract username from both formats: /username or https://x.com/username
                                    if (href.startsWith('/')) {
                                        tweetUsername = href.replace('/', '');
                                    }
                                    else if (href.includes('x.com/')) {
                                        tweetUsername = href.split('x.com/')[1];
                                    }
                                    break;
                                }
                            }
                        }
                        catch (altError) {
                            // Silent fail for alternative approach
                        }
                    }
                    // If this tweet is NOT from the current profile, collect it
                    if (tweetUsername && tweetUsername !== currentProfileHandle) {
                        // Extract content from this tweet with improved selectors
                        let tweetContent = null;
                        const contentSelectors = [
                            '[data-testid="tweetText"]',
                            '[data-testid="tweet"] [dir="auto"]',
                            'div[dir="auto"]',
                            'div[lang]',
                            '.css-146c3p1.r-bcqeeo.r-1ttztb7.r-qvutc0'
                        ];
                        for (const selector of contentSelectors) {
                            try {
                                const contentElements = await tweetElement.findElements(selenium_webdriver_1.By.css(selector));
                                for (const contentElement of contentElements) {
                                    const text = await contentElement.getText();
                                    if (text && text.trim().length > 10) {
                                        tweetContent = text.trim();
                                        break;
                                    }
                                }
                                if (tweetContent)
                                    break;
                            }
                            catch (selectorError) {
                                continue;
                            }
                        }
                        // Add to collection if content found
                        if (tweetContent) {
                            otherUserTweets.push({
                                content: tweetContent,
                                username: tweetUsername,
                                element: tweetElement,
                                index: i
                            });
                        }
                    }
                }
                catch (tweetError) {
                    continue;
                }
            }
            // Check if we found any tweets from other users
            if (otherUserTweets.length === 0) {
                console.log(`[ExtractionOps] No tweets found from other users (all tweets are from ${currentProfileHandle})`);
                return { hasOtherUserTweet: false, randomTweetContent: null, randomTweetUsername: null, randomTweetElement: null };
            }
            // Select a random tweet from the collection
            const randomIndex = Math.floor(Math.random() * otherUserTweets.length);
            const randomTweet = otherUserTweets[randomIndex];
            console.log(`[ExtractionOps] Selected random tweet from @${randomTweet.username}: "${randomTweet.content.substring(0, 50)}..."`);
            return {
                hasOtherUserTweet: true,
                randomTweetContent: randomTweet.content,
                randomTweetUsername: randomTweet.username,
                randomTweetElement: randomTweet.element
            };
        }
        catch (error) {
            console.error('[ExtractionOps] Error finding random tweet from other users:', error);
            return { hasOtherUserTweet: false, randomTweetContent: null, randomTweetUsername: null, randomTweetElement: null };
        }
    }
    /**
     * Find the last tweet from OTHER users (not current profile) - LEGACY METHOD
     * This helps determine if we should reply to a comment instead of the main post
     */
    async findLastTweetFromOtherUsers(currentProfileHandle) {
        // Use the new random method but return with legacy naming
        const result = await this.findRandomTweetFromOtherUsers(currentProfileHandle);
        return {
            hasOtherUserTweet: result.hasOtherUserTweet,
            lastTweetContent: result.randomTweetContent,
            lastTweetUsername: result.randomTweetUsername,
            lastTweetElement: result.randomTweetElement
        };
    }
    /**
     * Extract comment content from a specific tweet element for reply generation
     */
    async extractCommentContentForReply(tweetElement) {
        try {
            console.log('[ExtractionOps] Extracting comment content for reply generation...');
            let commentContent = null;
            let commentUsername = null;
            let commentUrl = null;
            // Extract comment content
            try {
                const contentElement = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="tweetText"]'));
                commentContent = await contentElement.getText();
                console.log(`[ExtractionOps] Comment content: "${commentContent?.substring(0, 100)}..."`);
            }
            catch (contentError) {
                console.log('[ExtractionOps] Could not extract comment content');
            }
            // Extract comment username
            try {
                const usernameElement = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="User-Name"] a[role="link"]'));
                const href = await usernameElement.getAttribute('href');
                commentUsername = href.replace('/', '');
                console.log(`[ExtractionOps] Comment username: ${commentUsername}`);
            }
            catch (usernameError) {
                console.log('[ExtractionOps] Could not extract comment username');
            }
            // Extract comment URL
            try {
                const timeElement = await tweetElement.findElement(selenium_webdriver_1.By.css('time'));
                const tweetUrlElement = await timeElement.findElement(selenium_webdriver_1.By.xpath('..'));
                commentUrl = await tweetUrlElement.getAttribute('href');
                console.log(`[ExtractionOps] Comment URL: ${commentUrl}`);
            }
            catch (urlError) {
                console.log('[ExtractionOps] Could not extract comment URL');
            }
            return {
                commentContent,
                commentUsername,
                commentUrl
            };
        }
        catch (error) {
            console.error('[ExtractionOps] Error extracting comment content for reply:', error);
            return {
                commentContent: null,
                commentUsername: null,
                commentUrl: null
            };
        }
    }
    /**
     * Extract tweet URL from current page
     */
    async getCurrentTweetUrl() {
        try {
            const mainTweet = await this.extractMainTweet();
            return mainTweet?.tweetUrl || null;
        }
        catch (error) {
            console.error('[ExtractionOps] Error extracting tweet URL:', error);
            return null;
        }
    }
}
exports.ExtractionOps = ExtractionOps;
//# sourceMappingURL=extraction.js.map