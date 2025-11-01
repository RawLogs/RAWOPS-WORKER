import { WebDriver } from 'selenium-webdriver';
export interface ErrorDetail {
    type: 'page_not_found' | 'account_suspended' | 'tweet_unavailable' | 'unknown';
    message: string;
    originalText: string;
    timestamp: string;
}
export interface ErrorDriverOptions {
    timeout?: number;
    retries?: number;
}
/**
 * Error Driver for extracting error details from Twitter/X pages
 * Handles various error scenarios and extracts meaningful error information
 */
export declare class ErrorDriver {
    private driver;
    private options;
    constructor(driver: WebDriver, options?: ErrorDriverOptions);
    /**
     * Extract error details from the current page
     * Checks for data-testid="error-detail" and other error indicators
     */
    extractErrorDetails(): Promise<ErrorDetail | null>;
    /**
     * Check for error elements in various locations
     */
    private checkErrorDetailElement;
    /**
     * Check if text contains error indicators
     */
    private containsErrorText;
    /**
     * Check for common error patterns on Twitter/X using improved selectors
     */
    private checkCommonErrorPatterns;
    /**
     * Check page title for error indicators
     */
    private checkPageTitleForErrors;
    /**
     * Classify error type based on error text
     */
    private classifyErrorType;
    /**
     * Extract clean error message from error text
     */
    private extractErrorMessage;
    /**
     * Check if current page has any error indicators
     */
    hasError(): Promise<boolean>;
    /**
     * Get detailed error information for logging
     */
    getErrorInfo(): Promise<{
        hasError: boolean;
        errorDetail: ErrorDetail | null;
        currentUrl: string;
        pageTitle: string;
    }>;
}
/**
 * Utility function to extract error details from a page
 */
export declare function extractErrorDetails(driver: WebDriver, options?: ErrorDriverOptions): Promise<ErrorDetail | null>;
/**
 * Utility function to check if page has errors
 */
export declare function hasPageError(driver: WebDriver, options?: ErrorDriverOptions): Promise<boolean>;
//# sourceMappingURL=error-driver.d.ts.map