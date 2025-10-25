"use strict";
/**
 * User-Agent Configuration for 2025
 * Contains the latest and most popular User-Agent strings
 * Updated: January 2025
 *
 * IMPORTANT: This module now provides IP-based geolocation synchronization
 * to ensure User-Agent, Accept-Language, timezone, and geolocation are consistent
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
exports.DEFAULT_USER_AGENT = exports.GEOGRAPHIC_REGIONS = exports.SAFARI_VERSIONS = exports.FIREFOX_VERSIONS = exports.EDGE_VERSIONS = exports.OPERATING_SYSTEMS = exports.WEBKIT_VERSIONS = exports.CHROME_VERSIONS = exports.POPULAR_USER_AGENTS = void 0;
exports.detectIPLocation = detectIPLocation;
exports.generateSynchronizedConfig = generateSynchronizedConfig;
exports.generateUserAgent = generateUserAgent;
exports.getActualScreenResolution = getActualScreenResolution;
const crypto = __importStar(require("crypto"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const https = __importStar(require("https"));
const http = __importStar(require("http"));
// Chrome versions 2025 (most popular)
const CHROME_VERSIONS = [
    '141.0.7390.54'
];
exports.CHROME_VERSIONS = CHROME_VERSIONS;
// WebKit versions (used by Chrome and Safari)
const WEBKIT_VERSIONS = [
    '537.36', '537.37', '537.38', '537.39', '537.40', '537.41'
];
exports.WEBKIT_VERSIONS = WEBKIT_VERSIONS;
// Operating Systems and Architectures
const OPERATING_SYSTEMS = {
    windows: [
        'Windows NT 12.0; Win64; x64', // Windows 12, latest 2025
        'Windows NT 11.0; Win64; x64',
        'Windows NT 10.0; Win64; x64',
    ],
    macos: [
        'Macintosh; Apple M3 Max Mac OS X 15_0_0',
        'Macintosh; Apple M2 Pro Mac OS X 14_5_0',
        'Macintosh; Intel Mac OS X 14_4_0',
        'Macintosh; Intel Mac OS X 13_6_6',
        'Macintosh; Intel Mac OS X 12_7_5'
    ]
};
exports.OPERATING_SYSTEMS = OPERATING_SYSTEMS;
// Geographic regions with their corresponding configurations
const GEOGRAPHIC_REGIONS = {
    'VN': {
        country: 'Vietnam',
        languages: ['en-US', 'en', 'vi-VN', 'vi'],
        timezone: 'Asia/Ho_Chi_Minh',
        locale: 'en-US',
        currency: 'VND',
        osDistribution: { windows: 0.85, macos: 0.15 }, // Windows more popular in VN
        browserDistribution: { chrome: 0.75, edge: 0.15, firefox: 0.08, safari: 0.02 }
    },
    'US': {
        country: 'United States',
        languages: ['en-US', 'en'],
        timezone: 'America/New_York',
        locale: 'en-US',
        currency: 'USD',
        osDistribution: { windows: 0.6, macos: 0.4 },
        browserDistribution: { chrome: 0.65, safari: 0.2, edge: 0.1, firefox: 0.05 }
    },
    'JP': {
        country: 'Japan',
        languages: ['ja-JP', 'ja', 'en-US', 'en'],
        timezone: 'Asia/Tokyo',
        locale: 'ja-JP',
        currency: 'JPY',
        osDistribution: { windows: 0.7, macos: 0.3 },
        browserDistribution: { chrome: 0.6, safari: 0.25, edge: 0.1, firefox: 0.05 }
    },
    'KR': {
        country: 'South Korea',
        languages: ['ko-KR', 'ko', 'en-US', 'en'],
        timezone: 'Asia/Seoul',
        locale: 'ko-KR',
        currency: 'KRW',
        osDistribution: { windows: 0.8, macos: 0.2 },
        browserDistribution: { chrome: 0.7, edge: 0.15, safari: 0.1, firefox: 0.05 }
    },
    'CN': {
        country: 'China',
        languages: ['zh-CN', 'zh', 'en-US', 'en'],
        timezone: 'Asia/Shanghai',
        locale: 'zh-CN',
        currency: 'CNY',
        osDistribution: { windows: 0.9, macos: 0.1 },
        browserDistribution: { chrome: 0.5, edge: 0.3, firefox: 0.15, safari: 0.05 }
    },
    'TH': {
        country: 'Thailand',
        languages: ['th-TH', 'th', 'en-US', 'en'],
        timezone: 'Asia/Bangkok',
        locale: 'th-TH',
        currency: 'THB',
        osDistribution: { windows: 0.8, macos: 0.2 },
        browserDistribution: { chrome: 0.75, edge: 0.15, firefox: 0.08, safari: 0.02 }
    }
};
exports.GEOGRAPHIC_REGIONS = GEOGRAPHIC_REGIONS;
// Pre-built popular User-Agent strings (most used in 2025)
const POPULAR_USER_AGENTS = [
    // Windows Chrome (most popular) - Default for all profiles
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
];
exports.POPULAR_USER_AGENTS = POPULAR_USER_AGENTS;
// Default User-Agent for all profiles
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
exports.DEFAULT_USER_AGENT = DEFAULT_USER_AGENT;
// Edge versions (based on Chromium)
const EDGE_VERSIONS = [
    '137.0.0.0', '138.0.0.0', '139.0.0.0', '140.0.0.0', '141.0.0.0'
];
exports.EDGE_VERSIONS = EDGE_VERSIONS;
// Firefox versions (less common but still used)
const FIREFOX_VERSIONS = [
    '120.0', '121.0', '122.0', '123.0', '124.0', '125.0'
];
exports.FIREFOX_VERSIONS = FIREFOX_VERSIONS;
// Safari versions
const SAFARI_VERSIONS = [
    '17.0', '17.1', '17.2', '18.0', '18.1'
];
exports.SAFARI_VERSIONS = SAFARI_VERSIONS;
/**
 * Detect IP location using external service
 */
async function detectIPLocation(proxyConfig) {
    try {
        const options = {
            hostname: 'ipapi.co',
            port: 443,
            path: '/json/',
            method: 'GET',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        // If proxy is configured, use it for location detection
        if (proxyConfig) {
            options.hostname = proxyConfig.host;
            options.port = proxyConfig.port;
            options.path = 'https://ipapi.co/json/';
            if (proxyConfig.username && proxyConfig.password) {
                const auth = Buffer.from(`${proxyConfig.username}:${proxyConfig.password}`).toString('base64');
                options.headers['Proxy-Authorization'] = `Basic ${auth}`;
            }
        }
        return new Promise((resolve) => {
            const req = (proxyConfig ? http : https).request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const location = JSON.parse(data);
                        console.log(`IP Location detected: ${location.country_name} (${location.country_code})`);
                        resolve({
                            country: location.country_code,
                            countryName: location.country_name,
                            region: location.region,
                            city: location.city,
                            timezone: location.timezone,
                            languages: location.languages ? location.languages.split(',') : ['en-US'],
                            success: true
                        });
                    }
                    catch (error) {
                        console.log(`Failed to parse location data: ${error.message}`);
                        resolve({ success: false, error: error.message });
                    }
                });
            });
            req.on('error', (error) => {
                console.log(`IP location detection failed: ${error.message}`);
                resolve({ success: false, error: error.message });
            });
            req.on('timeout', () => {
                req.destroy();
                console.log('IP location detection timeout');
                resolve({ success: false, error: 'timeout' });
            });
            req.end();
        });
    }
    catch (error) {
        console.log(`IP location detection error: ${error.message}`);
        return { success: false, error: error.message };
    }
}
/**
 * Generate synchronized configuration based on IP location
 */
function generateSynchronizedConfig(profile, locationInfo, config) {
    const fingerprint = generateProfileFingerprint(profile);
    const { random } = fingerprint;
    // Get region configuration or default to US
    const regionCode = locationInfo.country || 'US';
    const regionConfig = GEOGRAPHIC_REGIONS[regionCode] || GEOGRAPHIC_REGIONS['US'];
    // Choose OS based on regional distribution
    const osRandom = Math.random();
    let osType = 'windows';
    if (osRandom > regionConfig.osDistribution.windows) {
        osType = 'macos';
    }
    // Choose browser based on regional distribution
    const browserRandom = Math.random();
    let browserType = 'chrome';
    if (browserRandom > regionConfig.browserDistribution.chrome) {
        if (browserRandom > regionConfig.browserDistribution.chrome + regionConfig.browserDistribution.safari) {
            browserType = 'edge';
        }
        else {
            browserType = 'safari';
        }
    }
    // Always use the default Windows Chrome User-Agent for all profiles
    const userAgent = DEFAULT_USER_AGENT;
    // Generate Accept-Language header based on region
    const acceptLanguage = regionConfig.languages.join(', ');
    // Use detected timezone or fallback to region default
    const timezone = locationInfo.timezone || regionConfig.timezone;
    const synchronizedConfig = {
        userAgent,
        acceptLanguage,
        timezone,
        locale: regionConfig.locale,
        country: regionCode,
        countryName: regionConfig.country,
        currency: regionConfig.currency,
        osType: 'windows',
        browserType: 'chrome',
        screenResolution: generateScreenResolution(profile, config),
        webglInfo: generateWebGLInfo(profile, config),
        fingerprint: fingerprint.hash,
        synchronized: true,
        locationInfo: {
            country: locationInfo.country,
            countryName: locationInfo.countryName,
            region: locationInfo.region,
            city: locationInfo.city
        }
    };
    console.log(`[${profile}] Generated synchronized config for ${regionConfig.country}:`);
    console.log(`  - User-Agent: ${userAgent.substring(0, 60)}...`);
    console.log(`  - Accept-Language: ${acceptLanguage}`);
    console.log(`  - Timezone: ${timezone}`);
    console.log(`  - OS: Windows, Browser: Chrome (Default)`);
    return synchronizedConfig;
}
/**
 * Generate a random User-Agent based on profile seed
 */
function generateUserAgent(profile, config) {
    // Always use the default Windows Chrome User-Agent for all profiles
    console.log(`[${profile}] Using default Windows Chrome User-Agent: ${DEFAULT_USER_AGENT.substring(0, 50)}...`);
    return DEFAULT_USER_AGENT;
}
// Detect actual screen resolution of the device
function getActualScreenResolution() {
    try {
        const platform = os.platform();
        if (platform === 'win32') {
            // Windows: Use PowerShell to get screen resolution
            const command = 'powershell "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds"';
            const result = (0, child_process_1.execSync)(command, { encoding: 'utf8' }).trim();
            // Parse result like: Width=1920 Height=1080 X=0 Y=0
            const widthMatch = result.match(/Width=(\d+)/);
            const heightMatch = result.match(/Height=(\d+)/);
            if (widthMatch && heightMatch) {
                return {
                    width: parseInt(widthMatch[1]),
                    height: parseInt(heightMatch[1])
                };
            }
        }
        else if (platform === 'darwin') {
            // macOS: Use system_profiler
            const command = 'system_profiler SPDisplaysDataType | grep Resolution';
            const result = (0, child_process_1.execSync)(command, { encoding: 'utf8' }).trim();
            // Parse result like: Resolution: 1920 x 1080
            const match = result.match(/Resolution:\s*(\d+)\s*x\s*(\d+)/);
            if (match) {
                return {
                    width: parseInt(match[1]),
                    height: parseInt(match[2])
                };
            }
        }
        else if (platform === 'linux') {
            // Linux: Use xrandr
            const command = 'xrandr | grep " connected" | head -1';
            const result = (0, child_process_1.execSync)(command, { encoding: 'utf8' }).trim();
            // Parse result like: HDMI-1 connected 1920x1080+0+0
            const match = result.match(/(\d+)x(\d+)/);
            if (match) {
                return {
                    width: parseInt(match[1]),
                    height: parseInt(match[2])
                };
            }
        }
        // Fallback: Use default resolution
        console.log('Could not detect screen resolution, using default 1920x1080');
        return { width: 1920, height: 1080 };
    }
    catch (error) {
        console.log(`Error detecting screen resolution: ${error.message}, using default 1920x1080`);
        return { width: 1920, height: 1080 };
    }
}
// Generate unique fingerprint for each profile
function generateProfileFingerprint(profile) {
    const hash = crypto.createHash('sha256').update(profile).digest('hex');
    const seed = parseInt(hash.substring(0, 8), 16);
    // Use seed for consistent randomization per profile
    const random = (min, max) => {
        const x = Math.sin(seed + min + max) * 10000;
        return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };
    return {
        seed,
        random,
        hash: hash.substring(0, 16)
    };
}
// Generate screen resolution based on profile (with config support)
function generateScreenResolution(profile, config) {
    if (config && config.screenResolution) {
        console.log(`[${profile}] Using saved screen resolution: ${config.screenResolution.width}x${config.screenResolution.height}`);
        return config.screenResolution;
    }
    const fingerprint = generateProfileFingerprint(profile);
    const { random } = fingerprint;
    const resolutions = [
        { width: 1920, height: 1080 }
    ];
    const resolution = resolutions[random(0, resolutions.length - 1)];
    console.log(`[${profile}] Generated new screen resolution: ${resolution.width}x${resolution.height}`);
    return resolution;
}
// Generate WebGL vendor/renderer based on profile (with config support)
function generateWebGLInfo(profile, config) {
    if (config && config.webglInfo) {
        console.log(`[${profile}] Using saved WebGL info: ${config.webglInfo.vendor}`);
        return config.webglInfo;
    }
    const fingerprint = generateProfileFingerprint(profile);
    const { random } = fingerprint;
    const vendors = [
        'Google Inc. (NVIDIA)', 'Google Inc. (Intel)', 'Google Inc. (AMD)',
        'Google Inc. (Microsoft)', 'Google Inc. (Qualcomm)'
    ];
    const renderers = [
        // NVIDIA GeForce RTX 40/50 series (2025)
        'ANGLE (NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (NVIDIA GeForce RTX 4070 Ti Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (NVIDIA GeForce RTX 5080 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (NVIDIA GeForce RTX 5070 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (NVIDIA GeForce RTX 5060 Direct3D11 vs_5_0 ps_5_0)',
    ];
    const webglInfo = {
        vendor: vendors[random(0, vendors.length - 1)],
        renderer: renderers[random(0, renderers.length - 1)]
    };
    console.log(`[${profile}] Generated new WebGL info: ${webglInfo.vendor}`);
    return webglInfo;
}
//# sourceMappingURL=userAgentConfig.js.map