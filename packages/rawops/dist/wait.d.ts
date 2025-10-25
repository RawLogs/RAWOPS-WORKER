import { WebDriver } from 'selenium-webdriver';
import { BaseOps, InteractionResult } from './base';
export interface WaitOptions {
    timeout?: number;
    waitForNetworkIdle?: boolean;
    waitForElement?: string;
    waitForText?: string;
    waitForSelector?: string;
}
export declare class WaitOps extends BaseOps {
    constructor(driver: WebDriver);
    /**
     * Wait for network to be idle
     */
    waitForNetworkIdle(timeout?: number): Promise<InteractionResult>;
    /**
     * Wait for element to be visible and stable
     */
    waitForElementStable(selector: string, timeout?: number): Promise<InteractionResult>;
    /**
     * Wait for text to appear
     */
    waitForText(text: string, timeout?: number): Promise<InteractionResult>;
    /**
     * Wait for page to be fully loaded
     */
    waitForPageLoad(timeout?: number): Promise<InteractionResult>;
    /**
     * Wait for tweets to load
     */
    waitForTweetsToLoad(timeout?: number): Promise<InteractionResult>;
    /**
     * Wait for specific number of tweets
     */
    waitForTweetCount(count: number, timeout?: number): Promise<InteractionResult>;
    /**
     * Wait for element to disappear
     */
    waitForElementToDisappear(selector: string, timeout?: number): Promise<InteractionResult>;
    /**
     * Wait for URL to change
     */
    waitForUrlChange(currentUrl: string, timeout?: number): Promise<InteractionResult>;
    /**
     * Wait for specific condition
     */
    waitForCondition(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<InteractionResult>;
    /**
     * Wait for random time (human-like behavior)
     */
    waitRandom(min?: number, max?: number): Promise<InteractionResult>;
    /**
     * Wait for element to be clickable
     */
    waitForClickable(selector: string, timeout?: number): Promise<InteractionResult>;
    /**
     * Wait for form to be ready
     */
    waitForFormReady(formSelector?: string, timeout?: number): Promise<InteractionResult>;
}
//# sourceMappingURL=wait.d.ts.map