"use strict";
// packages/rawbot/src/driver/drivers.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFollowRatio = exports.Drivers = void 0;
const rawops_1 = require("@rawops/rawops");
const rawops_2 = require("@rawops/rawops");
Object.defineProperty(exports, "calculateFollowRatio", { enumerable: true, get: function () { return rawops_2.calculateFollowRatio; } });
/**
 * Unified Drivers class that aggregates all driver operations from rawops package
 *
 * This class provides a centralized way to access all driver functionality
 * for use across different yap modules (comment, grow, etc.)
 *
 * Usage:
 * ```typescript
 * const drivers = new Drivers(driver);
 * await drivers.scroll.scrollToTop();
 * await drivers.like.likeFirstTweet();
 * await drivers.comment.commentOnFirstTweet('Hello');
 * await drivers.profile.followProfile();
 * const profileData = await drivers.profile.extractProfileData(url);
 * ```
 */
class Drivers {
    constructor(driver) {
        if (!driver) {
            throw new Error('WebDriver instance is required');
        }
        this._driver = driver;
        // Initialize all operations
        this.comment = new rawops_1.CommentOps(driver);
        this.like = new rawops_1.LikeOps(driver);
        this.scroll = new rawops_1.ScrollOps(driver);
        this.extraction = new rawops_1.ExtractionOps(driver);
        this.usernameExtraction = new rawops_1.UsernameExtractionOps(driver);
        this.profile = new rawops_1.ProfileOps(driver);
        this.followerDiscovery = new rawops_1.FollowerDiscoveryOps(driver);
        this.grow = new rawops_1.GrowOps(driver);
        this.wait = new rawops_1.WaitOps(driver);
    }
    /**
     * Get the underlying WebDriver instance
     */
    getDriver() {
        return this._driver;
    }
    /**
     * Check if driver is initialized
     */
    isInitialized() {
        return this._driver !== null && this._driver !== undefined;
    }
}
exports.Drivers = Drivers;
