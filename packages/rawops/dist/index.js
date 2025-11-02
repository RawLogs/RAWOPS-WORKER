"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawOps = exports.DEFAULT_USER_AGENT = exports.POPULAR_USER_AGENTS = exports.getActualScreenResolution = exports.generateUserAgent = exports.generateSynchronizedConfig = exports.detectIPLocation = exports.smoothRandomScroll = exports.parseProxyString = exports.randomDelay = exports.setupBrowser = exports.BEHAVIORAL_PATTERNS = exports.simulateBrowsingSession = exports.quickClickWithMouse = exports.quickScrollWithMouse = exports.createAntiDetection = exports.AntiDetectionIntegration = exports.calculateFollowRatio = exports.hasPageError = exports.extractErrorDetails = exports.ErrorDriver = exports.ProfileOps = exports.UsernameExtractionOps = exports.ExtractionOps = exports.EngagementOps = exports.WaitOps = exports.ScrollOps = exports.SearchOps = exports.CommentOps = exports.PostOps = exports.LikeOps = exports.BaseOps = void 0;
// Import all operation classes
const base_1 = require("./base");
Object.defineProperty(exports, "BaseOps", { enumerable: true, get: function () { return base_1.BaseOps; } });
const like_1 = require("./like");
Object.defineProperty(exports, "LikeOps", { enumerable: true, get: function () { return like_1.LikeOps; } });
const post_1 = require("./post");
Object.defineProperty(exports, "PostOps", { enumerable: true, get: function () { return post_1.PostOps; } });
const comment_1 = require("./comment");
Object.defineProperty(exports, "CommentOps", { enumerable: true, get: function () { return comment_1.CommentOps; } });
const search_1 = require("./search");
Object.defineProperty(exports, "SearchOps", { enumerable: true, get: function () { return search_1.SearchOps; } });
const scroll_1 = require("./scroll");
Object.defineProperty(exports, "ScrollOps", { enumerable: true, get: function () { return scroll_1.ScrollOps; } });
const wait_1 = require("./wait");
Object.defineProperty(exports, "WaitOps", { enumerable: true, get: function () { return wait_1.WaitOps; } });
const engagement_1 = require("./engagement");
Object.defineProperty(exports, "EngagementOps", { enumerable: true, get: function () { return engagement_1.EngagementOps; } });
const extraction_1 = require("./extraction");
Object.defineProperty(exports, "ExtractionOps", { enumerable: true, get: function () { return extraction_1.ExtractionOps; } });
const username_extraction_1 = require("./username-extraction");
Object.defineProperty(exports, "UsernameExtractionOps", { enumerable: true, get: function () { return username_extraction_1.UsernameExtractionOps; } });
const profile_1 = require("./profile");
Object.defineProperty(exports, "ProfileOps", { enumerable: true, get: function () { return profile_1.ProfileOps; } });
const error_driver_1 = require("./error-driver");
Object.defineProperty(exports, "ErrorDriver", { enumerable: true, get: function () { return error_driver_1.ErrorDriver; } });
// Import anti-detection integration
const anti_detection_1 = require("./anti-detection");
Object.defineProperty(exports, "AntiDetectionIntegration", { enumerable: true, get: function () { return anti_detection_1.AntiDetectionIntegration; } });
Object.defineProperty(exports, "createAntiDetection", { enumerable: true, get: function () { return anti_detection_1.createAntiDetection; } });
Object.defineProperty(exports, "quickScrollWithMouse", { enumerable: true, get: function () { return anti_detection_1.quickScrollWithMouse; } });
Object.defineProperty(exports, "quickClickWithMouse", { enumerable: true, get: function () { return anti_detection_1.quickClickWithMouse; } });
Object.defineProperty(exports, "simulateBrowsingSession", { enumerable: true, get: function () { return anti_detection_1.simulateBrowsingSession; } });
Object.defineProperty(exports, "BEHAVIORAL_PATTERNS", { enumerable: true, get: function () { return anti_detection_1.BEHAVIORAL_PATTERNS; } });
// Import selenium utilities
const selenium_utils_1 = require("./selenium-utils");
Object.defineProperty(exports, "setupBrowser", { enumerable: true, get: function () { return selenium_utils_1.setupBrowser; } });
Object.defineProperty(exports, "randomDelay", { enumerable: true, get: function () { return selenium_utils_1.randomDelay; } });
Object.defineProperty(exports, "parseProxyString", { enumerable: true, get: function () { return selenium_utils_1.parseProxyString; } });
const scroll_2 = require("./scroll");
Object.defineProperty(exports, "smoothRandomScroll", { enumerable: true, get: function () { return scroll_2.smoothRandomScroll; } });
// Import user agent and fingerprinting
const userAgentConfig_1 = require("./config/userAgentConfig");
Object.defineProperty(exports, "detectIPLocation", { enumerable: true, get: function () { return userAgentConfig_1.detectIPLocation; } });
Object.defineProperty(exports, "generateSynchronizedConfig", { enumerable: true, get: function () { return userAgentConfig_1.generateSynchronizedConfig; } });
Object.defineProperty(exports, "generateUserAgent", { enumerable: true, get: function () { return userAgentConfig_1.generateUserAgent; } });
Object.defineProperty(exports, "getActualScreenResolution", { enumerable: true, get: function () { return userAgentConfig_1.getActualScreenResolution; } });
Object.defineProperty(exports, "POPULAR_USER_AGENTS", { enumerable: true, get: function () { return userAgentConfig_1.POPULAR_USER_AGENTS; } });
Object.defineProperty(exports, "DEFAULT_USER_AGENT", { enumerable: true, get: function () { return userAgentConfig_1.DEFAULT_USER_AGENT; } });
// Export utility functions
var error_driver_2 = require("./error-driver");
Object.defineProperty(exports, "extractErrorDetails", { enumerable: true, get: function () { return error_driver_2.extractErrorDetails; } });
Object.defineProperty(exports, "hasPageError", { enumerable: true, get: function () { return error_driver_2.hasPageError; } });
var profile_2 = require("./profile");
Object.defineProperty(exports, "calculateFollowRatio", { enumerable: true, get: function () { return profile_2.calculateFollowRatio; } });
/**
 * Main RawOps class that combines all operations
 */
class RawOps {
    constructor(driver, initialBehavioralPattern = 'browsing') {
        this.driver = driver;
        this.like = new like_1.LikeOps(driver);
        this.post = new post_1.PostOps(driver);
        this.comment = new comment_1.CommentOps(driver);
        this.search = new search_1.SearchOps(driver);
        this.scroll = new scroll_1.ScrollOps(driver);
        this.wait = new wait_1.WaitOps(driver);
        this.engagement = new engagement_1.EngagementOps(driver);
        this.extraction = new extraction_1.ExtractionOps(driver);
        this.usernameExtraction = new username_extraction_1.UsernameExtractionOps(driver);
        this.profile = new profile_1.ProfileOps(driver);
        this.errorDriver = new error_driver_1.ErrorDriver(driver);
        this.antiDetection = new anti_detection_1.AntiDetectionIntegration(driver, initialBehavioralPattern);
    }
    /**
     * Navigate to Twitter/X
     */
    async navigateToTwitter() {
        await this.driver.get('https://x.com');
        await this.driver.sleep(3000);
    }
    /**
     * Navigate to home feed
     */
    async navigateToHome() {
        await this.driver.get('https://x.com/home');
        await this.wait.waitForTweetsToLoad();
    }
    /**
     * Navigate to user profile
     */
    async navigateToProfile(username) {
        const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
        await this.driver.get(`https://x.com/${cleanUsername}`);
        await this.wait.waitForPageLoad();
    }
    /**
     * Get current page URL
     */
    async getCurrentUrl() {
        return await this.driver.getCurrentUrl();
    }
    /**
     * Switch behavioral pattern for anti-detection
     */
    switchBehavioralPattern(pattern) {
        this.antiDetection.switchPattern(pattern);
    }
    /**
     * Get current behavioral pattern
     */
    getCurrentBehavioralPattern() {
        return this.antiDetection.getCurrentPattern().name;
    }
    /**
     * Get anti-detection session statistics
     */
    getAntiDetectionStats() {
        return this.antiDetection.getSessionStats();
    }
    /**
     * Simulate realistic browsing session with multiple actions
     */
    async simulateBrowsingSession(actions) {
        await (0, anti_detection_1.simulateBrowsingSession)(this.driver, actions, this.getCurrentBehavioralPattern());
    }
    /**
     * Close the browser
     */
    async close() {
        await this.driver.quit();
    }
}
exports.RawOps = RawOps;
