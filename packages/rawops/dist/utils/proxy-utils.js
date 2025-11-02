"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseProxyString = parseProxyString;
exports.validateProxyConfig = validateProxyConfig;
exports.formatProxyUrl = formatProxyUrl;
exports.createProxyFromEnv = createProxyFromEnv;
/**
 * Parse proxy string into ProxyConfig object
 * Supports formats:
 * - ip:port
 * - ip:port:user:pass
 */
function parseProxyString(proxyString) {
    if (!proxyString || typeof proxyString !== 'string') {
        return null;
    }
    const parts = proxyString.split(':');
    if (parts.length === 2) {
        // Format: ip:port
        return {
            host: parts[0],
            port: parseInt(parts[1]),
            username: undefined,
            password: undefined
        };
    }
    else if (parts.length === 4) {
        // Format: ip:port:user:pass
        return {
            host: parts[0],
            port: parseInt(parts[1]),
            username: parts[2],
            password: parts[3]
        };
    }
    return null;
}
/**
 * Validate proxy configuration
 */
function validateProxyConfig(proxyConfig) {
    return !!(proxyConfig.host && proxyConfig.port && proxyConfig.port > 0 && proxyConfig.port < 65536);
}
/**
 * Format proxy URL for Chrome arguments
 */
function formatProxyUrl(proxyConfig) {
    const scheme = proxyConfig.scheme || 'http';
    return `${scheme}://${proxyConfig.host}:${proxyConfig.port}`;
}
/**
 * Create proxy configuration from environment variables
 */
function createProxyFromEnv() {
    const proxyHost = process.env.PROXY_HOST;
    const proxyPort = process.env.PROXY_PORT;
    const proxyUser = process.env.PROXY_USER;
    const proxyPass = process.env.PROXY_PASS;
    const proxyScheme = process.env.PROXY_SCHEME || 'http';
    if (!proxyHost || !proxyPort) {
        return null;
    }
    return {
        host: proxyHost,
        port: parseInt(proxyPort),
        scheme: proxyScheme,
        username: proxyUser,
        password: proxyPass
    };
}
