import { XClient } from '../client/XClient';
import { ProxyConfig } from '@rawops/rawops';
export interface YapProfile {
    handle: string;
    id?: string;
    status?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface YapInitConfig {
    profile: YapProfile;
    proxyConfig?: ProxyConfig;
    mode?: 'auto' | 'runProfile';
}
export declare class YapInitManager {
    private static instance;
    private xClient;
    private isInitialized;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): YapInitManager;
    /**
     * Initialize YAP system with profile and proxy
     */
    initialize(config: YapInitConfig): Promise<XClient>;
    /**
     * Get initialized XClient
     */
    getXClient(): XClient;
    /**
     * Check if system is initialized
     */
    isReady(): boolean;
    /**
     * Close YAP system
     */
    close(): Promise<void>;
    /**
     * Reset instance (for testing)
     */
    static reset(): void;
}
