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
        this.profileHandle = null;
        // No initialization needed here
    }
    /**
     * Initialize the client with profile and proxy configuration
     */
    async initialize(profileHandle, proxyConfig, mode) {
        try {
            console.log(`[XClient] Initializing with profile: ${profileHandle}, mode: ${mode}`);
            // Store profile handle for later use
            this.profileHandle = profileHandle;
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
                // Always try to save window size and position before quitting
                // Pass profileHandle to ensure it can be saved even if extraction fails
                await (0, rawops_1.quitDriver)(this.driver, this.profileHandle || undefined);
                console.log("[XClient] Browser closed and window size/position saved");
            }
            this.driver = null;
            this.isInitialized = false;
            this.profileHandle = null;
        }
        catch (error) {
            console.error("[XClient] Error closing client:", error);
            // Even if there's an error, try to save window size/position if driver still exists
            if (this.driver) {
                try {
                    // saveWindowSize now saves both size and position
                    await (0, rawops_1.saveWindowSize)(this.driver, this.profileHandle || undefined);
                    console.log("[XClient] Window size/position saved after error");
                }
                catch (saveError) {
                    console.error("[XClient] Failed to save window size/position:", saveError);
                }
                // Try to quit driver even if save failed
                try {
                    await this.driver.quit();
                }
                catch (quitError) {
                    console.error("[XClient] Failed to quit driver:", quitError);
                }
            }
            this.driver = null;
            this.isInitialized = false;
            this.profileHandle = null;
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
