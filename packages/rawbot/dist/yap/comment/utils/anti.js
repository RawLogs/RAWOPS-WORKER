"use strict";
// packages/rawbot/src/yap/comment/utils/anti-detection-utils.ts
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
exports.performRandomScrollPattern = performRandomScrollPattern;
exports.scrollToFindComments = scrollToFindComments;
exports.performIdleScroll = performIdleScroll;
exports.performRandomMouseMovements = performRandomMouseMovements;
/**
 * Perform random scroll pattern using rawops anti-detection
 */
async function performRandomScrollPattern(driver, scrollOps, commentOps) {
    try {
        const patterns = [
            {
                name: 'casual_browsing',
                duration: 4000,
                steps: 8,
                direction: 'down',
                mouseIntensity: 'low',
                minScrollHeight: 800 // Minimum height to see comments
            },
            {
                name: 'reading_pattern',
                duration: 5000,
                steps: 10,
                direction: 'down',
                mouseIntensity: 'medium',
                minScrollHeight: 1000
            },
            {
                name: 'quick_scan',
                duration: 3000,
                steps: 6,
                direction: 'down',
                mouseIntensity: 'high',
                minScrollHeight: 600
            },
            {
                name: 'thorough_read',
                duration: 6000,
                steps: 12,
                direction: 'down',
                mouseIntensity: 'low',
                minScrollHeight: 1200
            }
        ];
        const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
        console.log(`[YapComment] [AntiDetection] Using ${randomPattern.name} scroll pattern (min height: ${randomPattern.minScrollHeight}px)...`);
        await scrollOps.smoothScrollWithResult({
            duration: randomPattern.duration,
            steps: randomPattern.steps,
            direction: randomPattern.direction,
            useAntiDetection: true,
            behavioralPattern: 'browsing',
            mouseIntensity: randomPattern.mouseIntensity,
            scrollAmount: randomPattern.minScrollHeight, // Use minScrollHeight as scroll amount
            smoothness: 'high' // Force high smoothness
        });
    }
    catch (error) {
        console.log('[YapComment] Error performing random scroll pattern:', error);
    }
}
/**
 * Scroll to find comments for replying using rawops anti-detection
 */
async function scrollToFindComments(driver, scrollOps, extractionOps, commentOps) {
    try {
        console.log('[YapComment] [AntiDetection] Scrolling to find comments...');
        // Scroll down to see more comments
        await scrollOps.smoothScrollWithResult({
            duration: 4000,
            steps: 12,
            direction: 'down',
            useAntiDetection: true,
            behavioralPattern: 'browsing',
            mouseIntensity: 'medium',
            scrollAmount: 1000, // Scroll 1000px to see comments
            smoothness: 'high'
        });
        // Small pause to let comments load
        await commentOps.randomDelay(2000, 3000);
        // Check if we found comments
        const hasReplies = await extractionOps.hasReplies();
        if (hasReplies) {
            console.log('[YapComment] Found comments after scrolling');
        }
        else {
            console.log('[YapComment] No comments found, scrolling more...');
            // Scroll more if no comments found
            await scrollOps.smoothScrollWithResult({
                duration: 3000,
                steps: 8,
                direction: 'down',
                useAntiDetection: true,
                behavioralPattern: 'browsing',
                mouseIntensity: 'low',
                scrollAmount: 800, // Scroll 800px more
                smoothness: 'high'
            });
        }
    }
    catch (error) {
        console.log('[YapComment] Error scrolling to find comments:', error);
    }
}
/**
 * Perform idle scroll to simulate human behavior
 */
async function performIdleScroll(driver, scrollOps, commentOps) {
    try {
        // Random idle scrolling to simulate human behavior
        const shouldIdleScroll = Math.random() < 0.3; // 30% chance
        if (shouldIdleScroll) {
            console.log('[YapComment] [AntiDetection] Performing idle scroll...');
            await scrollOps.smoothScrollWithResult({
                duration: 2000,
                steps: 4,
                direction: Math.random() < 0.5 ? 'up' : 'down',
                useAntiDetection: true,
                behavioralPattern: 'browsing',
                mouseIntensity: 'low',
                scrollAmount: 300, // Small scroll for idle behavior
                smoothness: 'high'
            });
            // Small pause after idle scroll
            await commentOps.randomDelay(1000, 2000);
        }
    }
    catch (error) {
        console.log('[YapComment] Error performing idle scroll:', error);
    }
}
/**
 * Perform random mouse movements for anti-detection using rawops anti-detection
 */
async function performRandomMouseMovements(driver, commentOps) {
    try {
        // Import anti-detection integration from rawops
        const { AntiDetectionIntegration } = await Promise.resolve().then(() => __importStar(require('@rawops/rawops')));
        const antiDetection = new AntiDetectionIntegration(driver, 'browsing');
        // Use the anti-detection library for safe mouse movements
        await antiDetection.simulateMouseMovement({
            pattern: 'browsing',
            intensity: 'low',
            duration: 2000,
            includeMicroMovements: true,
            includePauses: true
        });
        console.log('[YapComment] Random mouse movements completed using anti-detection');
    }
    catch (error) {
        console.log('[YapComment] Error performing random mouse movements:', error);
        // Fallback to simple delay if mouse movements fail
        await commentOps.randomDelay(1000, 2000);
    }
}
//# sourceMappingURL=anti.js.map