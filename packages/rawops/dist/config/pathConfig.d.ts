/**
 * Path Configuration
 * Centralized configuration for all folder structures and paths used in the application
 */
/**
 * Get project root directory
 * Project root is 4 levels up from this file (packages/rawops/src/config)
 */
export declare function getProjectRoot(): string;
/**
 * Get base profiles directory path
 */
export declare function getProfilesBasePath(): string;
/**
 * Get profile directory path for a specific profile
 */
export declare function getProfilePath(profileName: string): string;
/**
 * Get profile config file path
 */
export declare function getProfileConfigFilePath(profileName: string): string;
/**
 * Get chromium directory path
 */
export declare function getChromiumBasePath(): string;
/**
 * Get Chrome binary path based on platform
 */
export declare function getChromeBinaryPath(): string;
/**
 * Get ChromeDriver path based on platform
 */
export declare function getChromeDriverPath(): string;
/**
 * Path configuration interface
 */
export interface PathConfig {
    projectRoot: string;
    profilesBase: string;
    chromiumBase: string;
    chromeBinary: string;
    chromeDriver: string;
}
/**
 * Get all path configurations
 */
export declare function getPathConfig(): PathConfig;
