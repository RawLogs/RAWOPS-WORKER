/**
 * User-Agent Configuration for 2025
 * Contains the latest and most popular User-Agent strings
 * Updated: January 2025
 *
 * IMPORTANT: This module now provides IP-based geolocation synchronization
 * to ensure User-Agent, Accept-Language, timezone, and geolocation are consistent
 */
declare const CHROME_VERSIONS: string[];
declare const WEBKIT_VERSIONS: string[];
declare const OPERATING_SYSTEMS: {
    windows: string[];
    macos: string[];
};
declare const GEOGRAPHIC_REGIONS: {
    VN: {
        country: string;
        languages: string[];
        timezone: string;
        locale: string;
        currency: string;
        osDistribution: {
            windows: number;
            macos: number;
        };
        browserDistribution: {
            chrome: number;
            edge: number;
            firefox: number;
            safari: number;
        };
    };
    US: {
        country: string;
        languages: string[];
        timezone: string;
        locale: string;
        currency: string;
        osDistribution: {
            windows: number;
            macos: number;
        };
        browserDistribution: {
            chrome: number;
            safari: number;
            edge: number;
            firefox: number;
        };
    };
    JP: {
        country: string;
        languages: string[];
        timezone: string;
        locale: string;
        currency: string;
        osDistribution: {
            windows: number;
            macos: number;
        };
        browserDistribution: {
            chrome: number;
            safari: number;
            edge: number;
            firefox: number;
        };
    };
    KR: {
        country: string;
        languages: string[];
        timezone: string;
        locale: string;
        currency: string;
        osDistribution: {
            windows: number;
            macos: number;
        };
        browserDistribution: {
            chrome: number;
            edge: number;
            safari: number;
            firefox: number;
        };
    };
    CN: {
        country: string;
        languages: string[];
        timezone: string;
        locale: string;
        currency: string;
        osDistribution: {
            windows: number;
            macos: number;
        };
        browserDistribution: {
            chrome: number;
            edge: number;
            firefox: number;
            safari: number;
        };
    };
    TH: {
        country: string;
        languages: string[];
        timezone: string;
        locale: string;
        currency: string;
        osDistribution: {
            windows: number;
            macos: number;
        };
        browserDistribution: {
            chrome: number;
            edge: number;
            firefox: number;
            safari: number;
        };
    };
};
declare const POPULAR_USER_AGENTS: string[];
declare const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
declare const EDGE_VERSIONS: string[];
declare const FIREFOX_VERSIONS: string[];
declare const SAFARI_VERSIONS: string[];
export interface ProxyConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
    scheme?: string;
}
export interface LocationInfo {
    country?: string;
    countryName?: string;
    region?: string;
    city?: string;
    timezone?: string;
    languages?: string[];
    success: boolean;
    error?: string;
}
export interface SynchronizedConfig {
    userAgent: string;
    acceptLanguage: string;
    timezone: string;
    locale: string;
    country: string;
    countryName: string;
    currency: string;
    osType: string;
    browserType: string;
    screenResolution: {
        width: number;
        height: number;
    };
    webglInfo: {
        vendor: string;
        renderer: string;
    };
    fingerprint: string;
    synchronized: boolean;
    locationInfo?: {
        country?: string;
        countryName?: string;
        region?: string;
        city?: string;
    };
}
/**
 * Detect IP location using external service
 */
export declare function detectIPLocation(proxyConfig?: ProxyConfig | null): Promise<LocationInfo>;
/**
 * Generate synchronized configuration based on IP location
 */
export declare function generateSynchronizedConfig(profile: string, locationInfo: LocationInfo, config?: SynchronizedConfig | null): SynchronizedConfig;
/**
 * Generate a random User-Agent based on profile seed
 */
export declare function generateUserAgent(profile: string, config?: SynchronizedConfig | null): string;
export declare function getActualScreenResolution(): {
    width: number;
    height: number;
};
export { POPULAR_USER_AGENTS, CHROME_VERSIONS, WEBKIT_VERSIONS, OPERATING_SYSTEMS, EDGE_VERSIONS, FIREFOX_VERSIONS, SAFARI_VERSIONS, GEOGRAPHIC_REGIONS, DEFAULT_USER_AGENT };
