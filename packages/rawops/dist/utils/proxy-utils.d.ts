import { ProxyConfig } from './types';
/**
 * Parse proxy string into ProxyConfig object
 * Supports formats:
 * - ip:port
 * - ip:port:user:pass
 */
export declare function parseProxyString(proxyString: string): ProxyConfig | null;
/**
 * Validate proxy configuration
 */
export declare function validateProxyConfig(proxyConfig: ProxyConfig): boolean;
/**
 * Format proxy URL for Chrome arguments
 */
export declare function formatProxyUrl(proxyConfig: ProxyConfig): string;
/**
 * Create proxy configuration from environment variables
 */
export declare function createProxyFromEnv(): ProxyConfig | null;
//# sourceMappingURL=proxy-utils.d.ts.map