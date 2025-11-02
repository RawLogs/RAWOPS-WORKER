import { WebDriver, WebElement } from 'selenium-webdriver';
import { WaitOptions } from './types';
/**
 * Random delay function with customizable range
 */
export declare function randomDelay(minMs?: number, maxMs?: number): Promise<void>;
/**
 * Wait for element to be present
 */
export declare function waitForElement(driver: WebDriver, selector: string, timeout?: number): Promise<WebElement>;
/**
 * Wait for network idle state
 */
export declare function waitForNetworkIdle(driver: WebDriver, timeout?: number): Promise<void>;
/**
 * Wait for page to be fully loaded
 */
export declare function waitForPageLoad(driver: WebDriver, timeout?: number): Promise<void>;
/**
 * Wait for element to be visible
 */
export declare function waitForElementVisible(driver: WebDriver, selector: string, timeout?: number): Promise<WebElement>;
/**
 * Wait for element to be clickable
 */
export declare function waitForElementClickable(driver: WebDriver, selector: string, timeout?: number): Promise<WebElement>;
/**
 * Wait for text to be present in element
 */
export declare function waitForTextInElement(driver: WebDriver, selector: string, expectedText: string, timeout?: number): Promise<void>;
/**
 * Wait for URL to change
 */
export declare function waitForUrlChange(driver: WebDriver, currentUrl: string, timeout?: number): Promise<void>;
/**
 * Wait for multiple conditions
 */
export declare function waitForConditions(driver: WebDriver, options: WaitOptions): Promise<void>;
/**
 * Smart wait that adapts based on page state
 */
export declare function smartWait(driver: WebDriver, timeout?: number): Promise<void>;
