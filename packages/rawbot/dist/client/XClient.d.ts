import { WebDriver } from 'selenium-webdriver';
import { ProxyConfig } from '@rawops/rawops';
export declare class XClient {
    private driver;
    private isInitialized;
    constructor();
    /**
     * Initialize the client with profile and proxy configuration
     */
    initialize(profileHandle: string, proxyConfig: ProxyConfig | null, mode: 'auto' | 'runProfile'): Promise<void>;
    /**
     * Get the WebDriver instance
     */
    getDriver(): WebDriver | null;
    /**
     * Get current URL
     */
    getCurrentUrl(): Promise<string>;
    /**
     * Navigate to URL
     */
    navigateTo(url: string): Promise<void>;
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms: number): Promise<void>;
    /**
     * Take screenshot
     */
    takeScreenshot(): Promise<string>;
    /**
     * Close the client
     */
    close(): Promise<void>;
    /**
     * Initialize for run profile mode (legacy compatibility)
     */
    initializeForRunProfile(profileHandle: string, proxyConfig?: any): Promise<void>;
    /**
     * Initialize for automation mode (legacy compatibility)
     */
    initializeForAutomation(profileHandle: string, proxyConfig?: any): Promise<void>;
}
