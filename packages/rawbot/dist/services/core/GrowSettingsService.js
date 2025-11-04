"use strict";
// packages/rawbot/src/services/core/GrowSettingsService.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowSettingsService = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Service for fetching grow settings from API
 */
class GrowSettingsService {
    constructor() {
        this.baseUrl = process.env.WEB_API_URL || 'https://rawops.net/api';
        this.apiKey = process.env.API_KEY || null;
    }
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        return headers;
    }
    /**
     * Get grow settings for a profile
     * API: GET /api/user/grow-settings?profileId=xxx
     */
    async getGrowSettings(profileId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/user/grow-settings`, {
                params: { profileId },
                headers: this.getHeaders()
            });
            return {
                success: true,
                settings: response.data
            };
        }
        catch (error) {
            console.error('[GrowSettingsService] Error fetching grow settings:', error);
            if (error.response) {
                return {
                    success: false,
                    error: `API error: ${error.response.status} ${JSON.stringify(error.response.data)}`
                };
            }
            return {
                success: false,
                error: error.message || 'Unknown error'
            };
        }
    }
    /**
     * Update grow settings with new discovered links
     * API: POST /api/user/grow-settings
     * - Removes processed links (from cache)
     * - Keeps unprocessed links
     * - Adds discovered links (avoid duplicates)
     * Retries up to 10 times until success
     */
    async addDiscoveredLinks(profileId, discoveredLinks, existingSettings, processedLinks = [], cacheDir, maxRetries = 10) {
        const existingLinks = existingSettings.links || [];
        // Step 1: Filter out processed links from existing links
        let unprocessedLinks = [];
        if (cacheDir) {
            // Use filterProcessedLinks to get truly unprocessed links from cache
            try {
                const { filterProcessedLinks } = await Promise.resolve().then(() => __importStar(require('../../yap/comment/utils')));
                unprocessedLinks = await filterProcessedLinks(cacheDir, existingLinks);
                console.log(`[GrowSettingsService] Filtered ${unprocessedLinks.length} unprocessed links from ${existingLinks.length} total (cache-based)`);
            }
            catch (error) {
                console.warn(`[GrowSettingsService] Could not filter from cache, using processedLinks filter:`, error);
                // Fallback: filter out processedLinks manually
                unprocessedLinks = existingLinks.filter(link => !processedLinks.includes(link));
                console.log(`[GrowSettingsService] Filtered ${unprocessedLinks.length} unprocessed links from ${existingLinks.length} total (manual filter)`);
            }
        }
        else {
            // No cacheDir provided, filter out processedLinks manually
            unprocessedLinks = existingLinks.filter(link => !processedLinks.includes(link));
            console.log(`[GrowSettingsService] Filtered ${unprocessedLinks.length} unprocessed links from ${existingLinks.length} total (no cache, manual filter)`);
        }
        // Step 2: Create new links array: unprocessed + discovered (avoid duplicates)
        const newLinksSet = new Set();
        // Add all unprocessed links
        unprocessedLinks.forEach(link => newLinksSet.add(link));
        // Add discovered links that don't already exist
        discoveredLinks.forEach(link => {
            if (!newLinksSet.has(link)) {
                newLinksSet.add(link);
            }
        });
        const newLinks = Array.from(newLinksSet);
        console.log(`[GrowSettingsService] Link update summary:`);
        console.log(`  - Original links: ${existingLinks.length}`);
        console.log(`  - Processed links removed: ${existingLinks.length - unprocessedLinks.length}`);
        console.log(`  - Unprocessed links kept: ${unprocessedLinks.length}`);
        console.log(`  - Discovered links added: ${discoveredLinks.length}`);
        console.log(`  - Final links: ${newLinks.length}`);
        // Update settings with cleaned and merged links
        const updatedSettings = {
            ...existingSettings,
            links: newLinks
        };
        let lastError = null;
        // Retry up to maxRetries times
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Save updated settings via API
                const response = await axios_1.default.post(`${this.baseUrl}/user/grow-settings`, {
                    profileId,
                    settings: updatedSettings
                }, {
                    headers: this.getHeaders(),
                    timeout: 15000,
                    validateStatus: (status) => status < 500
                });
                // Check if response is successful
                if (response.status >= 200 && response.status < 300) {
                    console.log(`[GrowSettingsService] ✅ Successfully added ${discoveredLinks.length} discovered profiles to grow settings (attempt ${attempt})`);
                    console.log(`[GrowSettingsService] Total links now: ${newLinks.length} (was ${existingLinks.length})`);
                    return {
                        success: true,
                        settings: response.data.settings || updatedSettings
                    };
                }
                // If 4xx error, don't retry (client error)
                if (response.status >= 400 && response.status < 500) {
                    console.error(`[GrowSettingsService] Client error (${response.status}): ${JSON.stringify(response.data)}`);
                    return {
                        success: false,
                        error: `API error: ${response.status} ${JSON.stringify(response.data)}`
                    };
                }
                // For 5xx errors, continue to retry
                lastError = new Error(`API returned status ${response.status}`);
            }
            catch (error) {
                lastError = error;
                const isNetworkError = error.code === 'ECONNRESET' ||
                    error.code === 'ECONNREFUSED' ||
                    error.code === 'ENOTFOUND' ||
                    error.code === 'ETIMEDOUT' ||
                    error.message?.includes('socket hang up') ||
                    error.message?.includes('ECONNRESET') ||
                    error.message?.includes('timeout');
                // If network error and not last attempt, retry
                if (isNetworkError && attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff: 1s, 2s, 4s, 5s, 5s...
                    console.log(`[GrowSettingsService] Retry ${attempt}/${maxRetries} for addDiscoveredLinks after ${delay}ms (${error.code || error.message})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                // If not network error or last attempt, break
                if (!isNetworkError || attempt >= maxRetries) {
                    break;
                }
            }
        }
        // All retries failed
        console.error(`[GrowSettingsService] ❌ Failed to add discovered links after ${maxRetries} attempts:`, lastError?.message || lastError);
        if (lastError?.response) {
            return {
                success: false,
                error: `API error: ${lastError.response.status} ${JSON.stringify(lastError.response.data)}`
            };
        }
        return {
            success: false,
            error: lastError?.message || 'Unknown error'
        };
    }
}
exports.GrowSettingsService = GrowSettingsService;
// Create a singleton instance
const growSettingsService = new GrowSettingsService();
exports.default = growSettingsService;
