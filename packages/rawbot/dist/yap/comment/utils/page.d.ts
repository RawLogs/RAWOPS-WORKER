import { WebDriver } from 'selenium-webdriver';
import { ExtractionOps } from '@rawops/rawops';
/**
 * Check if page has loaded by looking for tweet elements and checking for errors
 */
export declare function checkPageLoad(driver: WebDriver, extractionOps: ExtractionOps): Promise<boolean>;
/**
 * Wait for page to load with timeout
 */
export declare function waitForPageLoad(driver: WebDriver, extractionOps: ExtractionOps, commentOps: any, maxWaitTime?: number): Promise<{
    success: boolean;
    errorDetail?: any;
}>;
/**
 * Get page information including replies, tweet count, and main tweet URL
 */
export declare function getPageInfo(extractionOps: ExtractionOps): Promise<{
    hasReplies: boolean;
    tweetCount: number;
    mainTweetUrl: string | null;
}>;
//# sourceMappingURL=page.d.ts.map