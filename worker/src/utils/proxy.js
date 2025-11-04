"use strict";
// utils/proxy.ts - Proxy configuration utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseProxyString = parseProxyString;
/**
 * Helper function to parse proxy string
 */
function parseProxyString(proxyString) {
    try {
        // Format: ip:port:user:pass or ip:port
        const parts = proxyString.split(':');
        if (parts.length < 2)
            return null;
        const config = {
            host: parts[0],
            port: parseInt(parts[1]),
            scheme: 'http'
        };
        if (parts.length >= 4) {
            config.username = parts[2];
            config.password = parts[3];
        }
        return config;
    }
    catch (error) {
        console.error('Error parsing proxy string:', error);
        return null;
    }
}
