import { WebDriver } from 'selenium-webdriver';
import { ProxyConfig } from './types';
/**
 * Cleanup all active proxy servers
 */
export declare function cleanupProxyServers(): Promise<void>;
export declare function getChromeBinaryPath(): string;
/**
 * Setup browser with profile and proxy configuration
 */
export declare function setupBrowser(profile: string, proxyConfig?: ProxyConfig | null, mode?: 'selenium' | 'runProfile'): Promise<WebDriver | null>;
//# sourceMappingURL=browser-setup.d.ts.map