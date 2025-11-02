import { WebDriver } from 'selenium-webdriver';
import { BaseOps } from './base';
export interface UsernameExtractionOptions {
    useAntiDetection?: boolean;
    behavioralPattern?: 'reading' | 'browsing' | 'scanning' | 'casual' | 'focused';
    mouseIntensity?: 'low' | 'medium' | 'high';
}
export interface UsernameSearchResult {
    username: string;
    profileUrl: string;
    found: boolean;
    error?: string;
}
export declare class UsernameExtractionOps extends BaseOps {
    constructor(driver: WebDriver);
    /**
     * Extract username from interaction link
     * Supports various Twitter/X link formats
     */
    extractUsernameFromLink(link: string): string | null;
    /**
     * Search for username and click on the user profile using explore tab
     */
    searchAndClickUsername(username: string, options?: UsernameExtractionOptions): Promise<UsernameSearchResult>;
    /**
     * Click with anti-detection mouse movement using rawops anti-detection
     */
    private clickWithAntiDetection;
    /**
     * Process multiple links and extract usernames
     */
    processInteractionLinks(links: string[]): Promise<Array<{
        link: string;
        username: string | null;
    }>>;
    /**
     * Get unique usernames from links
     */
    getUniqueUsernames(links: string[]): string[];
}
