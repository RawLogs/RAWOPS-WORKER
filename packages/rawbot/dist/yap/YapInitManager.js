"use strict";
// packages/rawbot/src/yap/YapInitManager.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.YapInitManager = void 0;
const XClient_1 = require("../client/XClient");
class YapInitManager {
    constructor() {
        this.xClient = null;
        this.isInitialized = false;
        // Singleton pattern
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!YapInitManager.instance) {
            YapInitManager.instance = new YapInitManager();
        }
        return YapInitManager.instance;
    }
    /**
     * Initialize YAP system with profile and proxy
     */
    async initialize(config) {
        try {
            if (this.isInitialized && this.xClient) {
                console.log('[YapInitManager] Already initialized, returning existing client');
                return this.xClient;
            }
            console.log(`[YapInitManager] Initializing YAP system with profile: ${config.profile.handle}`);
            this.xClient = new XClient_1.XClient();
            await this.xClient.initialize(config.profile.handle, config.proxyConfig || null, config.mode || 'runProfile');
            // Only mark initialized when automation (WebDriver) is actually available
            this.isInitialized = this.xClient.getDriver() !== null;
            console.log('[YapInitManager] YAP system initialized successfully');
            return this.xClient;
        }
        catch (error) {
            console.error('[YapInitManager] Initialization failed:', error);
            throw error;
        }
    }
    /**
     * Get initialized XClient
     */
    getXClient() {
        if (!this.isInitialized || !this.xClient) {
            throw new Error('YAP system not initialized. Call initialize() first.');
        }
        return this.xClient;
    }
    /**
     * Check if system is initialized
     */
    isReady() {
        return this.isInitialized && this.xClient !== null;
    }
    /**
     * Close YAP system
     */
    async close() {
        try {
            if (this.xClient) {
                await this.xClient.close();
                this.xClient = null;
            }
            this.isInitialized = false;
            console.log('[YapInitManager] YAP system closed');
        }
        catch (error) {
            console.error('[YapInitManager] Error closing YAP system:', error);
        }
    }
    /**
     * Reset instance (for testing)
     */
    static reset() {
        YapInitManager.instance = new YapInitManager();
    }
}
exports.YapInitManager = YapInitManager;
