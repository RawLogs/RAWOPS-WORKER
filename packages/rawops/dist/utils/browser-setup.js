"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupProxyServers = cleanupProxyServers;
exports.getChromeBinaryPath = getChromeBinaryPath;
exports.setupBrowser = setupBrowser;
const selenium_webdriver_1 = require("selenium-webdriver");
const chrome_1 = __importDefault(require("selenium-webdriver/chrome"));
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const ProxyChain = require('proxy-chain');
const net = __importStar(require("net"));
// Logging function
function log(profile, message, color = chalk_1.default.white) {
    const timestamp = new Date().toISOString();
    console.log(color(`[${timestamp}] [Profile: "${profile}"] - ${message}`));
}
// Store active proxy servers for cleanup
const activeProxyServers = new Set();
/**
 * Test proxy connection
 */
async function testProxyConnection(proxyConfig, profile) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const timeout = 5000;
        socket.setTimeout(timeout);
        socket.on('connect', () => {
            log(profile, `Proxy connection test successful: ${proxyConfig.host}:${proxyConfig.port}`, chalk_1.default.green);
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            log(profile, `Proxy connection test timeout: ${proxyConfig.host}:${proxyConfig.port}`, chalk_1.default.red);
            socket.destroy();
            resolve(false);
        });
        socket.on('error', (error) => {
            log(profile, `Proxy connection test failed: ${proxyConfig.host}:${proxyConfig.port} - ${error.message}`, chalk_1.default.red);
            socket.destroy();
            resolve(false);
        });
        socket.connect(proxyConfig.port, proxyConfig.host);
    });
}
/**
 * Cleanup all active proxy servers
 */
async function cleanupProxyServers() {
    for (const server of activeProxyServers) {
        try {
            await ProxyChain.closeAnonymizedProxy(server, true);
        }
        catch (error) {
            console.error('Error closing proxy server:', error);
        }
    }
    activeProxyServers.clear();
}
// Handle process termination
process.on('SIGINT', async () => {
    await cleanupProxyServers();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await cleanupProxyServers();
    process.exit(0);
});
/**
 * Create authenticated proxy URL using proxy-chain
 */
async function createAuthenticatedProxy(proxyConfig, profile) {
    try {
        const scheme = proxyConfig.scheme || 'http';
        const originalProxyUrl = `${scheme}://${proxyConfig.host}:${proxyConfig.port}`;
        // If no username/password, return original URL
        if (!proxyConfig.username || !proxyConfig.password) {
            log(profile, `Using proxy without authentication: ${originalProxyUrl}`);
            return originalProxyUrl;
        }
        // Create authenticated proxy URL
        const authenticatedProxyUrl = `${scheme}://${proxyConfig.username}:${proxyConfig.password}@${proxyConfig.host}:${proxyConfig.port}`;
        log(profile, `Creating proxy chain for: ${scheme}://${proxyConfig.host}:${proxyConfig.port}`);
        // Start proxy-chain server with timeout
        const proxyServer = await Promise.race([
            ProxyChain.anonymizeProxy(authenticatedProxyUrl),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Proxy chain timeout')), 10000))
        ]);
        // Store the server for cleanup
        activeProxyServers.add(proxyServer);
        log(profile, `Created authenticated proxy chain: ${originalProxyUrl} -> ${proxyServer}`);
        return proxyServer;
    }
    catch (error) {
        log(profile, `Failed to create authenticated proxy: ${error}`, chalk_1.default.red);
        // Try fallback without authentication
        try {
            const scheme = proxyConfig.scheme || 'http';
            const fallbackUrl = `${scheme}://${proxyConfig.host}:${proxyConfig.port}`;
            log(profile, `Trying fallback proxy without authentication: ${fallbackUrl}`, chalk_1.default.yellow);
            return fallbackUrl;
        }
        catch (fallbackError) {
            log(profile, `Fallback also failed: ${fallbackError}`, chalk_1.default.red);
            throw new Error(`Proxy setup failed: ${error}`);
        }
    }
}
/*
 * Get Chrome binary path
 */
function getChromeBinaryPath() {
    // Chrome is located outside the project root
    const projectRoot = path.join(__dirname, '..', '..', '..', '..');
    return process.platform === 'win32'
        ? path.join(projectRoot, 'chromium', 'chrome.exe')
        : path.join(projectRoot, 'chromium', 'chrome');
}
/**
 * Setup browser with profile and proxy configuration
 */
async function setupBrowser(profile, proxyConfig, mode = 'selenium') {
    // Profiles are located outside the project root
    const projectRoot = path.join(__dirname, '..', '..', '..', '..');
    const baseProfilePath = path.join(projectRoot, 'profiles');
    const profilePath = path.join(baseProfilePath, profile);
    log(profile, "Setting up browser...");
    if (!fs.existsSync(profilePath)) {
        fs.mkdirSync(profilePath, { recursive: true });
        log(profile, `Created profile directory: ${profilePath}`);
    }
    if (mode === 'runProfile') {
        const args = [
            `--user-data-dir=${profilePath}`,
            '--no-first-run',
            '--no-default-browser-check',
            '--lang=en-US',
            '--start-maximized',
            '--window-size=1280,900',
            'https://x.com/'
        ];
        if (proxyConfig && proxyConfig.host && proxyConfig.port) {
            // Test proxy connection first
            const isProxyReachable = await testProxyConnection(proxyConfig, profile);
            if (!isProxyReachable) {
                log(profile, `Proxy ${proxyConfig.host}:${proxyConfig.port} is not reachable, skipping proxy configuration`, chalk_1.default.yellow);
            }
            else {
                // Always use proxy-chain for better compatibility
                const proxyUrl = await createAuthenticatedProxy(proxyConfig, profile);
                args.push(`--proxy-server=${proxyUrl}`);
                args.push('--proxy-bypass-list=<-loopback>');
            }
        }
        const chromePath = getChromeBinaryPath();
        const { spawn } = require('child_process');
        spawn(chromePath, args, { stdio: 'ignore', detached: true }).unref();
        log(profile, "Launched Chrome (manual login mode)");
        return null;
    }
    const windowWidth = 650;
    const windowHeight = 900;
    const options = new chrome_1.default.Options();
    if (proxyConfig && proxyConfig.host && proxyConfig.port) {
        // Test proxy connection first
        const isProxyReachable = await testProxyConnection(proxyConfig, profile);
        if (!isProxyReachable) {
            log(profile, `Proxy ${proxyConfig.host}:${proxyConfig.port} is not reachable, skipping proxy configuration`, chalk_1.default.yellow);
        }
        else {
            // Always use proxy-chain for better compatibility
            const proxyUrl = await createAuthenticatedProxy(proxyConfig, profile);
            options.addArguments(`--proxy-server=${proxyUrl}`);
            options.addArguments('--proxy-bypass-list=<-loopback>');
            log(profile, `Chrome proxy configured: ${proxyUrl}`);
        }
    }
    options.addArguments(`--user-data-dir=${profilePath}`, '--disable-blink-features=AutomationControlled', `--window-size=${windowWidth},${windowHeight}`, '--no-first-run', '--no-default-browser-check', '--disable-component-update', '--disable-sync', '--lang=en-US');
    options.excludeSwitches('enable-automation');
    const isWindows = process.platform === 'win32';
    const chromedriverPath = isWindows
        ? path.join(projectRoot, 'chromium', 'chromedriver.exe')
        : path.join(projectRoot, 'chromium', 'chromedriver');
    const chromeBinaryPath = getChromeBinaryPath();
    options.setChromeBinaryPath(chromeBinaryPath);
    const driver = await new selenium_webdriver_1.Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .setChromeService(new chrome_1.default.ServiceBuilder(chromedriverPath))
        .build();
    log(profile, "Browser setup completed successfully.");
    return driver;
}
//# sourceMappingURL=browser-setup.js.map