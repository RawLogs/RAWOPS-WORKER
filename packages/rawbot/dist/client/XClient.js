"use strict";
// packages/rawbot/src/core/XClient.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.XClient = void 0;
const rawops_1 = require("@rawops/rawops");
// RawTweetData interface is imported from types.ts
// =======================================================================
// X Client Implementation (Optimized)
// =======================================================================
class XClient {
    constructor() {
        this.driver = null;
        this.isInitialized = false;
        // No initialization needed here
    }
    /**
     * Initialize the client with profile and proxy configuration
     */
    async initialize(profileHandle, proxyConfig, mode) {
        try {
            console.log(`[XClient] Initializing with profile: ${profileHandle}, mode: ${mode}`);
            // Setup browser using RawOps directly
            const launchMode = mode === 'runProfile' ? 'runProfile' : 'selenium';
            this.driver = await (0, rawops_1.setupBrowser)(profileHandle, proxyConfig, launchMode);
            // In runProfile mode, a standalone Chrome is launched and no WebDriver is returned
            this.isInitialized = launchMode === 'selenium';
            console.log(`[XClient] Successfully initialized`);
        }
        catch (error) {
            console.error(`[XClient] Initialization failed:`, error);
            throw error;
        }
    }
    /**
     * Get the WebDriver instance
     */
    getDriver() {
        return this.driver;
    }
    /**
     * Get current URL
     */
    async getCurrentUrl() {
        if (!this.isInitialized) {
            throw new Error("Client not initialized");
        }
        return await this.driver.getCurrentUrl();
    }
    /**
     * Navigate to URL
     */
    async navigateTo(url) {
        if (!this.isInitialized) {
            throw new Error("Client not initialized");
        }
        await this.driver.get(url);
    }
    /**
     * Sleep for specified milliseconds
     */
    async sleep(ms) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Take screenshot
     */
    async takeScreenshot() {
        if (!this.isInitialized) {
            throw new Error("Client not initialized");
        }
        return await this.driver.takeScreenshot();
    }
    /**
     * Close the client
     */
    async close() {
        try {
            if (this.driver) {
                await this.driver.quit();
                console.log("[XClient] Browser closed");
            }
            this.driver = null;
            this.isInitialized = false;
        }
        catch (error) {
            console.error("[XClient] Error closing client:", error);
        }
    }
    /**
     * Initialize for run profile mode (legacy compatibility)
     */
    async initializeForRunProfile(profileHandle, proxyConfig) {
        return this.initialize(profileHandle, proxyConfig, 'runProfile');
    }
    /**
     * Initialize for automation mode (legacy compatibility)
     */
    async initializeForAutomation(profileHandle, proxyConfig) {
        return this.initialize(profileHandle, proxyConfig, 'auto');
    }
}
exports.XClient = XClient;
