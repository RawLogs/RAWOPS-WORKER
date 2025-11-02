import { WebDriver, WebElement } from 'selenium-webdriver';
/**
 * Enhanced Anti-Detection Integration for RawOps
 * Provides comprehensive mouse movement simulation for all scroll and click events
 */
export interface MouseMovementOptions {
    pattern?: 'reading' | 'browsing' | 'scanning' | 'casual' | 'focused';
    intensity?: 'low' | 'medium' | 'high';
    duration?: number;
    includeMicroMovements?: boolean;
    includePauses?: boolean;
}
export interface ScrollWithMouseOptions extends MouseMovementOptions {
    scrollAmount?: number;
    steps?: number;
    direction?: 'up' | 'down' | 'random';
    smoothness?: 'low' | 'medium' | 'high';
}
export interface ClickWithMouseOptions extends MouseMovementOptions {
    hoverDuration?: number;
    clickDelay?: number;
    includeHover?: boolean;
}
export interface BehavioralPattern {
    name: 'reading' | 'browsing' | 'scanning' | 'casual' | 'focused';
    mouseIntensity: number;
    pauseProbability: number;
    microMovementFrequency: number;
    scrollSpeed: number;
    clickDelay: number;
}
/**
 * Predefined behavioral patterns for different scenarios
 */
export declare const BEHAVIORAL_PATTERNS: Record<string, BehavioralPattern>;
export declare class AntiDetectionIntegration {
    private driver;
    private currentPattern;
    private sessionStartTime;
    private interactionCount;
    constructor(driver: WebDriver, initialPattern?: string);
    /**
     * Switch behavioral pattern dynamically
     */
    switchPattern(patternName: string): void;
    /**
     * Get current behavioral pattern
     */
    getCurrentPattern(): BehavioralPattern;
    /**
     * Enhanced mouse movement with realistic human behavior simulation
     */
    simulateMouseMovement(options?: MouseMovementOptions): Promise<void>;
    /**
     * Enhanced scroll with integrated mouse movement - improved smoothness
     */
    scrollWithMouseMovement(options?: ScrollWithMouseOptions): Promise<void>;
    /**
     * Enhanced click with integrated mouse movement and hover simulation
     */
    clickWithMouseMovement(element: WebElement | string, options?: ClickWithMouseOptions): Promise<boolean>;
    /**
     * Scroll to element with integrated mouse movement
     */
    private scrollToElementWithMouse;
    /**
     * Simulate approach movement before clicking
     */
    private simulateApproachMovement;
    /**
     * Simulate hover with mouse movement
     */
    private simulateHoverWithMovement;
    /**
     * Simulate post-click behavior
     */
    private simulatePostClickBehavior;
    /**
     * Generate movement pattern based on behavioral pattern
     */
    private generateMovementPattern;
    /**
     * Calculate pause duration based on behavioral pattern
     */
    private calculatePauseDuration;
    /**
     * Get session statistics
     */
    getSessionStats(): {
        duration: number;
        interactions: number;
        pattern: string;
        avgInteractionInterval: number;
    };
    /**
     * Reset session statistics
     */
    resetSession(): void;
}
/**
 * Utility functions for easy integration
 */
/**
 * Create anti-detection instance with default settings
 */
export declare function createAntiDetection(driver: WebDriver, pattern?: string): AntiDetectionIntegration;
/**
 * Quick scroll with mouse movement
 */
export declare function quickScrollWithMouse(driver: WebDriver, options?: ScrollWithMouseOptions): Promise<void>;
/**
 * Quick click with mouse movement
 */
export declare function quickClickWithMouse(driver: WebDriver, element: WebElement | string, options?: ClickWithMouseOptions): Promise<boolean>;
/**
 * Simulate realistic browsing session
 */
export declare function simulateBrowsingSession(driver: WebDriver, actions: Array<() => Promise<void>>, pattern?: 'reading' | 'browsing' | 'scanning' | 'casual' | 'focused'): Promise<void>;
