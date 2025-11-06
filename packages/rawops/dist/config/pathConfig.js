"use strict";
/**
 * Path Configuration
 * Centralized configuration for all folder structures and paths used in the application
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectRoot = getProjectRoot;
exports.getProfilesBasePath = getProfilesBasePath;
exports.getProfilePath = getProfilePath;
exports.getProfileConfigFilePath = getProfileConfigFilePath;
exports.getChromiumBasePath = getChromiumBasePath;
exports.getChromeBinaryPath = getChromeBinaryPath;
exports.getChromeDriverPath = getChromeDriverPath;
exports.getPathConfig = getPathConfig;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Get project root directory
 * Project root is 4 levels up from this file (packages/rawops/src/config)
 */
function getProjectRoot() {
    return path.join(__dirname, '..', '..', '..', '..');
}
/**
 * Get base profiles directory path
 */
function getProfilesBasePath() {
    const projectRoot = getProjectRoot();
    return path.join(projectRoot, 'profiles');
}
/**
 * Get profile directory path for a specific profile
 */
function getProfilePath(profileName) {
    const baseProfilePath = getProfilesBasePath();
    return path.join(baseProfilePath, profileName);
}
/**
 * Get profile config file path
 */
function getProfileConfigFilePath(profileName) {
    const profilePath = getProfilePath(profileName);
    return path.join(profilePath, 'profile-config.json');
}
/**
 * Get chromium directory path
 */
function getChromiumBasePath() {
    const projectRoot = getProjectRoot();
    return path.join(projectRoot, 'chromium');
}
/**
 * Get Chrome binary path based on platform
 */
function getChromeBinaryPath() {
    const projectRoot = getProjectRoot();
    const chromiumPath = getChromiumBasePath();
    switch (process.platform) {
        case 'darwin': // macOS
            // Check common Chrome locations on Mac
            const macPaths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                path.join(chromiumPath, 'chrome'),
                path.join(os.homedir(), '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
            ];
            for (const chromePath of macPaths) {
                try {
                    const fs = require('fs');
                    if (fs.existsSync(chromePath)) {
                        return chromePath;
                    }
                }
                catch (error) {
                    // Continue to next path
                }
            }
            throw new Error('Chrome browser not found. Please install Google Chrome.');
        case 'win32': // Windows
            return path.join(chromiumPath, 'chrome.exe');
        default: // Linux and others
            return path.join(chromiumPath, 'chrome');
    }
}
/**
 * Get ChromeDriver path based on platform
 */
function getChromeDriverPath() {
    const chromiumPath = getChromiumBasePath();
    const isWindows = process.platform === 'win32';
    return isWindows
        ? path.join(chromiumPath, 'chromedriver.exe')
        : path.join(chromiumPath, 'chromedriver');
}
/**
 * Get all path configurations
 */
function getPathConfig() {
    return {
        projectRoot: getProjectRoot(),
        profilesBase: getProfilesBasePath(),
        chromiumBase: getChromiumBasePath(),
        chromeBinary: getChromeBinaryPath(),
        chromeDriver: getChromeDriverPath()
    };
}
