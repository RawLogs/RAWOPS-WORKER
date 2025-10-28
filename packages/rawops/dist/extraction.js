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
            }
            catch (xpathError) {
                // Try remaining XPath selectors (indices 1-8)
                for (let i = 1; i < 9; i++) {
                    try {
                        const contentElement = await this.driver.findElement(selenium_webdriver_1.By.xpath(contentSelectors[i]));
                        content = await contentElement.getText();
                        break;
                    }
                    catch (xpathError2) {
                        continue;
                    }
                }
                // Fallback to CSS selectors if XPath failed
                if (!content) {
                    for (const selector of contentSelectors.slice(9)) { // CSS selectors start from index 9
                        try {
                            const contentElement = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                            content = await contentElement.getText();
                            break;
                        }
                        catch (cssError) {
                            continue;
                        }
                    }
                }
            }
            if (content && content.trim().length > 0) {
                // Clean the extracted content to remove usernames and image descriptions (like legacy)
                if (cleanContent) {
                    const cleanedContent = this.cleanExtractedContent(content.trim(), username);
                    return cleanedContent;
                }
                else {
                    return content.trim();
                }
            }
            else {
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
                        }
                    }
                }
                catch (altError) {
                    // Ignore
                }
                if (!content) {
                    // Debug: Check what elements are actually available (like legacy)
                    try {
                        const firstTweet = await this.driver.findElement(selenium_webdriver_1.By.css('article[data-testid="tweet"]:first-child'));
                        // Check for any text elements
                        const allElements = await firstTweet.findElements(selenium_webdriver_1.By.css('*'));
                        // Try to find any element with text
                        for (let i = 0; i < Math.min(allElements.length, 10); i++) {
                            try {
                                const element = allElements[i];
                                const text = await element.getText();
                                if (text && text.trim().length > 10 && text.trim().length < 500) {
                                    if (!content) {
                                        content = text.trim();
                                    }
                                }
                            }
                            catch (debugError) {
                                continue;
                            }
                        }
                    }
                    catch (debugError) {
                        // Ignore
                    }
                    if (!content) {
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
                // Ignore
            }
            // Extract tweet content (like xaicommentReplyService.js)
            let content = '';
            try {
                const contentElement = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="tweetText"]'));
                content = await contentElement.getText();
            }
            catch (error) {
                // Ignore
            }
            // Extract tweet URL (like xaicommentReplyService.js)
            let tweetUrl = '';
            try {
                const timeElement = await tweetElement.findElement(selenium_webdriver_1.By.css('time'));
                const tweetUrlElement = await timeElement.findElement(selenium_webdriver_1.By.xpath('..'));
                tweetUrl = await tweetUrlElement.getAttribute('href');
            }
            catch (error) {
                // Ignore
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
                // Ignore
            }
            try {
                const likeButton = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="unlike"], [data-testid="like"]'));
                const likeCountElement = await likeButton.findElement(selenium_webdriver_1.By.css('span'));
                const likeCountText = await likeCountElement.getText();
                likeCount = parseInt(likeCountText) || 0;
            }
            catch (error) {
                // Ignore
            }
            try {
                const retweetButton = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="retweet"]'));
                const retweetCountElement = await retweetButton.findElement(selenium_webdriver_1.By.css('span'));
                const retweetCountText = await retweetCountElement.getText();
                retweetCount = parseInt(retweetCountText) || 0;
            }
            catch (error) {
                // Ignore
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
                    }
                }
                catch (error) {
                    continue;
                }
            }
            return replyComments;
        }
        catch (error) {
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
            if (tweetCount <= 1) {
                return false;
            }
            // Additional check: look for reply-specific elements
            try {
                const replyElements = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="reply"]'));
                const replyCount = replyElements.length;
                // Also check for comment-like elements
                const commentElements = await this.driver.findElements(selenium_webdriver_1.By.css('[role="article"]'));
                return tweetCount > 1 || replyCount > 0;
            }
            catch (replyError) {
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
            // Get all cellInnerDiv elements
            const cellElements = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="cellInnerDiv"]'));
            if (cellElements.length === 0) {
                return { isLastCellFromProfile: false, lastCellContent: null, lastCellUsername: null };
            }
            // Get the last cellInnerDiv (index -1)
            const lastCell = cellElements[cellElements.length - 1];
            // Debug: Check if last cell contains a tweet
            try {
                const hasTweet = await lastCell.findElements(selenium_webdriver_1.By.css('[data-testid="tweet"]'));
                if (hasTweet.length === 0) {
                    return { isLastCellFromProfile: false, lastCellContent: null, lastCellUsername: null };
                }
            }
            catch (debugError) {
                // Ignore
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
                            break;
                        }
                    }
                    catch (selectorError) {
                        continue;
                    }
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
                            break;
                        }
                    }
                    catch (selectorError) {
                        continue;
                    }
                }
                // Check if the last cell is from the current profile
                const isLastCellFromProfile = lastCellUsername === currentProfileHandle;
                return {
                    isLastCellFromProfile,
                    lastCellContent,
                    lastCellUsername
                };
            }
            catch (extractionError) {
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
            // Get all tweet elements
            const tweetElements = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="tweet"]'));
            if (tweetElements.length === 0) {
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
                return { hasOtherUserTweet: false, randomTweetContent: null, randomTweetUsername: null, randomTweetElement: null };
            }
            // Select a random tweet from the collection
            const randomIndex = Math.floor(Math.random() * otherUserTweets.length);
            const randomTweet = otherUserTweets[randomIndex];
            return {
                hasOtherUserTweet: true,
                randomTweetContent: randomTweet.content,
                randomTweetUsername: randomTweet.username,
                randomTweetElement: randomTweet.element
            };
        }
        catch (error) {
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
            let commentContent = null;
            let commentUsername = null;
            let commentUrl = null;
            // Extract comment content
            try {
                const contentElement = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="tweetText"]'));
                commentContent = await contentElement.getText();
            }
            catch (contentError) {
                // Ignore
            }
            // Extract comment username
            try {
                const usernameElement = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="User-Name"] a[role="link"]'));
                const href = await usernameElement.getAttribute('href');
                commentUsername = href.replace('/', '');
            }
            catch (usernameError) {
                // Ignore
            }
            // Extract comment URL
            try {
                const timeElement = await tweetElement.findElement(selenium_webdriver_1.By.css('time'));
                const tweetUrlElement = await timeElement.findElement(selenium_webdriver_1.By.xpath('..'));
                commentUrl = await tweetUrlElement.getAttribute('href');
            }
            catch (urlError) {
                // Ignore
            }
            return {
                commentContent,
                commentUsername,
                commentUrl
            };
        }
        catch (error) {
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