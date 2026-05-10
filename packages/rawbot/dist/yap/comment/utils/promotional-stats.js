"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementPromotionalSuccessViaAPI = incrementPromotionalSuccessViaAPI;
/**
 * Report a successful CBL comment that used the promotional URL list (shill) to the web API.
 * Same auth pattern as cache.ts (WEB_API_URL + Bearer API_KEY).
 */
function getApiBaseUrl() {
    const baseUrl = process.env.WEB_API_URL;
    if (!baseUrl) {
        throw new Error('WEB_API_URL environment variable is required');
    }
    return baseUrl.replace(/\/$/, '');
}
async function incrementPromotionalSuccessViaAPI(profileId) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.log('[YapComment] Skipping promotional stats: API_KEY not set');
        return;
    }
    try {
        const baseUrl = getApiBaseUrl();
        console.log(`[YapComment] Promotional stats: POST increment profileId=${profileId} …`);
        const res = await fetch(`${baseUrl}/user/comment-promotional-stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({ profileId, action: 'increment' }),
            signal: AbortSignal.timeout(12000)
        });
        if (res.ok) {
            console.log(`[YapComment] Promotional stats increment OK profileId=${profileId}`);
        }
        else {
            const text = await res.text().catch(() => '');
            console.log(`[YapComment] Promotional stats increment HTTP ${res.status}: ${text.slice(0, 200)}`);
        }
    }
    catch (e) {
        console.log('[YapComment] Promotional stats increment failed (non-fatal):', e);
    }
}
