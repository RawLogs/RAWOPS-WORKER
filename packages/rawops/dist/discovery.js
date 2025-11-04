"use strict";
// packages/rawops/src/discovery.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowerDiscoveryOps = void 0;
const selenium_webdriver_1 = require("selenium-webdriver");
const base_1 = require("./base");
/**
 * FollowerDiscoveryOps class for discovering followers from verified followers pages
 * Ported from legacy followerDiscoveryService.js
 */
class FollowerDiscoveryOps extends base_1.BaseOps {
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
            const normalizedNumber = numberPart.replace(/,/g, '.');
            const number = parseFloat(normalizedNumber);
            return Math.floor(number * 1000);
        }
        else if (cleanText.includes('M')) {
            const numberPart = cleanText.replace('M', '');
            const normalizedNumber = numberPart.replace(/,/g, '.');
            const number = parseFloat(normalizedNumber);
            return Math.floor(number * 1000000);
        }
        else if (cleanText.includes('B')) {
            const numberPart = cleanText.replace('B', '');
            const normalizedNumber = numberPart.replace(/,/g, '.');
            const number = parseFloat(normalizedNumber);
            return Math.floor(number * 1000000000);
        }
        else {
            // Handle regular numbers with commas or dots as thousand separators
            let numberOnly = cleanText;
            if (cleanText.length >= 4 && (cleanText.includes(',') || cleanText.includes('.'))) {
                numberOnly = cleanText.replace(/[,.]/g, '');
            }
            else {
                numberOnly = cleanText.replace(/[,.]/g, '');
            }
            const parsedNumber = parseInt(numberOnly);
            return parsedNumber || 0;
        }
    }
    /**
     * Navigate to verified followers page
     */
    async navigateToVerifiedFollowers(profileUrl) {
        try {
            // Extract username from profile URL
            const usernameMatch = profileUrl.match(/https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/([^\/\?]+)/);
            if (!usernameMatch) {
                console.log('[FollowerDiscoveryOps] Could not extract username from profile URL');
                return false;
            }
            const username = usernameMatch[1];
            // Try verified followers first
            const verifiedFollowersUrl = `https://x.com/${username}/verified_followers`;
            console.log(`[FollowerDiscoveryOps] Navigating to verified followers: ${verifiedFollowersUrl}`);
            await this.driver.get(verifiedFollowersUrl);
            await this.driver.sleep(5000);
            // Check current URL to see if we were redirected
            const currentUrl = await this.driver.getCurrentUrl();
            console.log(`[FollowerDiscoveryOps] Current URL after navigation: ${currentUrl}`);
            // Multiple strategies to detect if we're on the right page
            const detectionStrategies = [
                // Strategy 1: Check for verified followers specific elements
                async () => {
                    const selectors = [
                        '//div[@aria-label="Dòng thời gian: Người theo dõi đã xác nhận"]',
                        '//div[@aria-label="Timeline: Verified followers"]',
                        '//h1[contains(text(), "Verified followers")]',
                        '//h1[contains(text(), "Người theo dõi đã xác nhận")]',
                        '//span[contains(text(), "Verified followers")]',
                        '//span[contains(text(), "Người theo dõi đã xác nhận")]'
                    ];
                    for (const selector of selectors) {
                        try {
                            await this.findElementByXpath(selector);
                            console.log(`[FollowerDiscoveryOps] Found verified followers page using selector: ${selector}`);
                            return true;
                        }
                        catch (e) {
                            continue;
                        }
                    }
                    return false;
                },
                // Strategy 2: Check for any followers page
                async () => {
                    const selectors = [
                        '//div[contains(@aria-label, "followers")]',
                        '//div[contains(@aria-label, "theo dõi")]',
                        '//h1[contains(text(), "followers")]',
                        '//h1[contains(text(), "theo dõi")]',
                        '//span[contains(text(), "followers")]',
                        '//span[contains(text(), "theo dõi")]'
                    ];
                    for (const selector of selectors) {
                        try {
                            await this.findElementByXpath(selector);
                            console.log(`[FollowerDiscoveryOps] Found followers page using selector: ${selector}`);
                            return true;
                        }
                        catch (e) {
                            continue;
                        }
                    }
                    return false;
                },
                // Strategy 3: Check for user cells (indicating we're on a followers list)
                async () => {
                    try {
                        const userCells = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="cellInnerDiv"]'));
                        if (userCells.length > 0) {
                            console.log(`[FollowerDiscoveryOps] Found ${userCells.length} user cells - likely on followers page`);
                            return true;
                        }
                    }
                    catch (e) {
                        // Continue to next strategy
                    }
                    return false;
                },
                // Strategy 4: Check URL patterns
                async () => {
                    if (currentUrl.includes('/verified_followers') ||
                        currentUrl.includes('/followers') ||
                        (currentUrl.includes('verified') && currentUrl.includes('followers'))) {
                        console.log(`[FollowerDiscoveryOps] URL indicates followers page: ${currentUrl}`);
                        return true;
                    }
                    return false;
                }
            ];
            // Try each detection strategy
            for (let i = 0; i < detectionStrategies.length; i++) {
                try {
                    const isOnFollowersPage = await detectionStrategies[i]();
                    if (isOnFollowersPage) {
                        console.log(`[FollowerDiscoveryOps] Successfully detected followers page using strategy ${i + 1}`);
                        return true;
                    }
                }
                catch (e) {
                    console.log(`[FollowerDiscoveryOps] Strategy ${i + 1} failed: ${e instanceof Error ? e.message : String(e)}`);
                    continue;
                }
            }
            // If verified followers failed, try regular followers as fallback
            console.log('[FollowerDiscoveryOps] Verified followers not found, trying regular followers as fallback...');
            const regularFollowersUrl = `https://x.com/${username}/followers`;
            await this.driver.get(regularFollowersUrl);
            await this.driver.sleep(5000);
            const fallbackUrl = await this.driver.getCurrentUrl();
            console.log(`[FollowerDiscoveryOps] Fallback URL: ${fallbackUrl}`);
            // Try detection strategies again for regular followers
            for (let i = 0; i < detectionStrategies.length; i++) {
                try {
                    const isOnFollowersPage = await detectionStrategies[i]();
                    if (isOnFollowersPage) {
                        console.log(`[FollowerDiscoveryOps] Successfully detected regular followers page using strategy ${i + 1}`);
                        return true;
                    }
                }
                catch (e) {
                    console.log(`[FollowerDiscoveryOps] Fallback strategy ${i + 1} failed: ${e instanceof Error ? e.message : String(e)}`);
                    continue;
                }
            }
            // Final check: if we have user cells, assume we're on some kind of followers page
            try {
                const userCells = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="cellInnerDiv"]'));
                if (userCells.length > 0) {
                    console.log(`[FollowerDiscoveryOps] Found ${userCells.length} user cells - proceeding with extraction`);
                    return true;
                }
            }
            catch (e) {
                console.log(`[FollowerDiscoveryOps] Final check failed: ${e instanceof Error ? e.message : String(e)}`);
            }
            console.log('[FollowerDiscoveryOps] Could not confirm any followers page');
            return false;
        }
        catch (error) {
            console.error(`[FollowerDiscoveryOps] Error navigating to verified followers: ${error}`);
            return false;
        }
    }
    /**
     * Check if user is already being followed
     */
    async checkFollowStatus(cell, username) {
        try {
            // Look for follow/unfollow button in the cell with more specific selectors
            const followButtonSelectors = [
                // Unfollow buttons (already following)
                'button[data-testid*="-unfollow"]',
                'button[aria-label*="Following @"]',
                'button[aria-label*="Đang theo dõi @"]',
                // Follow buttons (not following)
                'button[data-testid*="-follow"]',
                'button[aria-label*="Follow @"]',
                'button[aria-label*="Theo dõi @"]'
            ];
            for (const selector of followButtonSelectors) {
                try {
                    const button = await cell.findElement(selenium_webdriver_1.By.css(selector));
                    const ariaLabel = await button.getAttribute('aria-label') || '';
                    const buttonText = await button.getText() || '';
                    const dataTestId = await button.getAttribute('data-testid') || '';
                    console.log(`[FollowerDiscoveryOps] Found button for @${username}: aria-label="${ariaLabel}", text="${buttonText}", data-testid="${dataTestId}"`);
                    // Check if it's an unfollow button (already following)
                    if (dataTestId.includes('-unfollow') ||
                        ariaLabel.includes('Following @') ||
                        ariaLabel.includes('Đang theo dõi @') ||
                        buttonText.includes('Following') ||
                        buttonText.includes('Đang theo dõi')) {
                        console.log(`[FollowerDiscoveryOps] @${username} is already being followed (unfollow button detected)`);
                        return {
                            isFollowing: true,
                            buttonText,
                            ariaLabel,
                            dataTestId,
                            reason: 'unfollow_button_found'
                        };
                    }
                    // Check if it's a follow button (not following)
                    if (dataTestId.includes('-follow') ||
                        ariaLabel.includes('Follow @') ||
                        ariaLabel.includes('Theo dõi @') ||
                        buttonText.includes('Follow') ||
                        buttonText.includes('Theo dõi')) {
                        console.log(`[FollowerDiscoveryOps] @${username} is not being followed yet (follow button detected)`);
                        return {
                            isFollowing: false,
                            buttonText,
                            ariaLabel,
                            dataTestId,
                            reason: 'follow_button_found'
                        };
                    }
                }
                catch (e) {
                    continue;
                }
            }
            // If no button found, assume not following (safer to include)
            console.log(`[FollowerDiscoveryOps] Could not find follow/unfollow button for @${username}, assuming not following`);
            return {
                isFollowing: false,
                buttonText: 'Unknown',
                ariaLabel: 'Unknown',
                dataTestId: 'Unknown',
                reason: 'no_button_found'
            };
        }
        catch (error) {
            console.error(`[FollowerDiscoveryOps] Error checking follow status for @${username}: ${error}`);
            return {
                isFollowing: false,
                buttonText: 'Error',
                ariaLabel: 'Error',
                dataTestId: 'Error',
                reason: 'error_occurred'
            };
        }
    }
    /**
     * Hover over username and extract follow information
     */
    async hoverAndExtractFollowInfo(cell, username) {
        try {
            console.log(`[FollowerDiscoveryOps] Hovering over @${username} to extract follow info...`);
            // Find the username element to hover over
            let usernameElement = null;
            try {
                // Try to find the username link or text element
                usernameElement = await cell.findElement(selenium_webdriver_1.By.css('a[href^="/"][href$=""]'));
            }
            catch (e) {
                try {
                    // Try alternative selectors for username
                    usernameElement = await cell.findElement(selenium_webdriver_1.By.css('[data-testid="UserCell"] a'));
                }
                catch (e2) {
                    try {
                        // Try to find any link in the cell
                        usernameElement = await cell.findElement(selenium_webdriver_1.By.css('a[role="link"]'));
                    }
                    catch (e3) {
                        console.log(`[FollowerDiscoveryOps] Could not find username element for @${username}`);
                        return null;
                    }
                }
            }
            if (!usernameElement) {
                return null;
            }
            // Scroll to ensure element is visible
            await this.driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", usernameElement);
            await this.driver.sleep(1000);
            // Hover over the username element and keep mouse there
            const actions = this.driver.actions();
            await actions.move({ origin: usernameElement }).perform();
            // Wait longer for hover card to appear and stabilize
            await this.driver.sleep(2000);
            // Look for the hover card with follow information
            let followInfo = null;
            let hoverCard = null;
            // Try multiple attempts to find the hover card
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    console.log(`[FollowerDiscoveryOps] Attempt ${attempt} to find hover card for @${username}`);
                    // Try multiple selectors for the hover card
                    const hoverCardSelectors = [
                        '[data-testid="hoverCardParent"]',
                        '[data-testid="UserHoverCard"]',
                        '[role="tooltip"]',
                        '[data-testid="UserCell"]'
                    ];
                    for (const selector of hoverCardSelectors) {
                        try {
                            hoverCard = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
                            if (hoverCard) {
                                console.log(`[FollowerDiscoveryOps] Found hover card using selector: ${selector}`);
                                break;
                            }
                        }
                        catch (e) {
                            continue;
                        }
                    }
                    if (hoverCard) {
                        // Wait a bit more for content to load
                        await this.driver.sleep(2500);
                        // Extract followers and following counts from the hover card
                        let followersCount = 0;
                        let followingCount = 0;
                        try {
                            // Look for following link with count
                            const followingLink = await hoverCard.findElement(selenium_webdriver_1.By.xpath('.//a[contains(@href, "/following")]'));
                            const followingLinkText = await followingLink.getText();
                            followingCount = this.parseCount(followingLinkText);
                            console.log(`[FollowerDiscoveryOps] Found following count from link: ${followingCount}`);
                        }
                        catch (e) {
                            console.log(`[FollowerDiscoveryOps] Could not find following link: ${e instanceof Error ? e.message : String(e)}`);
                        }
                        try {
                            // Look for followers link with count (verified_followers or followers)
                            const followersLink = await hoverCard.findElement(selenium_webdriver_1.By.xpath('.//a[contains(@href, "/followers") or contains(@href, "/verified_followers")]'));
                            const followersLinkText = await followersLink.getText();
                            followersCount = this.parseCount(followersLinkText);
                            console.log(`[FollowerDiscoveryOps] Found followers count from link: ${followersCount}`);
                        }
                        catch (e) {
                            console.log(`[FollowerDiscoveryOps] Could not find followers link: ${e instanceof Error ? e.message : String(e)}`);
                        }
                        // Method 2: If link method failed, try direct span extraction
                        if (followersCount === 0 || followingCount === 0) {
                            console.log('[FollowerDiscoveryOps] Trying direct span extraction method...');
                            // Look for spans with numbers that are near "Following" or "Followers" text
                            const allSpans = await hoverCard.findElements(selenium_webdriver_1.By.css('span'));
                            for (const span of allSpans) {
                                try {
                                    const text = await span.getText();
                                    const count = this.parseCount(text);
                                    if (count > 0) {
                                        // Get parent element to check context
                                        const parentElement = await span.findElement(selenium_webdriver_1.By.xpath('..'));
                                        const parentText = await parentElement.getText();
                                        // Check if this span is near "Following" text
                                        if (parentText.includes('Following') && followingCount === 0) {
                                            followingCount = count;
                                            console.log(`[FollowerDiscoveryOps] Found following count from span: ${followingCount}`);
                                        }
                                        // Check if this span is near "Followers" text
                                        else if (parentText.includes('Followers') && followersCount === 0) {
                                            followersCount = count;
                                            console.log(`[FollowerDiscoveryOps] Found followers count from span: ${followersCount}`);
                                        }
                                    }
                                }
                                catch (e) {
                                    continue;
                                }
                            }
                        }
                        if (followersCount > 0 || followingCount > 0) {
                            followInfo = {
                                followers: followersCount,
                                following: followingCount
                            };
                            console.log(`[FollowerDiscoveryOps] Extracted follow info for @${username}: ${followersCount} followers, ${followingCount} following`);
                            break; // Success, exit the attempt loop
                        }
                    }
                    if (followInfo) {
                        break; // Success, exit the attempt loop
                    }
                    // If no success, wait a bit more and try again
                    if (attempt < 3) {
                        await this.driver.sleep(1000);
                    }
                }
                catch (hoverCardError) {
                    console.log(`[FollowerDiscoveryOps] Attempt ${attempt} failed to find hover card for @${username}: ${hoverCardError instanceof Error ? hoverCardError.message : String(hoverCardError)}`);
                    if (attempt < 3) {
                        await this.driver.sleep(1000);
                    }
                }
            }
            // Keep mouse on element a bit longer to ensure we got all data
            await this.driver.sleep(1000);
            // Move mouse away to dismiss hover card
            await actions.move({ x: 0, y: 0 }).perform();
            await this.driver.sleep(1000);
            return followInfo;
        }
        catch (error) {
            console.error(`[FollowerDiscoveryOps] Error hovering over @${username}: ${error}`);
            return null;
        }
    }
    /**
     * Extract follower profiles from verified followers page
     */
    async extractVerifiedFollowers(options = {}) {
        try {
            console.log('[FollowerDiscoveryOps] Extracting verified followers from page...');
            const { maxFollowers = 20, smoothSpeed = 50, excludeUsernames = [], checkFollowStatus = true, hoverToExtractInfo = true } = options;
            if (excludeUsernames.length > 0) {
                console.log(`[FollowerDiscoveryOps] Excluding users: ${excludeUsernames.map(u => `@${u}`).join(', ')}`);
            }
            // Scroll to load more followers
            await this.antiDetection.scrollWithMouseMovement({
                scrollAmount: 300,
                steps: 60,
                direction: 'down',
                smoothness: 'high',
                pattern: 'browsing',
                intensity: 'medium',
                includeMicroMovements: true,
                includePauses: true
            });
            await this.randomMouseMovement();
            const followers = [];
            // Find all user cells
            const userCells = await this.driver.findElements(selenium_webdriver_1.By.css('[data-testid="cellInnerDiv"]'));
            console.log(`[FollowerDiscoveryOps] Found ${userCells.length} user cells`);
            for (let i = 0; i < Math.min(userCells.length, maxFollowers); i++) {
                try {
                    const cell = userCells[i];
                    // Scroll to the cell to make it visible
                    await this.driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", cell);
                    await this.driver.sleep(1000);
                    // Extract username from the cell
                    let username = null;
                    let profileUrl = null;
                    try {
                        // Try to find username link
                        const usernameLink = await cell.findElement(selenium_webdriver_1.By.css('a[href^="/"][href$=""]'));
                        const href = await usernameLink.getAttribute('href');
                        if (href && !href.includes('/status/') && !href.includes('/photo/')) {
                            // Extract username from href
                            const usernameMatch = href.match(/^\/([^\/\?]+)/);
                            if (usernameMatch) {
                                username = usernameMatch[1];
                                profileUrl = `https://x.com/${username}`;
                            }
                        }
                    }
                    catch (e) {
                        // Try alternative selectors
                        try {
                            const altLink = await cell.findElement(selenium_webdriver_1.By.css('a[role="link"]'));
                            const href = await altLink.getAttribute('href');
                            if (href && href.includes('x.com/') && !href.includes('/status/')) {
                                const usernameMatch = href.match(/x\.com\/([^\/\?]+)/);
                                if (usernameMatch) {
                                    username = usernameMatch[1];
                                    profileUrl = href.startsWith('http') ? href : `https://${href}`;
                                }
                            }
                        }
                        catch (e2) {
                            continue; // Skip this cell if we can't extract username
                        }
                    }
                    if (username && profileUrl) {
                        // Check if this is a valid profile (not a status or photo)
                        if (!profileUrl.includes('/status/') && !profileUrl.includes('/photo/') && !profileUrl.includes('/video/')) {
                            // Skip if this username is in the exclusion list
                            const shouldExclude = excludeUsernames.some(excludeUsername => username.toLowerCase() === excludeUsername.toLowerCase());
                            if (shouldExclude) {
                                console.log(`[FollowerDiscoveryOps] Skipping excluded user (@${username})`);
                                continue;
                            }
                            // Check follow status to optimize follow-back ratio
                            let followStatus = undefined;
                            if (checkFollowStatus) {
                                followStatus = await this.checkFollowStatus(cell, username);
                                // Skip if already following (to optimize follow-back ratio)
                                if (followStatus.isFollowing) {
                                    console.log(`[FollowerDiscoveryOps] Skipping @${username} - already following (optimizing follow-back ratio)`);
                                    continue;
                                }
                            }
                            // Try to hover over the username to get follow information
                            let followInfo = null;
                            if (hoverToExtractInfo) {
                                try {
                                    followInfo = await this.hoverAndExtractFollowInfo(cell, username);
                                }
                                catch (hoverError) {
                                    console.log(`[FollowerDiscoveryOps] Could not extract follow info for @${username}: ${hoverError instanceof Error ? hoverError.message : String(hoverError)}`);
                                }
                            }
                            followers.push({
                                username,
                                profileUrl,
                                followInfo: followInfo || undefined,
                                followStatus,
                                discoveredAt: new Date().toISOString()
                            });
                            console.log(`[FollowerDiscoveryOps] Discovered unfollowed user: @${username}${followInfo ? ` (${followInfo.followers} followers, ${followInfo.following} following)` : ''}`);
                        }
                    }
                    // Random mouse movement between extractions
                    await this.randomMouseMovement();
                }
                catch (e) {
                    console.log(`[FollowerDiscoveryOps] Error extracting follower ${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
                    continue;
                }
            }
            console.log(`[FollowerDiscoveryOps] Successfully extracted ${followers.length} verified followers`);
            return {
                success: true,
                followers
            };
        }
        catch (error) {
            console.error(`[FollowerDiscoveryOps] Error extracting verified followers: ${error}`);
            return {
                success: false,
                followers: [],
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Discover verified followers from a profile
     */
    async discoverVerifiedFollowers(profileUrl, options = {}) {
        try {
            console.log(`[FollowerDiscoveryOps] Starting verified followers discovery for: ${profileUrl}`);
            // Step 1: Navigate to verified followers page
            const navigationSuccess = await this.navigateToVerifiedFollowers(profileUrl);
            if (!navigationSuccess) {
                console.log('[FollowerDiscoveryOps] Failed to navigate to verified followers page');
                return { success: false, followers: [], error: 'Failed to navigate to verified followers page' };
            }
            // Step 2: Extract follower profiles
            const result = await this.extractVerifiedFollowers(options);
            return result;
        }
        catch (error) {
            console.error(`[FollowerDiscoveryOps] Error in verified followers discovery: ${error}`);
            return {
                success: false,
                followers: [],
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
exports.FollowerDiscoveryOps = FollowerDiscoveryOps;
