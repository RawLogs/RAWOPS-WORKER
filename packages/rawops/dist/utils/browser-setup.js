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
exports.getChromeBinaryPath = void 0;
exports.quitDriver = quitDriver;
exports.saveWindowSizeAndPosition = saveWindowSizeAndPosition;
exports.saveWindowSize = saveWindowSize;
exports.cleanupProxyServers = cleanupProxyServers;
exports.setupBrowser = setupBrowser;
const selenium_webdriver_1 = require("selenium-webdriver");
const chrome_1 = __importDefault(require("selenium-webdriver/chrome"));
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const ProxyChain = require('proxy-chain');
const net = __importStar(require("net"));
const pathConfig_1 = require("../config/pathConfig");
Object.defineProperty(exports, "getChromeBinaryPath", { enumerable: true, get: function () { return pathConfig_1.getChromeBinaryPath; } });
// Logging function
function log(profile, message, color = chalk_1.default.white) {
    const timestamp = new Date().toISOString();
    console.log(color(`[${timestamp}] [Profile: "${profile}"] - ${message}`));
}
// Store active proxy servers for cleanup
const activeProxyServers = new Set();
/**
 * Get profile config file path (for backward compatibility)
 */
function getProfileConfigPath(profilePath) {
    return path.join(profilePath, 'profile-config.json');
}
/**
 * Load profile config from file
 */
function loadProfileConfig(profilePath) {
    const configPath = getProfileConfigPath(profilePath);
    if (!fs.existsSync(configPath)) {
        return null;
    }
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configContent);
    }
    catch (error) {
        log(path.basename(profilePath), `Failed to load profile config: ${error}`, chalk_1.default.yellow);
        return null;
    }
}
/**
 * Load window size from profile config
 */
function loadWindowSize(profilePath) {
    const config = loadProfileConfig(profilePath);
    if (config && config.windowSize && config.windowSize.width && config.windowSize.height) {
        return {
            width: config.windowSize.width,
            height: config.windowSize.height
        };
    }
    return null;
}
/**
 * Load window position from profile config
 */
function loadWindowPosition(profilePath) {
    const config = loadProfileConfig(profilePath);
    if (config && config.windowPosition && typeof config.windowPosition.x === 'number' && typeof config.windowPosition.y === 'number') {
        return {
            x: config.windowPosition.x,
            y: config.windowPosition.y
        };
    }
    return null;
}
/**
 * Get profile name from driver's user-data-dir
 */
async function getProfileFromDriver(driver) {
    try {
        const capabilities = await driver.getCapabilities();
        const chromeOptions = capabilities.get('goog:chromeOptions');
        if (chromeOptions && chromeOptions.args) {
            const args = chromeOptions.args;
            const userDataDirArg = args.find(arg => arg.startsWith('--user-data-dir='));
            if (userDataDirArg) {
                const userDataDir = userDataDirArg.split('=')[1];
                const baseProfilePath = (0, pathConfig_1.getProfilesBasePath)();
                // Extract profile name from path
                if (userDataDir.startsWith(baseProfilePath)) {
                    const relativePath = path.relative(baseProfilePath, userDataDir);
                    const profileName = relativePath.split(path.sep)[0];
                    return profileName || null;
                }
            }
        }
    }
    catch (error) {
        // Silently fail - profile name extraction is optional
    }
    return null;
}
/**
 * Quit driver and save window size and position before closing
 * This ensures the final window size and position are always saved to profile config
 */
async function quitDriver(driver, profile) {
    try {
        // Save window size and position before quitting
        await saveWindowSizeAndPosition(driver, profile);
    }
    catch (error) {
        const profileName = profile || 'unknown';
        log(profileName, `Failed to save window size/position before quit: ${error}`, chalk_1.default.yellow);
        // Continue with quit even if save fails
    }
    // Quit the driver
    await driver.quit();
}
/**
 * Save window size and position to profile config
 * If profile is not provided, it will try to extract it from the driver
 */
async function saveWindowSizeAndPosition(driver, profile) {
    try {
        // Get profile name if not provided
        let profileName = profile;
        if (!profileName) {
            profileName = await getProfileFromDriver(driver);
            if (!profileName) {
                log('unknown', 'Could not determine profile name, skipping window size/position save', chalk_1.default.yellow);
                return;
            }
        }
        const configPath = (0, pathConfig_1.getProfileConfigFilePath)(profileName);
        const profilePath = (0, pathConfig_1.getProfilePath)(profileName);
        // Ensure profile directory exists
        if (!fs.existsSync(profilePath)) {
            fs.mkdirSync(profilePath, { recursive: true });
            log(profileName, `Created profile directory: ${profilePath}`);
        }
        // Get current window size and position from driver
        const window = driver.manage().window();
        const rect = await window.getRect();
        // Load existing config or create new one
        let config = {};
        if (fs.existsSync(configPath)) {
            try {
                const configContent = fs.readFileSync(configPath, 'utf8');
                config = JSON.parse(configContent);
            }
            catch (error) {
                log(profileName, `Failed to read existing config, creating new one: ${error}`, chalk_1.default.yellow);
            }
        }
        // Update window size and position
        config.windowSize = {
            width: rect.width,
            height: rect.height
        };
        config.windowPosition = {
            x: rect.x,
            y: rect.y
        };
        // Save config
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        log(profileName, `Saved window size: ${rect.width}x${rect.height}, position: ${rect.x},${rect.y}`, chalk_1.default.green);
    }
    catch (error) {
        const profileName = profile || 'unknown';
        log(profileName, `Failed to save window size/position: ${error}`, chalk_1.default.red);
    }
}
/**
 * Save window size to profile config (backward compatibility)
 * If profile is not provided, it will try to extract it from the driver
 */
async function saveWindowSize(driver, profile) {
    await saveWindowSizeAndPosition(driver, profile);
}
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
/**
 * Setup browser with profile and proxy configuration
 */
async function setupBrowser(profile, proxyConfig, mode = 'selenium') {
    // Get profile path using path config
    const profilePath = (0, pathConfig_1.getProfilePath)(profile);
    log(profile, "Setting up browser...");
    if (!fs.existsSync(profilePath)) {
        fs.mkdirSync(profilePath, { recursive: true });
        log(profile, `Created profile directory: ${profilePath}`);
    }
    if (mode === 'runProfile') {
        // Load saved window size or use HD default (1920x1080)
        const savedSize = loadWindowSize(profilePath);
        let windowWidth = savedSize?.width || 1920;
        let windowHeight = savedSize?.height || 1080;
        if (savedSize) {
            log(profile, `Loaded saved window size: ${windowWidth}x${windowHeight}`, chalk_1.default.green);
        }
        else {
            log(profile, `Using default HD window size: ${windowWidth}x${windowHeight}`, chalk_1.default.cyan);
        }
        const args = [
            `--user-data-dir=${profilePath}`,
            '--no-first-run',
            '--no-default-browser-check',
            '--lang=en-US',
            '--start-maximized',
            `--window-size=${windowWidth},${windowHeight}`,
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
        const chromePath = (0, pathConfig_1.getChromeBinaryPath)();
        const { spawn } = require('child_process');
        spawn(chromePath, args, { stdio: 'ignore', detached: true }).unref();
        log(profile, "Launched Chrome (manual login mode)");
        return null;
    }
    // Load saved window size or use HD default (1920x1080)
    const savedSize = loadWindowSize(profilePath);
    let windowWidth = savedSize?.width || 1920;
    let windowHeight = savedSize?.height || 1080;
    if (savedSize) {
        log(profile, `Loaded saved window size: ${windowWidth}x${windowHeight}`, chalk_1.default.green);
    }
    else {
        log(profile, `Using default HD window size: ${windowWidth}x${windowHeight}`, chalk_1.default.cyan);
    }
    // Load saved window position
    const savedPosition = loadWindowPosition(profilePath);
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
    // Get Chrome and ChromeDriver paths using path config
    const chromedriverPath = (0, pathConfig_1.getChromeDriverPath)();
    const chromeBinaryPath = (0, pathConfig_1.getChromeBinaryPath)();
    options.setChromeBinaryPath(chromeBinaryPath);
    const driver = await new selenium_webdriver_1.Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .setChromeService(new chrome_1.default.ServiceBuilder(chromedriverPath))
        .build();
    // Ensure window size and position are set correctly and save to profile config
    try {
        const window = driver.manage().window();
        // Set window size and position using setRect
        if (savedPosition) {
            await window.setRect({
                width: windowWidth,
                height: windowHeight,
                x: savedPosition.x,
                y: savedPosition.y
            });
            log(profile, `Restored window size: ${windowWidth}x${windowHeight}, position: ${savedPosition.x},${savedPosition.y}`, chalk_1.default.green);
        }
        else {
            await window.setRect({
                width: windowWidth,
                height: windowHeight,
                x: 0,
                y: 0
            });
        }
        // Save initial window size and position
        await saveWindowSizeAndPosition(driver, profile);
    }
    catch (error) {
        log(profile, `Failed to set/save window size/position: ${error}`, chalk_1.default.yellow);
    }
    log(profile, "Browser setup completed successfully.");
    return driver;
}
