import { WebDriver } from 'selenium-webdriver';
import { ProxyConfig } from './types';
import { getChromeBinaryPath } from '../config/pathConfig';
/**
 * Quit driver and save window size and position before closing
 * This ensures the final window size and position are always saved to profile config
 */
export declare function quitDriver(driver: WebDriver, profile?: string | null): Promise<void>;
/**
 * Save window size and position to profile config
 * If profile is not provided, it will try to extract it from the driver
 */
export declare function saveWindowSizeAndPosition(driver: WebDriver, profile?: string | null): Promise<void>;
/**
 * Save window size to profile config (backward compatibility)
 * If profile is not provided, it will try to extract it from the driver
 */
export declare function saveWindowSize(driver: WebDriver, profile?: string | null): Promise<void>;
/**
 * Cleanup all active proxy servers
 */
export declare function cleanupProxyServers(): Promise<void>;
export { getChromeBinaryPath };
/**
 * Setup browser with profile and proxy configuration
 */
export declare function setupBrowser(profile: string, proxyConfig?: ProxyConfig | null, mode?: 'selenium' | 'runProfile'): Promise<WebDriver | null>;
