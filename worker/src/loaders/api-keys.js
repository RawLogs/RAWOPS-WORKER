"use strict";
// loaders/api-keys.ts - API key loading and caching
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeminiApiKey = getGeminiApiKey;
// Cache for user API keys to avoid repeated API calls
const userApiKeyCache = new Map();
/**
 * Get and cache Gemini API key for a user
 */
async function getGeminiApiKey(userId, apiService) {
    try {
        // Check cache first
        if (userApiKeyCache.has(userId)) {
            console.log(`[Worker] Using cached Gemini API key for user: ${userId}`);
            return userApiKeyCache.get(userId);
        }
        console.log(`[Worker] Fetching Gemini API key for user: ${userId}`);
        const apiKeyData = await apiService.getUserApiKey(userId);
        // Handle different response formats
        let geminiApiKey = null;
        if (apiKeyData) {
            if (typeof apiKeyData === 'string') {
                // Response is directly the API key string
                geminiApiKey = apiKeyData;
            }
            else if (typeof apiKeyData === 'object' && 'geminiApiKey' in apiKeyData) {
                // Response is an object with geminiApiKey property
                geminiApiKey = apiKeyData.geminiApiKey;
            }
        }
        if (geminiApiKey) {
            // Cache the API key
            userApiKeyCache.set(userId, geminiApiKey);
            console.log(`[Worker] Gemini API key cached for user: ${userId}`);
            return geminiApiKey;
        }
        console.log(`[Worker] No Gemini API key found for user: ${userId}`);
        return null;
    }
    catch (error) {
        // If API call failed after retries, rethrow to prevent worker from running
        console.error('[Worker] ❌ Error fetching Gemini API key after retries:', error);
        throw error;
    }
}
