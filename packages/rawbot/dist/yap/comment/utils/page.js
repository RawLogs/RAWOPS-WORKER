"use strict";
// packages/rawbot/src/yap/comment/utils/page-utils.ts
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
exports.checkPageLoad = checkPageLoad;
exports.waitForPageLoad = waitForPageLoad;
exports.getPageInfo = getPageInfo;
/**
 * Check if page has loaded by looking for tweet elements and checking for errors
 */
async function checkPageLoad(driver, extractionOps) {
    try {
        // First check for error indicators
        const { ErrorDriver } = await Promise.resolve().then(() => __importStar(require('@rawops/rawops')));
        const errorDriver = new ErrorDriver(driver);
        const hasError = await errorDriver.hasError();
        if (hasError) {
            const errorDetail = await errorDriver.extractErrorDetails();
            console.log(`[YapComment] Page has error: ${errorDetail?.type} - ${errorDetail?.message}`);
            return false; // Page loaded but has error
        }
        // Check if page has loaded by looking for tweet elements
        const tweetCount = await extractionOps.getTweetCount();
        const hasValidContent = tweetCount > 0;
        if (!hasValidContent) {
            console.log('[YapComment] Page loaded but no tweet content found');
        }
        return hasValidContent;
    }
    catch (error) {
        console.log('[YapComment] Error checking page load:', error);
        return false;
    }
}
/**
 * Wait for page to load with timeout
 */
async function waitForPageLoad(driver, extractionOps, commentOps, maxWaitTime = 15000) {
    const startTime = Date.now();
    let attempts = 0;
    console.log(`[YapComment] Starting page load check (max wait: ${maxWaitTime / 1000}s)`);
    while (Date.now() - startTime < maxWaitTime) {
        attempts++;
        console.log(`[YapComment] Page load check attempt ${attempts}...`);
        try {
            // Check for errors first
            const { ErrorDriver } = await Promise.resolve().then(() => __importStar(require('@rawops/rawops')));
            const errorDriver = new ErrorDriver(driver);
            const hasError = await errorDriver.hasError();
            if (hasError) {
                const errorDetail = await errorDriver.extractErrorDetails();
                console.log(`[YapComment] Page has error after ${attempts} attempts: ${errorDetail?.type} - ${errorDetail?.message}`);
                return { success: false, errorDetail };
            }
            // Check if page has valid content
            const tweetCount = await extractionOps.getTweetCount();
            if (tweetCount > 0) {
                console.log(`[YapComment] Page loaded successfully after ${attempts} attempts`);
                return { success: true };
            }
            console.log(`[YapComment] Page loaded but no content found (attempt ${attempts})`);
        }
        catch (error) {
            console.log(`[YapComment] Error during page load check attempt ${attempts}:`, error);
        }
        // Wait before next attempt
        await commentOps.randomDelay(2000, 3000);
    }
    console.log(`[YapComment] Page load timeout after ${attempts} attempts`);
    return { success: false };
}
/**
 * Get page information including replies, tweet count, and main tweet URL
 */
async function getPageInfo(extractionOps) {
    try {
        const hasReplies = await extractionOps.hasReplies();
        const tweetCount = await extractionOps.getTweetCount();
        const mainTweetUrl = await extractionOps.getCurrentTweetUrl();
        return {
            hasReplies,
            tweetCount,
            mainTweetUrl
        };
    }
    catch (error) {
        console.log('[YapComment] Error getting page info:', error);
        return {
            hasReplies: false,
            tweetCount: 0,
            mainTweetUrl: null
        };
    }
}
//# sourceMappingURL=page.js.map