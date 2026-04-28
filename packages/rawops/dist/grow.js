"use strict";
// packages/rawops/src/grow.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowOps = void 0;
const selenium_webdriver_1 = require("selenium-webdriver");
const base_1 = require("./base");
/**
 * GrowOps - Operations for grow workflow automation
 * Provides methods for navigation, scrolling, interaction, and discovery
 */
class GrowOps extends base_1.BaseOps {
    constructor(driver) {
        super(driver);
    }
    /**
     * Parse status / snowflake id from tweet href (relative or absolute, web status URLs).
     */
    parseStatusIdFromTweetHref(link) {
        if (!link || typeof link !== 'string')
            return null;
        let m = link.match(/\/(?:status|statuses)\/(\d{5,30})(?:\?|#|$|\/)/);
        if (m)
            return m[1];
        m = link.match(/\/(?:status|statuses)\/(\d{5,30})/);
        if (m)
            return m[1];
        m = link.match(/\/i\/web\/status\/(\d{5,30})/);
        if (m)
            return m[1];
        // Relative href without leading slash (e.g. saved from attribute as "user/status/123")
        m = link.match(/(?:^|\/)status(?:es)?\/(\d{5,30})(?:\?|#|$|\/)/);
        if (m)
            return m[1];
        m = link.match(/status(?:es)?\/(\d{5,30})/);
        return m ? m[1] : null;
    }
    /**
     * Approximate tweet time from X snowflake id when <time datetime> is missing.
     */
    approximateUtcDateFromStatusSnowflake(statusId) {
        if (!statusId || !/^\d{10,22}$/.test(statusId))
            return null;
        try {
            const id = BigInt(statusId);
            const TWITTER_EPOCH_MS = 1288834974657;
            const ms = Number(id >> 22n) + TWITTER_EPOCH_MS;
            const d = new Date(ms);
            return isNaN(d.getTime()) ? null : d;
        }
        catch {
            return null;
        }
    }
    /**
     * Scroll profile / home primary column to top so the first paint is latest tweets (not mid-timeline after random scroll).
     */
    async scrollPrimaryTimelineToTop() {
        try {
            await this.driver.executeScript(`
        window.scrollTo(0, 0);
        const candidates = [
          document.querySelector('main[role="main"]'),
          document.querySelector('[data-testid="primaryColumn"]'),
          document.querySelector('[aria-label*="Timeline"]'),
          document.querySelector('[aria-label*="Posts"]')
        ].filter(Boolean);
        for (const el of candidates) {
          try {
            el.scrollTop = 0;
          } catch (e) {}
        }
        window.scrollTo(0, 0);
        return true;
      `);
            await this.driver.sleep(600);
        }
        catch {
            // non-fatal
        }
    }
    /**
     * Parse X/Twitter URL to extract profile URL and status ID
     * Normalizes URLs to x.com format
     */
    parseTwitterUrl(url) {
        let profileUrl = url;
        let statusId = null;
        let username = null;
        try {
            // Check if URL contains status ID
            // Pattern: https://x.com/username/status/1234567890
            // Pattern: https://twitter.com/username/status/1234567890
            const statusMatch = url.match(/\/(?:status|statuses)\/(\d+)/);
            if (statusMatch) {
                statusId = statusMatch[1];
                // Extract username from URL and create profile URL only
                const profileMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([^\/\?]+)/);
                if (profileMatch) {
                    username = profileMatch[1];
                    // Normalize to profile URL only (remove status part)
                    profileUrl = `https://x.com/${username}`;
                }
            }
            else {
                // For profile links, normalize to profile URL
                const profileMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([^\/\?]+)/);
                if (profileMatch) {
                    username = profileMatch[1];
                    // Normalize to x.com format
                    profileUrl = `https://x.com/${username}`;
                }
            }
        }
        catch (error) {
            console.error('[GrowOps] Error parsing URL:', error);
            // Fallback to original URL
            profileUrl = url;
            statusId = null;
            username = null;
        }
        return {
            profileUrl,
            statusId,
            username
        };
    }
    /**
     * Navigate to profile URL (parsed from any Twitter URL format)
     */
    async navigateToProfileUrl(url) {
        try {
            const parsed = this.parseTwitterUrl(url);
            await this.driver.get(parsed.profileUrl);
            await this.driver.sleep(2000);
            return {
                success: true,
                data: {
                    profileUrl: parsed.profileUrl,
                    statusId: parsed.statusId,
                    username: parsed.username
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Error navigating to profile: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Navigate to URL directly without parsing (mode 1: default)
     */
    async navigateToUrl(url, resolveVariable) {
        try {
            // Resolve variable if needed
            let finalUrl;
            if (typeof url === 'string' && url.startsWith('{{') && url.endsWith('}}') && resolveVariable) {
                const resolved = resolveVariable(url);
                finalUrl = String(resolved);
            }
            else {
                finalUrl = String(url);
            }
            if (!finalUrl) {
                return { success: false, error: 'URL not provided' };
            }
            // Navigate directly without parsing
            await this.driver.get(finalUrl);
            await this.driver.sleep(2000);
            return {
                success: true,
                data: { url: finalUrl }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Error navigating: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Navigate to URL with variable resolution and context management (mode 2: parse URL)
     * Returns parsed URL data for context updates
     */
    async navigateWithContext(url, resolveVariable) {
        try {
            // Resolve variable if needed
            let finalUrl;
            if (typeof url === 'string' && url.startsWith('{{') && url.endsWith('}}') && resolveVariable) {
                const resolved = resolveVariable(url);
                finalUrl = String(resolved);
            }
            else {
                finalUrl = String(url);
            }
            if (!finalUrl) {
                return { success: false, error: 'URL not provided' };
            }
            const parsed = this.parseTwitterUrl(finalUrl);
            const result = await this.navigateToProfileUrl(finalUrl);
            if (result.success) {
                return {
                    success: true,
                    parsed
                };
            }
            else {
                return {
                    success: false,
                    error: result.error
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Error navigating: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Follow user with status checking and context management
     * Returns follow status for context updates
     */
    async followWithStatus(options = {}) {
        try {
            // Note: This method needs ProfileOps which is not accessible here
            // This is a placeholder - actual implementation should use ProfileOps
            return {
                success: false,
                isFollowing: false,
                error: 'This method requires ProfileOps integration'
            };
        }
        catch (error) {
            return {
                success: false,
                isFollowing: false,
                error: `Error following: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Scroll to element by selector
     */
    async scrollToElement(selector, by = 'css') {
        try {
            let element;
            if (by === 'xpath') {
                element = await this.driver.findElement(selenium_webdriver_1.By.xpath(selector));
            }
            else {
                element = await this.driver.findElement(selenium_webdriver_1.By.css(selector));
            }
            if (element) {
                await this.driver.executeScript('arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });', element);
                await this.randomDelay(500, 1000);
            }
            return { success: true };
        }
        catch (error) {
            // Element not found is not an error, just continue
            return { success: true };
        }
    }
    /**
     * Extract timestamp from tweet element
     * Handles stale element errors by retrying with fresh element lookup
     * Based on actual HTML structure: <time datetime="2025-10-23T10:04:10.000Z">Oct 23</time>
     */
    async extractTweetTimestamp(tweetElement, link, maxRetries = 3) {
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Try to extract timestamp using executeScript (works better with stale elements)
                // Try multiple selectors to find time element accurately
                const timestamp = await this.driver.executeScript(`
          const tweet = arguments[0];
          try {
            // Method 1: Direct time element query (most common)
            let timeElement = tweet.querySelector('time[datetime]');
            if (timeElement) {
              const datetime = timeElement.getAttribute('datetime');
              if (datetime) {
                return new Date(datetime).toISOString();
              }
            }
            
            // Method 2: Find time element within a link containing status
            const statusLinks = tweet.querySelectorAll('a[href*="/status/"]');
            for (const link of statusLinks) {
              timeElement = link.querySelector('time[datetime]');
              if (timeElement) {
                const datetime = timeElement.getAttribute('datetime');
                if (datetime) {
                  return new Date(datetime).toISOString();
                }
              }
            }
            
            // Method 3: Find any time element in tweet
            timeElement = tweet.querySelector('time');
            if (timeElement) {
              const datetime = timeElement.getAttribute('datetime');
              if (datetime) {
                return new Date(datetime).toISOString();
              }
            }
            
            return null;
          } catch (e) {
            return null;
          }
        `, tweetElement);
                if (timestamp) {
                    try {
                        const date = new Date(timestamp);
                        // Validate the date is valid
                        if (!isNaN(date.getTime())) {
                            return date;
                        }
                    }
                    catch (parseError) {
                        // Invalid date, continue to retry
                    }
                }
                // If no timestamp found and this is not the last attempt, continue to retry
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    continue;
                }
                return null;
            }
            catch (error) {
                lastError = error;
                // Check if it's a stale element error
                const isStaleError = error.name === 'StaleElementReferenceError' ||
                    error.message?.includes('stale element') ||
                    error.message?.includes('stale element reference');
                if (isStaleError && attempt < maxRetries) {
                    // If we have a link, try to find the element again
                    if (link && attempt > 1) {
                        try {
                            // Try to find element by link using XPath
                            const statusMatch = link.match(/\/status\/(\d+)/);
                            if (statusMatch) {
                                const statusId = statusMatch[1];
                                const newElement = await this.driver.findElement(selenium_webdriver_1.By.xpath(`//a[contains(@href, '/status/${statusId}')]/ancestor::article[@data-testid='tweet']`));
                                if (newElement) {
                                    tweetElement = newElement;
                                }
                            }
                        }
                        catch (findError) {
                            // If can't find element, continue with retry
                        }
                    }
                    // Wait a bit before retry (longer delay for later attempts)
                    const delay = Math.min(100 * attempt, 500);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                // If not stale error or last attempt, break
                if (!isStaleError || attempt >= maxRetries) {
                    break;
                }
            }
        }
        // All retries failed
        if (lastError) {
            const errorMsg = lastError.name || lastError.message || 'Unknown error';
            console.log(`[GrowOps] Error extracting timestamp after ${maxRetries} attempts: ${errorMsg}`);
        }
        return null;
    }
    /**
     * Filter tweets by time (within last N hours)
     * Uses timestamp from detectedTweets if available, otherwise extracts from element
     */
    async filterTweetsByTime(tweets, timeFilterHours) {
        const cutoffTime = new Date(Date.now() - timeFilterHours * 60 * 60 * 1000);
        const filteredTweets = [];
        for (const tweet of tweets) {
            try {
                let timestamp = null;
                if (tweet.timestamp) {
                    try {
                        timestamp = new Date(tweet.timestamp);
                        if (isNaN(timestamp.getTime())) {
                            timestamp = null;
                        }
                    }
                    catch {
                        timestamp = null;
                    }
                }
                const sid = tweet.statusId || this.parseStatusIdFromTweetHref(tweet.link);
                if (!timestamp && sid) {
                    timestamp = await this.extractTweetTimestampFromPageByStatusId(sid);
                }
                if (!timestamp) {
                    try {
                        timestamp = await this.extractTweetTimestamp(tweet.element, tweet.link);
                    }
                    catch {
                        timestamp = null;
                    }
                }
                let approxFromSnowflake = null;
                if (sid) {
                    approxFromSnowflake = this.approximateUtcDateFromStatusSnowflake(sid);
                }
                const effectiveForCutoff = timestamp || approxFromSnowflake;
                if (effectiveForCutoff) {
                    if (effectiveForCutoff >= cutoffTime) {
                        filteredTweets.push({
                            element: tweet.element,
                            link: tweet.link,
                            statusId: tweet.statusId ?? sid,
                            cellInnerDiv: tweet.cellInnerDiv,
                            timestamp: timestamp || approxFromSnowflake
                        });
                    }
                }
                else {
                    filteredTweets.push({
                        element: tweet.element,
                        link: tweet.link,
                        statusId: tweet.statusId,
                        cellInnerDiv: tweet.cellInnerDiv,
                        timestamp: null
                    });
                }
            }
            catch (error) {
                const errorMsg = error.name || error.message || 'Unknown error';
                console.log(`[GrowOps] Error filtering tweet ${tweet.statusId || 'unknown'}: ${errorMsg}`);
                filteredTweets.push({
                    element: tweet.element,
                    link: tweet.link,
                    statusId: tweet.statusId,
                    cellInnerDiv: tweet.cellInnerDiv,
                    timestamp: null
                });
            }
        }
        return filteredTweets;
    }
    /**
     * Read <time datetime> for a status id from the live DOM (permalink row: <a href=".../status/id"><time>…</time></a>).
     */
    async extractTweetTimestampFromPageByStatusId(statusId) {
        try {
            const iso = (await this.driver.executeScript(`
        const statusId = arguments[0];
        const anchors = document.querySelectorAll('a[href*="/status/"]');
        for (const anchor of anchors) {
          const href = anchor.getAttribute('href') || '';
          const m = href.match(/\\/status\\/(\\d+)/);
          if (!m || m[1] !== statusId) continue;
          const t =
            anchor.querySelector(':scope > time[datetime]') ||
            anchor.querySelector('time[datetime]');
          if (t) {
            const dt = t.getAttribute('datetime');
            if (dt) return dt;
          }
        }
        return null;
      `, statusId));
            if (!iso)
                return null;
            const d = new Date(iso);
            return isNaN(d.getTime()) ? null : d;
        }
        catch {
            return null;
        }
    }
    /**
     * Read tweet body from the live DOM by status id (no WebElement from an earlier scroll).
     * Avoids StaleElementReference after timeline re-renders.
     * Uses (1) status links under the page and (2) the first 20 [data-testid="cellInnerDiv"] rows
     * (X timeline layout; see RAWOPS-AI/.html) so text is resolved from the live DOM only.
     */
    async extractPostContentFromPageByStatusId(statusId) {
        try {
            const text = (await this.driver.executeScript(`
        const statusId = arguments[0];
        const MAX_CELL_INNER = 20;

        function sidFromHref(href) {
          const m = (href || '').match(/\\/status\\/(\\d+)/);
          return m ? m[1] : null;
        }

        function extractBody(root) {
          const textElement = root.querySelector('[data-testid="tweetText"]');
          let body = '';
          if (textElement) {
            body = (textElement.innerText || textElement.textContent || '').trim();
          }
          if (!body) {
            const spans = root.querySelectorAll('span');
            let buf = '';
            spans.forEach((span) => {
              const spanText = span.innerText || span.textContent || '';
              if (spanText.length > 10 && !spanText.includes('@') && !spanText.startsWith('http')) {
                buf += spanText + ' ';
              }
            });
            body = buf.trim();
          }
          return body;
        }

        const rows = [];

        const anchors = document.querySelectorAll('a[href*="/status/"]');
        for (const anchor of anchors) {
          const href = anchor.getAttribute('href') || '';
          if (sidFromHref(href) !== statusId) continue;
          const hasPermalinkTime = !!(
            anchor.querySelector(':scope > time[datetime]') ||
            anchor.querySelector('time[datetime]')
          );
          const root =
            anchor.closest('[data-testid="tweet"]') ||
            anchor.closest('article[role="article"]') ||
            anchor.closest('article');
          if (!root) continue;
          const body = extractBody(root);
          if (body.length > 0) {
            rows.push({ hasPermalinkTime, len: body.length, body });
          }
        }

        const cells = document.querySelectorAll('[data-testid="cellInnerDiv"]');
        const n = Math.min(MAX_CELL_INNER, cells.length);
        for (let j = 0; j < n; j++) {
          const cell = cells[j];
          const article =
            cell.querySelector('article[data-testid="tweet"]') ||
            cell.querySelector('article[role="article"]') ||
            cell.querySelector('article');
          if (!article) continue;
          const cellAnchors = cell.querySelectorAll('a[href*="/status/"]');
          let match = false;
          let hasPermalinkTimeCell = false;
          for (let k = 0; k < cellAnchors.length; k++) {
            const ca = cellAnchors[k];
            const ch = ca.getAttribute('href') || '';
            if (sidFromHref(ch) !== statusId) continue;
            match = true;
            hasPermalinkTimeCell = !!(
              ca.querySelector(':scope > time[datetime]') ||
              ca.querySelector('time[datetime]')
            );
            break;
          }
          if (!match) continue;
          const bodyCell = extractBody(article);
          if (bodyCell.length > 0) {
            rows.push({ hasPermalinkTime: hasPermalinkTimeCell, len: bodyCell.length, body: bodyCell });
          }
        }

        if (!rows.length) return null;
        rows.sort((a, b) => {
          if (a.hasPermalinkTime !== b.hasPermalinkTime) return a.hasPermalinkTime ? -1 : 1;
          return b.len - a.len;
        });
        return rows[0].body;
      `, statusId));
            return text && text.trim().length > 0 ? text.trim() : null;
        }
        catch (error) {
            console.error('[GrowOps] Error extracting post content by status id:', error);
            return null;
        }
    }
    /**
     * Scroll the tweet with this status id into view (DOM query only).
     */
    async scrollToTweetByStatusId(statusId) {
        try {
            const found = (await this.driver.executeScript(`
        const id = arguments[0];
        const anchors = document.querySelectorAll('a[href*="/status/"]');
        for (const anchor of anchors) {
          const href = anchor.getAttribute('href') || '';
          const m = href.match(/\\/status\\/(\\d+)/);
          if (!m || m[1] !== id) continue;
          const cell = anchor.closest('[data-testid="cellInnerDiv"]');
          (cell || anchor).scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        }
        return false;
      `, statusId));
            await this.randomDelay(2000, 3000);
            return { success: !!found };
        }
        catch (error) {
            return {
                success: false,
                error: `Error scrolling to tweet by status: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Re-resolve tweet WebElements after scroll/virtualization (same status id).
     */
    async refreshTweetElementsByStatusId(statusId) {
        try {
            const anchors = await this.driver.findElements(selenium_webdriver_1.By.css('a[href*="/status/"]'));
            const matching = [];
            for (const anchor of anchors) {
                const href = await anchor.getAttribute('href');
                if (!href)
                    continue;
                const m = href.match(/\/status\/(\d+)/);
                if (!m || m[1] !== statusId)
                    continue;
                matching.push(anchor);
            }
            let chosen = null;
            for (const anchor of matching) {
                const times = await anchor.findElements(selenium_webdriver_1.By.css('time[datetime]'));
                if (times.length > 0) {
                    chosen = anchor;
                    break;
                }
            }
            if (!chosen && matching.length > 0) {
                chosen = matching[0];
            }
            if (!chosen)
                return null;
            const href = await chosen.getAttribute('href');
            if (!href)
                return null;
            // Profile timeline: cellInnerDiv wraps the article (ancestor), not a child of article — see timeline HTML dumps.
            const tweetEl = await chosen.findElement(selenium_webdriver_1.By.xpath('./ancestor::*[@data-testid="tweet"][1]'));
            const cellInner = await chosen.findElement(selenium_webdriver_1.By.xpath('./ancestor::*[@data-testid="cellInnerDiv"][1]'));
            let link = href;
            if (!link.startsWith('http')) {
                link = `https://x.com${link.startsWith('/') ? link : '/' + link}`;
            }
            return {
                element: tweetEl,
                cellInnerDiv: cellInner,
                link,
                statusId
            };
        }
        catch {
            // fall through
        }
        return null;
    }
    /**
     * Scroll into view and replace possibly-stale element handles before like/comment/extract.
     */
    async ensureFreshTweetRefsForInteraction(tweet) {
        if (tweet.statusId) {
            await this.scrollToTweetByStatusId(tweet.statusId);
            for (let attempt = 0; attempt < 3; attempt++) {
                if (attempt > 0) {
                    await this.randomDelay(350, 800);
                    await this.scrollToTweetByStatusId(tweet.statusId);
                }
                else {
                    await this.randomDelay(400, 900);
                }
                const fresh = await this.refreshTweetElementsByStatusId(tweet.statusId);
                if (fresh) {
                    return {
                        ...tweet,
                        element: fresh.element,
                        cellInnerDiv: fresh.cellInnerDiv,
                        link: fresh.link,
                        statusId: fresh.statusId
                    };
                }
            }
            // Avoid scrollToTweet(stale cellInnerDiv) when we have a status id — DOM-only extract still works.
            return tweet;
        }
        await this.scrollToTweet(tweet.cellInnerDiv);
        return tweet;
    }
    /**
     * Extract post text using only link / status id (no WebElement — avoids stale after virtualization).
     */
    async extractPostContentByMeta(meta) {
        const sid = meta.statusId ?? this.parseStatusIdFromTweetHref(meta.link);
        if (!sid)
            return null;
        for (let attempt = 0; attempt < 4; attempt++) {
            if (attempt > 0) {
                await this.randomDelay(250, 600);
            }
            const fromPage = await this.extractPostContentFromPageByStatusId(sid);
            if (fromPage)
                return fromPage;
        }
        return null;
    }
    /**
     * Legacy signature: WebElement is ignored — only link/statusId (avoids StaleElementReference entirely).
     */
    async extractPostContent(_tweetElement, meta) {
        if (!meta?.link && (meta?.statusId === undefined || meta?.statusId === null)) {
            return null;
        }
        return this.extractPostContentByMeta({
            link: meta?.link || '',
            statusId: meta?.statusId ?? null
        });
    }
    /**
     * Scroll to tweet element
     */
    async scrollToTweet(cellInnerDiv) {
        try {
            await this.driver.executeScript('arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });', cellInnerDiv);
            await this.randomDelay(2000, 3000);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: `Error scrolling to tweet: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Extract status ID from various sources (params, context, URL)
     */
    extractStatusId(options) {
        const { params, context } = options;
        // Priority 1: Explicit parameter
        if (params?.target_status_id !== undefined || params?.targetStatusId !== undefined) {
            return params.target_status_id || params.targetStatusId || null;
        }
        // Priority 2: Context
        if (context?.target_status_id !== undefined) {
            return context.target_status_id;
        }
        // Priority 3: Extract from current_link
        if (context?.current_link) {
            const match = context.current_link.match(/\/(?:status|statuses)\/(\d+)/);
            return match ? match[1] : null;
        }
        return null;
    }
}
exports.GrowOps = GrowOps;
