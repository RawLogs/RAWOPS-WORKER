"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileOps = void 0;
exports.calculateFollowRatio = calculateFollowRatio;
const selenium_webdriver_1 = require("selenium-webdriver");
const base_1 = require("./base");
/**
 * ProfileOps class for profile-related operations
 * Includes profile extraction, follow/unfollow, and profile analysis
 */
class ProfileOps extends base_1.BaseOps {
    constructor(driver) {
        super(driver);
    }
    /**
     * Parse count text (e.g., "1.2K" -> 1200, "5.5M" -> 5500000, "1,843" -> 1843)
     */
    parseCount(text) {
        if (!text)
            return 0;
        // Remove all non-numeric characters except digits, commas, dots, K, M, B
        let cleanText = text.replace(/[^\d.,KMB]/g, '').toUpperCase();
        // Handle K, M, B suffixes first
        if (cleanText.includes('K')) {
            const numberPart = cleanText.replace('K', '');
            // Handle both comma and dot as decimal separators for K
            const normalizedNumber = numberPart.replace(/,/g, '.');
            const number = parseFloat(normalizedNumber);
            return Math.floor(number * 1000);
        }
        else if (cleanText.includes('M')) {
            const numberPart = cleanText.replace('M', '');
            // Handle both comma and dot as decimal separators for M
            const normalizedNumber = numberPart.replace(/,/g, '.');
            const number = parseFloat(normalizedNumber);
            return Math.floor(number * 1000000);
        }
        else if (cleanText.includes('B')) {
            const numberPart = cleanText.replace('B', '');
            // Handle both comma and dot as decimal separators for B
            const normalizedNumber = numberPart.replace(/,/g, '.');
            const number = parseFloat(normalizedNumber);
            return Math.floor(number * 1000000000);
        }
        else {
            // Handle regular numbers with commas or dots as thousand separators
            // For numbers like "1,843" or "1.843", treat both as thousand separators
            let numberOnly = cleanText;
            // If it's a 4+ digit number with comma/dot, treat as thousand separator
            if (cleanText.length >= 4 && (cleanText.includes(',') || cleanText.includes('.'))) {
                // Remove commas and dots (both are thousand separators)
                numberOnly = cleanText.replace(/[,.]/g, '');
            }
            else {
                // For shorter numbers, remove commas and dots
                numberOnly = cleanText.replace(/[,.]/g, '');
            }
            const parsedNumber = parseInt(numberOnly);
            return parsedNumber || 0;
        }
    }
    /**
     * Extract profile data from X profile page
     * Note: This method assumes the page is already loaded. Use ScrollOps separately if you need to scroll.
     * Similar to extractProfileData from legacy_nodejs.js
     */
    async extractProfileData(profileUrl, options = {}) {
        try {
            const { maxTweets = 5 } = options;
            await this.driver.get(profileUrl);
            await this.randomDelay(2000, 3000);
            let profileData = {
                url: profileUrl,
                username: '',
                followers_count: 0,
                following_count: 0,
                bio: '',
                tweets: [],
                extracted_at: new Date().toISOString()
            };
            // Extract username from URL
            const usernameMatch = profileUrl.match(/https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/([^\/\?]+)/);
            profileData.username = usernameMatch ? usernameMatch[1] : 'unknown';
            // Extract followers/following count
            try {
                // Try multiple selectors for different X.com layouts - prioritize verified_followers
                const statsSelectors = [
                    // Priority 1: Direct verified_followers and following links (most reliable)
                    'a[href*="/verified_followers"]',
                    'a[href*="/following"]',
                    // Priority 2: Regular followers links
                    'a[href*="/followers"]',
                    // Priority 3: More specific selectors with spans
                    'a[href*="/verified_followers"] span:first-child',
                    'a[href*="/following"] span:first-child',
                    'a[href*="/followers"] span:first-child',
                    // Priority 4: Old Twitter layout
                    '[data-testid="UserProfileHeader_Items"] a'
                ];
                let followersFound = false;
                let followingFound = false;
                for (const selector of statsSelectors) {
                    try {
                        const elements = await this.findElementsByCss(selector);
                        for (let element of elements) {
                            const text = await element.getText();
                            const href = await element.getAttribute('href');
                            // Check if this is followers link (prioritize verified_followers)
                            if (href && (href.includes('/followers') || href.includes('/verified_followers')) && !followersFound) {
                                const count = this.parseCount(text);
                                if (count > 0) {
                                    profileData.followers_count = count;
                                    followersFound = true;
                                }
                            }
                            // Check if this is following link
                            if (href && href.includes('/following') && !followingFound) {
                                const count = this.parseCount(text);
                                if (count > 0) {
                                    profileData.following_count = count;
                                    followingFound = true;
                                }
                            }
                        }
                        // If we found both, break
                        if (followersFound && followingFound)
                            break;
                    }
                    catch (e) {
                        // Continue to next selector
                        continue;
                    }
                }
                // Fallback: try to find by text content
                if (!followersFound || !followingFound) {
                    const allLinks = await this.findElementsByCss('a');
                    for (let link of allLinks) {
                        try {
                            const text = await link.getText();
                            const href = await link.getAttribute('href');
                            // Check for followers (prioritize verified_followers)
                            if (href && (href.includes('/followers') || href.includes('/verified_followers')) &&
                                (text.includes('Followers') || text.includes('Người theo dõi')) && !followersFound) {
                                const count = this.parseCount(text);
                                if (count > 0) {
                                    profileData.followers_count = count;
                                    followersFound = true;
                                }
                            }
                            // Check for following (English and Vietnamese)
                            if (href && href.includes('/following') &&
                                (text.includes('Following') || text.includes('Đang theo dõi')) && !followingFound) {
                                const count = this.parseCount(text);
                                if (count > 0) {
                                    profileData.following_count = count;
                                    followingFound = true;
                                }
                            }
                        }
                        catch (e) {
                            continue;
                        }
                    }
                }
            }
            catch (e) {
                // Could not extract follower stats
            }
            // Extract bio
            try {
                const bioElement = await this.findElementByCss('[data-testid="UserDescription"]');
                profileData.bio = await bioElement.getText();
            }
            catch (e) {
                // Could not extract bio
            }
            // Extract latest tweets with timestamps
            try {
                const tweetElements = await this.findElementsByCss('[data-testid="tweet"]');
                let attempts = 0;
                for (let tweetElement of tweetElements) {
                    if (attempts >= maxTweets)
                        break;
                    attempts++;
                    try {
                        // Skip pinned tweets
                        const pinnedIndicator = await tweetElement.findElements(selenium_webdriver_1.By.css('[data-testid="pin"]'));
                        if (pinnedIndicator.length > 0) {
                            continue;
                        }
                        // Check if this is a retweet (has retweet indicator)
                        const retweetIndicator = await tweetElement.findElements(selenium_webdriver_1.By.css('[data-testid="socialContext"]'));
                        if (retweetIndicator.length > 0) {
                            const retweetText = await retweetIndicator[0].getText();
                            if (retweetText.includes('Retweeted') || retweetText.includes('Reposted') ||
                                retweetText.includes('đã đăng lại') || retweetText.includes('You reposted')) {
                                continue;
                            }
                        }
                        // Get tweet content from profile page
                        const tweetText = await tweetElement.findElement(selenium_webdriver_1.By.css('[data-testid="tweetText"]'));
                        const tweetContent = await tweetText.getText();
                        // Skip if tweet content is empty or too short
                        if (!tweetContent || tweetContent.trim().length < 10) {
                            continue;
                        }
                        // Get tweet URL from profile page
                        const tweetLink = await tweetElement.findElement(selenium_webdriver_1.By.css('a[href*="/status/"]'));
                        const tweetUrl = await tweetLink.getAttribute('href');
                        // Extract tweet timestamp
                        let tweetDate = null;
                        try {
                            const timeElement = await tweetElement.findElement(selenium_webdriver_1.By.css('time'));
                            const datetime = await timeElement.getAttribute('datetime');
                            if (datetime) {
                                tweetDate = new Date(datetime);
                            }
                        }
                        catch (e) {
                            // Ignore if can't extract timestamp
                        }
                        // Get basic interaction counts
                        let likeCount = 0, retweetCount = 0, replyCount = 0;
                        try {
                            const replyElements = await tweetElement.findElements(selenium_webdriver_1.By.css('[data-testid="reply"]'));
                            if (replyElements.length > 0) {
                                const replyText = await replyElements[0].getText();
                                replyCount = parseInt(replyText.replace(/[^\d]/g, '')) || 0;
                            }
                        }
                        catch (e) {
                            // Ignore if can't get counts
                        }
                        profileData.tweets.push({
                            content: tweetContent,
                            url: tweetUrl,
                            comment_count: replyCount,
                            like_count: likeCount,
                            retweet_count: retweetCount,
                            date: tweetDate
                        });
                    }
                    catch (e) {
                        // Error extracting tweet
                    }
                }
            }
            catch (e) {
                // Could not extract tweets
            }
            return profileData;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Check if already following the profile
     * Similar to isAlreadyFollowing from legacy_nodejs.js
     */
    async isAlreadyFollowing() {
        try {
            const followingSelectors = [
                '//button[@data-testid*="unfollow"]',
                '//button[contains(@aria-label,"Bỏ theo dõi")]',
                '//button[contains(@aria-label,"Unfollow")]',
                '//span[text()="Bỏ theo dõi"]/ancestor::button[1]',
                '//span[text()="Unfollow"]/ancestor::button[1]',
                'button[data-testid*="unfollow"]',
                'button[aria-label*="Bỏ theo dõi"]',
                'button[aria-label*="Unfollow"]',
                // Alternative selectors for following state
                '//button[contains(@aria-label,"Following")]',
                '//span[text()="Following"]/ancestor::button[1]',
                'button[aria-label*="Following"]'
            ];
            // Try xpath first
            try {
                const followingElement = await this.findElementByXpath(followingSelectors[0]);
                const isDisplayed = await followingElement.isDisplayed();
                if (followingElement && isDisplayed) {
                    return true;
                }
            }
            catch (xpathError) {
                // Try CSS selectors
                for (const selector of followingSelectors.slice(1)) {
                    try {
                        const followingElement = await this.findElementByCss(selector);
                        const isDisplayed = await followingElement.isDisplayed();
                        if (followingElement && isDisplayed) {
                            return true;
                        }
                    }
                    catch (e) {
                        continue;
                    }
                }
            }
            return false;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Follow a profile using multiple selectors with anti-detection
     * Similar to followProfile from legacy_nodejs.js
     */
    async followProfile(options = {}) {
        try {
            const { useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium', hoverDuration = 300, clickDelay = 200, includeHover = true } = options;
            const followSelectors = [
                '//button[@data-testid*="follow"]',
                '//button[contains(@aria-label,"Theo dõi")]',
                '//button[contains(@aria-label,"Follow")]',
                '//span[text()="Theo dõi"]/ancestor::button[1]',
                '//span[text()="Follow"]/ancestor::button[1]',
                'button[data-testid*="follow"]',
                'button[aria-label*="Theo dõi"]',
                'button[aria-label*="Follow"]',
                'button:has(span:contains("Theo dõi"))',
                'button:has(span:contains("Follow"))'
            ];
            let followed = false;
            // Try all selectors, starting with xpath, then CSS
            for (let i = 0; i < followSelectors.length; i++) {
                const selector = followSelectors[i];
                const isXpath = i < 5; // First 5 are xpath selectors
                try {
                    let followElement = isXpath
                        ? await this.findElementByXpath(selector)
                        : await this.findElementByCss(selector);
                    // Check if follow button is disabled or not clickable
                    let isDisabled = await followElement.getAttribute('disabled');
                    let ariaDisabled = await followElement.getAttribute('aria-disabled');
                    let isClickable = await followElement.isEnabled();
                    let isDisplayed = await followElement.isDisplayed();
                    if (isDisabled === 'true' || ariaDisabled === 'true' || !isClickable || !isDisplayed) {
                        continue; // Try next selector
                    }
                    if (useAntiDetection) {
                        // Switch behavioral pattern if specified
                        if (behavioralPattern !== this.antiDetection.getCurrentPattern().name) {
                            this.antiDetection.switchPattern(behavioralPattern);
                        }
                        let clickSuccess = false;
                        try {
                            clickSuccess = await this.antiDetection.clickWithMouseMovement(followElement, {
                                hoverDuration,
                                clickDelay,
                                includeHover,
                                pattern: behavioralPattern,
                                intensity: mouseIntensity,
                                includeMicroMovements: true,
                                includePauses: true
                            });
                        }
                        catch (staleError) {
                            // If stale, try all remaining selectors
                            if (staleError.name === 'StaleElementReferenceError' ||
                                staleError.message?.includes('stale element')) {
                                console.log(`[ProfileOps] Follow button stale with selector ${i}, trying all remaining selectors...`);
                                // Try all remaining selectors
                                for (let j = i + 1; j < followSelectors.length; j++) {
                                    const retrySelector = followSelectors[j];
                                    const retryIsXpath = j < 5;
                                    try {
                                        let retryElement = retryIsXpath
                                            ? await this.findElementByXpath(retrySelector)
                                            : await this.findElementByCss(retrySelector);
                                        // Verify element properties
                                        isDisabled = await retryElement.getAttribute('disabled');
                                        ariaDisabled = await retryElement.getAttribute('aria-disabled');
                                        isClickable = await retryElement.isEnabled();
                                        isDisplayed = await retryElement.isDisplayed();
                                        if (isDisabled === 'true' || ariaDisabled === 'true' || !isClickable || !isDisplayed) {
                                            continue; // Try next selector
                                        }
                                        // Try click with selector string for better retry capability
                                        const selectorForClick = retryIsXpath ? undefined : retrySelector;
                                        clickSuccess = await this.antiDetection.clickWithMouseMovement(selectorForClick || retryElement, {
                                            hoverDuration,
                                            clickDelay,
                                            includeHover,
                                            pattern: behavioralPattern,
                                            intensity: mouseIntensity,
                                            includeMicroMovements: true,
                                            includePauses: true
                                        });
                                        if (clickSuccess) {
                                            console.log(`[ProfileOps] Successfully clicked follow button with retry selector ${j}: ${retrySelector}`);
                                            await this.randomDelay(2000, 3000);
                                            return { success: true, data: { selector: retrySelector, antiDetection: true } };
                                        }
                                    }
                                    catch (retryError) {
                                        console.log(`[ProfileOps] Retry selector ${j} failed: ${retrySelector}`, retryError instanceof Error ? retryError.message : String(retryError));
                                        continue; // Try next selector
                                    }
                                }
                                // If all retry selectors failed, continue to next original selector
                                continue;
                            }
                            else {
                                // Not a stale error, throw it
                                throw staleError;
                            }
                        }
                        if (clickSuccess) {
                            await this.randomDelay(2000, 3000);
                            return { success: true, data: { selector, antiDetection: true } };
                        }
                    }
                    else {
                        // Normal click without anti-detection
                        try {
                            await followElement.click();
                            await this.randomDelay(2000, 3000);
                            return { success: true, data: { selector, antiDetection: false } };
                        }
                        catch (clickError) {
                            // If stale, try all remaining selectors
                            if (clickError.name === 'StaleElementReferenceError' ||
                                clickError.message?.includes('stale element')) {
                                console.log(`[ProfileOps] Follow button stale with selector ${i}, trying all remaining selectors...`);
                                // Try all remaining selectors
                                for (let j = i + 1; j < followSelectors.length; j++) {
                                    const retrySelector = followSelectors[j];
                                    const retryIsXpath = j < 5;
                                    try {
                                        let retryElement = retryIsXpath
                                            ? await this.findElementByXpath(retrySelector)
                                            : await this.findElementByCss(retrySelector);
                                        // Verify element properties
                                        isDisabled = await retryElement.getAttribute('disabled');
                                        ariaDisabled = await retryElement.getAttribute('aria-disabled');
                                        isClickable = await retryElement.isEnabled();
                                        isDisplayed = await retryElement.isDisplayed();
                                        if (isDisabled === 'true' || ariaDisabled === 'true' || !isClickable || !isDisplayed) {
                                            continue; // Try next selector
                                        }
                                        await retryElement.click();
                                        console.log(`[ProfileOps] Successfully clicked follow button with retry selector ${j}: ${retrySelector}`);
                                        await this.randomDelay(2000, 3000);
                                        return { success: true, data: { selector: retrySelector, antiDetection: false } };
                                    }
                                    catch (retryError) {
                                        console.log(`[ProfileOps] Retry selector ${j} failed: ${retrySelector}`, retryError instanceof Error ? retryError.message : String(retryError));
                                        continue; // Try next selector
                                    }
                                }
                                // If all retry selectors failed, continue to next original selector
                                continue;
                            }
                            else {
                                // Not a stale error, throw it
                                throw clickError;
                            }
                        }
                    }
                }
                catch (e) {
                    // Element not found or other error, try next selector
                    continue;
                }
            }
            return { success: false, error: 'Could not find follow button or button not accessible' };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
}
exports.ProfileOps = ProfileOps;
/**
 * Calculate follow ratio based on followers and following count
 * Similar to calculateFollowRatio from legacy_nodejs.js
 */
function calculateFollowRatio(followersCount, followingCount) {
    // Simple ratio calculation: followingCount / followersCount
    // If followersCount is 0, ratio will be Infinity or NaN, but we'll still return it as number
    const ratio = followersCount === 0 ? Infinity : (followingCount / followersCount);
    return {
        ratio,
        followersCount,
        followingCount
    };
}
