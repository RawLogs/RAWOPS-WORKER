"use strict";
// packages/rawbot/src/yap/grow/handlers/navigation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleOpen = handleOpen;
exports.handleScrollToElement = handleScrollToElement;
/**
 * Handle open action - navigate to URL
 * Supports 2 modes:
 * - Mode 1 (default): Navigate to URL directly without parsing (parse_url: false or undefined)
 * - Mode 2: Parse URL and navigate to profile, extract statusId (parse_url: true)
 */
async function handleOpen(params, handlerContext) {
    const { drivers, context, resolveVariable } = handlerContext;
    if (!drivers)
        return;
    const url = params.url;
    if (!url)
        throw new Error('URL not provided');
    // Check if parse_url mode is enabled (default: false = use URL as-is)
    const parseUrl = params.parse_url === true || params.parseUrl === true;
    if (parseUrl) {
        // Mode 2: Parse URL and navigate to profile (current functionality)
        const result = await drivers.grow.navigateWithContext(url, resolveVariable);
        if (result.success && result.parsed) {
            // Update context with parsed URL data
            context.target_status_id = result.parsed.statusId;
            context.current_link = result.parsed.profileUrl;
            console.log(`[YapGrow] Opening profile URL (parsed): ${result.parsed.profileUrl}${result.parsed.statusId ? ` (Status ID: ${result.parsed.statusId})` : ''}`);
        }
        else {
            console.error('[YapGrow] Error navigating (parsed):', result.error);
        }
    }
    else {
        // Mode 1: Navigate directly to URL (default)
        const result = await drivers.grow.navigateToUrl(url, resolveVariable);
        if (result.success) {
            // Update context with original URL
            context.current_link = url;
            context.target_status_id = null; // No parsing, so no statusId
            console.log(`[YapGrow] Opening URL (direct): ${url}`);
        }
        else {
            console.error('[YapGrow] Error navigating (direct):', result.error);
        }
    }
}
/**
 * Handle scroll to element action
 */
async function handleScrollToElement(params, handlerContext) {
    const { drivers } = handlerContext;
    if (!drivers)
        return;
    const selector = params.selector;
    if (!selector)
        return;
    const by = params.by || 'css'; // 'css' or 'xpath'
    await drivers.grow.scrollToElement(selector, by);
}
