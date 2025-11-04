import { WebDriver } from 'selenium-webdriver';
import { BaseOps, InteractionResult } from './base';
export interface ScrollOptions {
    duration?: number;
    speed?: number;
    direction?: 'up' | 'down';
    steps?: number;
    target?: 'tweets' | 'page' | 'element';
    maxScrolls?: number;
    delayBetweenScrolls?: number;
    scrollAmount?: number;
    smoothness?: 'low' | 'medium' | 'high';
    useAntiDetection?: boolean;
    behavioralPattern?: 'reading' | 'browsing' | 'scanning' | 'casual' | 'focused';
    mouseIntensity?: 'low' | 'medium' | 'high';
}
export declare class ScrollOps extends BaseOps {
    constructor(driver: WebDriver);
    /**
     * Smooth scroll with customizable options and anti-detection
     */
    smoothScrollWithResult(options?: ScrollOptions): Promise<InteractionResult>;
    /**
     * Scroll to load more tweets with anti-detection
     */
    scrollToLoadTweets(options?: ScrollOptions): Promise<InteractionResult>;
    /**
     * Scroll to specific element
     */
    scrollToElement(selector: string): Promise<InteractionResult>;
    /**
     * Scroll to top of page
     */
    scrollToTop(): Promise<InteractionResult>;
    /**
     * Scroll to bottom of page
     */
    scrollToBottom(): Promise<InteractionResult>;
    /**
     * Random scroll pattern to mimic human behavior
     */
    randomScroll(options?: ScrollOptions): Promise<InteractionResult>;
    /**
     * Scroll to specific tweet by index
     */
    scrollToTweet(index: number): Promise<InteractionResult>;
    /**
     * Infinite scroll until no more content
     */
    infiniteScroll(options?: ScrollOptions): Promise<InteractionResult>;
    /**
     * Scroll step with customizable times, distance, and direction
     * Supports both new format (times, distance, randomize) and legacy format (direction, distance as string)
     */
    scrollStep(options?: {
        times?: number;
        distance?: number | string;
        direction?: 'up' | 'down';
        randomize?: boolean;
    }): Promise<InteractionResult>;
    /**
     * Random scroll with min/max steps
     */
    scrollRandom(options?: {
        minSteps?: number;
        maxSteps?: number;
        direction?: 'up' | 'down';
        stepDelay?: number | [number, number];
    }): Promise<InteractionResult>;
    /**
     * Scroll and detect tweets by status ID
     * Returns tweet data when found, or null if not found after max scroll steps
     */
    scrollAndDetectTweets(targetStatusId: string | null, options?: {
        maxScrollSteps?: number;
        scrollHeight?: number;
        scrollDelay?: number;
        detectLimit?: number;
    }): Promise<{
        tweet: {
            element: any;
            link: string;
            statusId: string | null;
            cellInnerDiv: any;
            timestamp: string | null;
        } | null;
        scrollSteps: number;
        detectedTweets: Array<{
            element: any;
            link: string;
            statusId: string | null;
            cellInnerDiv: any;
            timestamp: string | null;
        }>;
    }>;
}
export declare function smoothRandomScroll(driver: WebDriver, duration?: number): Promise<void>;
