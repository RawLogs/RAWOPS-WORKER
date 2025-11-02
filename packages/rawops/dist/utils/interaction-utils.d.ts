import { WebDriver } from 'selenium-webdriver';
/**
 * Random mouse movement to simulate human behavior
 */
export declare function randomMouseMovement(driver: WebDriver): Promise<void>;
/**
 * Advanced mouse movement with pattern simulation
 */
export declare function advancedMouseMovement(driver: WebDriver, pattern?: 'reading' | 'browsing' | 'scanning'): Promise<void>;
/**
 * Simulate human-like mouse movement with curves
 */
export declare function curvedMouseMovement(driver: WebDriver, duration?: number): Promise<void>;
/**
 * Simulate reading behavior with pauses
 */
export declare function simulateReadingBehavior(driver: WebDriver): Promise<void>;
/**
 * Generate realistic mouse movement pattern
 */
export declare function generateMousePattern(progress: number, patternType: 'reading' | 'browsing' | 'scanning'): {
    offsetX: number;
    offsetY: number;
};
