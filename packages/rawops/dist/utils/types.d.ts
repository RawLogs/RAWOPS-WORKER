export interface ProxyConfig {
    host: string;
    port: number;
    scheme?: string;
    username?: string;
    password?: string;
}
export interface InteractionResult {
    success: boolean;
    error?: string;
    data?: any;
}
export interface WaitOptions {
    timeout?: number;
    waitForNetworkIdle?: boolean;
    waitForElement?: string;
}
//# sourceMappingURL=types.d.ts.map