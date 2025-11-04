export interface GrowSettings {
    links: string[];
    enabled?: boolean;
    [key: string]: any;
}
export interface GrowSettingsResponse {
    success: boolean;
    settings?: GrowSettings;
    error?: string;
}
/**
 * Service for fetching grow settings from API
 */
export declare class GrowSettingsService {
    private baseUrl;
    private apiKey;
    constructor();
    private getHeaders;
    /**
     * Get grow settings for a profile
     * API: GET /api/user/grow-settings?profileId=xxx
     */
    getGrowSettings(profileId: string): Promise<GrowSettingsResponse>;
    /**
     * Update grow settings with new discovered links
     * API: POST /api/user/grow-settings
     * - Removes processed links (from cache)
     * - Keeps unprocessed links
     * - Adds discovered links (avoid duplicates)
     * Retries up to 10 times until success
     */
    addDiscoveredLinks(profileId: string, discoveredLinks: string[], existingSettings: GrowSettings, processedLinks?: string[], cacheDir?: string, maxRetries?: number): Promise<GrowSettingsResponse>;
}
declare const growSettingsService: GrowSettingsService;
export default growSettingsService;
