import { WebDriver, WebElement } from 'selenium-webdriver';
import { AntiDetectionIntegration, ClickWithMouseOptions } from './anti-detection';
export interface ScrollOptions {
    duration?: number;
    speed?: number;
    direction?: 'up' | 'down';
    steps?: number;
}
export interface WaitOptions {
    timeout?: number;
    waitForNetworkIdle?: boolean;
    waitForElement?: string;
}
export interface InteractionResult {
    success: boolean;
    error?: string;
    data?: any;
}
export interface ClickOptions extends ClickWithMouseOptions {
    useAntiDetection?: boolean;
    behavioralPattern?: 'reading' | 'browsing' | 'scanning' | 'casual' | 'focused';
    mouseIntensity?: 'low' | 'medium' | 'high';
    timeout?: number;
}
export declare class BaseOps {
    protected driver: WebDriver;
    protected antiDetection: AntiDetectionIntegration;
    constructor(driver: WebDriver);
    protected randomDelay(min?: number, max?: number): Promise<void>;
    protected randomMouseMovement(): Promise<void>;
    protected smoothScroll(options?: ScrollOptions): Promise<void>;
    protected waitForStability(options?: WaitOptions): Promise<void>;
    protected safeClick(selector: string, options?: ClickOptions): Promise<boolean>;
    protected safeFill(selector: string, text: string, options?: {
        timeout?: number;
    }): Promise<boolean>;
    protected typeCharacterByCharacter(selector: string, text: string): Promise<boolean>;
    protected typeCharacterByCharacterElement(element: WebElement, text: string): Promise<boolean>;
    protected typeCommentForXEditor(element: WebElement, comment: string): Promise<boolean>;
    /**
     * Find element by CSS selector with optional timeout
     */
    protected findElementByCss(selector: string, timeout?: number): Promise<WebElement>;
    /**
     * Find elements by CSS selector
     */
    protected findElementsByCss(selector: string): Promise<WebElement[]>;
    /**
     * Find element by XPath selector
     */
    protected findElementByXpath(xpath: string): Promise<WebElement>;
    /**
     * Find elements by XPath selector
     */
    protected findElementsByXpath(xpath: string): Promise<WebElement[]>;
    protected cleanExtractedContent(content: string, username?: string): string;
}
//# sourceMappingURL=base.d.ts.map