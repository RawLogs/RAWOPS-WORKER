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
require("dotenv/config");
const services_1 = __importDefault(require("./services"));
const rawbot_1 = require("@rawops/rawbot");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const POLL_INTERVAL = 5000; // 5 seconds
// Initialize API service
const apiService = new services_1.default();
// Track active browsers by run ID
const activeBrowsers = new Map();
// Cache for user API keys to avoid repeated API calls
const userApiKeyCache = new Map();
/**
 * Process cache files to filter out already processed links and clean up data
 */
async function processCacheForRun(run, settings) {
    const cacheDir = path.join(process.cwd(), 'cache', `profile_${run.profile.handle}`);
    console.log(`[${run.id}] Processing cache for profile: ${run.profile.handle}`);
    console.log(`[${run.id}] Cache directory: ${cacheDir}`);
    try {
        // Ensure cache directory exists
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
            console.log(`[${run.id}] Created cache directory: ${cacheDir}`);
        }
        // Read existing cache files
        const donePath = path.join(cacheDir, 'done.json');
        const failedPath = path.join(cacheDir, 'failed.json');
        let doneLinks = [];
        let failedLinks = [];
        // Read done links
        if (fs.existsSync(donePath)) {
            try {
                const doneData = JSON.parse(fs.readFileSync(donePath, 'utf8'));
                doneLinks = doneData.map((item) => item.url);
                console.log(`[${run.id}] Found ${doneLinks.length} done links in cache`);
            }
            catch (error) {
                console.error(`[${run.id}] Error reading done.json:`, error);
            }
        }
        // Read failed links
        if (fs.existsSync(failedPath)) {
            try {
                const failedData = JSON.parse(fs.readFileSync(failedPath, 'utf8'));
                failedLinks = failedData.map((item) => item.url);
                console.log(`[${run.id}] Found ${failedLinks.length} failed links in cache`);
            }
            catch (error) {
                console.error(`[${run.id}] Error reading failed.json:`, error);
            }
        }
        // Clean up failed links that are now in done
        const originalFailedCount = failedLinks.length;
        const linksToRemoveFromFailed = failedLinks.filter(link => doneLinks.includes(link));
        failedLinks = failedLinks.filter(link => !doneLinks.includes(link));
        if (originalFailedCount !== failedLinks.length) {
            console.log(`[${run.id}] Cleaned up ${originalFailedCount - failedLinks.length} failed links that are now done`);
            console.log(`[${run.id}] Links moved from failed to done: ${linksToRemoveFromFailed.join(', ')}`);
            // Log each retry success individually
            for (const link of linksToRemoveFromFailed) {
                console.log(`[${run.id}] ✅ RETRY SUCCESS: ${link} - Reason: retry done`);
            }
            // Update failed.json with remaining failed links only
            const updatedFailedData = failedLinks.map(link => ({
                url: link,
                timestamp: new Date().toISOString(),
                reason: 'Still failed - needs retry'
            }));
            fs.writeFileSync(failedPath, JSON.stringify(updatedFailedData, null, 2));
            console.log(`[${run.id}] Updated failed.json with ${updatedFailedData.length} remaining failed links`);
            // Add the moved links to done.json
            if (linksToRemoveFromFailed.length > 0) {
                const doneData = doneLinks.map(link => ({
                    url: link,
                    timestamp: new Date().toISOString(),
                    status: 'DONE',
                    movedFromFailed: linksToRemoveFromFailed.includes(link),
                    retrySuccess: linksToRemoveFromFailed.includes(link) ? 'retry done' : undefined
                }));
                fs.writeFileSync(donePath, JSON.stringify(doneData, null, 2));
                console.log(`[${run.id}] Updated done.json with ${doneData.length} done links (including ${linksToRemoveFromFailed.length} moved from failed)`);
            }
        }
        // Priority logic: Process 'links' first, only add 'failed' if no 'links' available
        const originalLinksCount = settings.links.length;
        const originalLinks = [...settings.links]; // Keep original links for API submission
        // Step 1: Filter out DONE links from the main 'links' array
        settings.links = settings.links.filter((link) => !doneLinks.includes(link));
        // Step 2: Submit API to update done/failed status BEFORE processing remaining links
        if (doneLinks.length > 0 || failedLinks.length > 0) {
            console.log(`[${run.id}] Submitting API to update done/failed status before processing...`);
            console.log(`[${run.id}]   - Cache done links: ${doneLinks.length}`);
            console.log(`[${run.id}]   - Cache failed links: ${failedLinks.length}`);
            console.log(`[${run.id}]   - Original links to check: ${originalLinks.length}`);
            try {
                await (0, rawbot_1.bulkUpdateLinksStatusAPI)(run.profile.id, // Profile ID for API
                run.profile.handle, // Profile handle for cache directory
                [], // Don't pass doneLinks here - function will read from cache
                [], // Don't pass failedLinks here - function will read from cache
                originalLinks // Original links for reference
                );
                console.log(`[${run.id}] ✅ API submitted successfully - function will determine actual counts from cache`);
            }
            catch (error) {
                console.error(`[${run.id}] Error submitting API after filtering:`, error);
                // Continue processing even if API submission fails
            }
        }
        else {
            console.log(`[${run.id}] No done/failed links to submit to API`);
        }
        // Step 3: Handle case when no links are available to process
        if (settings.links.length === 0) {
            if (failedLinks.length > 0) {
                console.log(`[${run.id}] No links available, submitting all original links as DONE`);
                // Clear failed cache locally
                const failedPath = path.join(cacheDir, 'failed.json');
                if (fs.existsSync(failedPath)) {
                    fs.writeFileSync(failedPath, JSON.stringify([], null, 2));
                    console.log(`[${run.id}] Cleared local failed cache`);
                }
                // Submit all original links as DONE since all processing is complete
                try {
                    await (0, rawbot_1.bulkUpdateLinksStatusAPI)(run.profile.id, // Profile ID for API
                    run.profile.handle, // Profile handle for cache directory
                    [], // Don't pass doneLinks here - function will read from cache
                    [], // Don't pass failedLinks here - function will read from cache
                    originalLinks // Original links for reference
                    );
                    console.log(`[${run.id}] ✅ Submitted all ${originalLinks.length} original links as DONE`);
                }
                catch (error) {
                    console.error(`[${run.id}] Error clearing failed links via API:`, error);
                }
                // Set links to empty to stop processing
                settings.links = [];
                console.log(`[${run.id}] All links processed, stopping run with success`);
            }
            else {
                console.log(`[${run.id}] No links available and no failed links to retry`);
                settings.links = [];
            }
        }
        else {
            console.log(`[${run.id}] Processing ${settings.links.length} links from main queue (skipping failed links)`);
        }
        console.log(`[${run.id}] Cache processing results:`);
        console.log(`   - Done links: ${doneLinks.length} (filtered out)`);
        console.log(`   - Failed links: ${failedLinks.length} (cleared and moved to done)`);
        console.log(`   - Original links: ${originalLinksCount}`);
        console.log(`   - Final links to process: ${settings.links.length}`);
        console.log(`   - Status: ${settings.links.length === 0 ? 'All links processed - stopping run' : 'Processing remaining links'}`);
        return settings;
    }
    catch (error) {
        console.error(`[${run.id}] Error processing cache:`, error);
        return settings; // Return original settings if cache processing fails
    }
}
// Helper function to handle profile busy errors
async function handleProfileBusyError(run, error) {
    if (error.message.includes('user data directory is already in use')) {
        console.log(`[${run.id}] ⚠️ Profile ${run.profile?.handle || 'unknown'} is already running. Skipping this run.`);
        // Update run status to indicate profile is busy
        await apiService.updateRunStatus(run.id, 'FAILED', {
            error: 'Profile is already in use by another process',
            profileBusy: true,
            completedAt: new Date()
        });
        return true; // Indicates we handled the error
    }
    return false; // Indicates we didn't handle the error
}
// Helper function to parse proxy string
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
/**
 * Calculate checksum of all dist folders in the packages directory
 * This creates a hash based on dist folder contents to detect code changes
 * Only checks dist/ folders because we only copy dist when building
 */
function calculatePackagesChecksum() {
    let rootDir = process.cwd();
    let packagesDir = null;
    let currentDir = rootDir;
    while (currentDir !== path.dirname(currentDir)) {
        const testPackagesDir = path.join(currentDir, 'packages');
        // Check if this directory contains packages/ AND is RAWOPS-AI
        if (fs.existsSync(testPackagesDir)) {
            packagesDir = testPackagesDir;
            rootDir = currentDir;
            break;
        }
        // Stop if we've gone up too far (reached drive root or unrelated directory)
        if (currentDir === path.dirname(currentDir)) {
            break;
        }
        currentDir = path.dirname(currentDir);
    }
    if (!packagesDir || !fs.existsSync(packagesDir)) {
        console.warn(`[Checksum] RAWOPS-AI packages directory not found: ${packagesDir || 'not found'}`);
        console.warn(`[Checksum] Current working directory: ${rootDir}`);
        return crypto.createHash('sha256').update('no-packages').digest('hex');
    }
    console.log(`[Checksum] Calculating checksum from: ${packagesDir}`);
    const hash = crypto.createHash('sha256');
    // Process each package's dist folder
    function processDistDirectory(distPath, packageName, basePackagesDir) {
        if (!fs.existsSync(distPath)) {
            console.warn(`[Checksum] Dist directory does not exist for ${packageName}: ${distPath}`);
            return;
        }
        const entries = fs.readdirSync(distPath, { withFileTypes: true });
        // Sort entries by name to ensure consistent order across different file systems
        entries.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
        for (const entry of entries) {
            const fullPath = path.join(distPath, entry.name);
            // Calculate relative path from packagesDir, not distPath, for consistency
            const relativePath = path.relative(basePackagesDir, fullPath);
            const normalizedPath = relativePath.replace(/\\/g, '/'); // Normalize path separators
            // Skip node_modules and other non-code directories
            if (entry.name === 'node_modules' ||
                entry.name === '.git' ||
                entry.name.startsWith('.')) {
                continue;
            }
            // Skip source map files (.map) as they are not needed for checksum and may differ between builds
            if (entry.isFile() && entry.name.endsWith('.map')) {
                continue;
            }
            if (entry.isDirectory()) {
                processDistDirectory(fullPath, packageName, basePackagesDir);
            }
            else if (entry.isFile()) {
                try {
                    // Include package name, normalized relative path, and content in hash
                    const content = fs.readFileSync(fullPath);
                    hash.update(packageName);
                    hash.update(normalizedPath);
                    hash.update(content);
                }
                catch (error) {
                    console.warn(`[Checksum] Error reading file ${fullPath}:`, error);
                }
            }
        }
    }
    // Find all packages and process their dist folders
    try {
        const packages = fs.readdirSync(packagesDir, { withFileTypes: true });
        // Sort packages by name to ensure consistent order
        packages.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
        for (const pkg of packages) {
            if (pkg.isDirectory()) {
                const distPath = path.join(packagesDir, pkg.name, 'dist');
                if (fs.existsSync(distPath)) {
                    processDistDirectory(distPath, pkg.name, packagesDir);
                }
                else {
                    // If no dist folder, still include package name to detect missing builds
                    hash.update(pkg.name);
                    hash.update('no-dist');
                }
            }
        }
    }
    catch (error) {
        console.error(`[Checksum] Error processing packages directory:`, error);
    }
    return hash.digest('hex');
}
// --- Main Worker Loop ---
async function main() {
    console.log('🚀 Worker started. Polling for jobs...');
    setInterval(async () => {
        // Check for queued runs
        const run = await findAndLockQueuedRun();
        if (run) {
            // Log worker version from API if available
            if (run.workerVersionId && run.workerVersion) {
                const requiredVersion = run.workerVersion.version;
                console.log(`\n[${run.id}] ═══════════════════════════════════════════════════════════════════`);
                console.log(`[${run.id}] 🔍 WORKER VERSION INFO`);
                console.log(`[${run.id}] ═══════════════════════════════════════════════════════════════════`);
                console.log(`[${run.id}] 📦 Version from API: ${requiredVersion}`);
                console.log(`[${run.id}] 🆔 Version ID: ${run.workerVersionId}`);
                console.log(`[${run.id}] ═══════════════════════════════════════════════════════════════════\n`);
            }
            const profileHandle = run.profile?.handle;
            if (!profileHandle || profileHandle === 'unknown') {
                console.log(`[${run.id}] ⚠️ Run skipped: Profile handle is unknown.`);
            }
            else {
                console.log(`[${run.id}] Found job of type '${run.type}' for account: ${profileHandle}. Starting...`);
                await processRun(run);
            }
        }
        // Check for stopped runs and cleanup browsers
        await checkAndCleanupStoppedRuns();
    }, POLL_INTERVAL);
}
async function checkAndCleanupStoppedRuns() {
    try {
        // Check all active browsers to see if their runs have been stopped externally
        for (const [runId, browser] of activeBrowsers.entries()) {
            try {
                // Check the current status of this run
                const runStatus = await apiService.getRunStatus(runId);
                // Handle null response (API error/timeout)
                if (!runStatus) {
                    // If we can't check the status, assume the run is still active
                    continue;
                }
                // Only clean up browser if run is explicitly STOPPED or FAILED
                if (runStatus.status === 'STOPPED' || runStatus.status === 'FAILED') {
                    console.log(`[${runId}] Run status changed to '${runStatus.status}', cleaning up browser`);
                    try {
                        if (browser && typeof browser.close === 'function') {
                            await browser.close();
                            console.log(`[${runId}] Browser closed successfully`);
                        }
                    }
                    catch (error) {
                        console.error(`[${runId}] Error closing browser:`, error);
                    }
                    finally {
                        activeBrowsers.delete(runId);
                    }
                }
            }
            catch (error) {
                console.error(`[${runId}] Error checking run status:`, error);
                // If we can't check the status, assume the run is still active
            }
        }
    }
    catch (error) {
        console.error('Error checking stopped runs:', error);
    }
}
async function findAndLockQueuedRun() {
    try {
        return await apiService.findAndLockQueuedRun();
    }
    catch (error) {
        // Handle timeout errors gracefully - just log as server issue
        if (error instanceof Error && error.message.includes('timeout')) {
            console.log("Server timeout while finding queued run - will retry next poll");
            return null;
        }
        // Log other errors as unexpected
        console.error("Unexpected error finding queued run:", error);
        return null;
    }
}
// --- Run Processor ---
async function processRun(run) {
    try {
        // Validate run data
        if (!run.profile || !run.profile.handle) {
            console.error(`[${run.id}] Invalid run data: missing profile or handle`);
            await apiService.updateRunStatus(run.id, 'FAILED', {
                error: 'Invalid run data: missing profile or handle'
            });
            return;
        }
        // SECURITY: Validate that the profile belongs to the authenticated user
        // This is critical to prevent cross-user access
        if (!run.profile.userId) {
            console.error(`[${run.id}] Security violation: Profile ${run.profile.id} has no userId`);
            await apiService.updateRunStatus(run.id, 'FAILED', {
                error: 'Security violation: Profile has no user association'
            });
            return;
        }
        console.log(`[${run.id}] Processing run for user ${run.profile.userId} with profile ${run.profile.handle}`);
        console.log(`[${run.id}] Processing run with type: "${run.type}" (length: ${run.type.length})`);
        switch (run.type) {
            case 'PROJECT':
                await runProjectFlow(run);
                break;
            case 'GROW':
                await runGrowFlow(run);
                break;
            case 'COMMENT':
                await runCommentFlow(run);
                break;
            case 'LOGIN':
                await runProfileFlow(run);
                break;
            default:
                throw new Error(`Unknown run type: ${run.type}`);
        }
        await apiService.updateRunStatus(run.id, 'SUCCESS', { completedAt: new Date() });
        console.log(`[${run.id}] ✅ Run completed successfully.`);
    }
    catch (error) {
        console.error(`[${run.id}] ❌ Error processing run:`, error);
        await apiService.updateRunStatus(run.id, 'FAILED', { completedAt: new Date() });
    }
}
// =======================================================
// --- AUTOMATION FLOWS ---
// =======================================================
/**
 * Executes manual profile flow for 'LOGIN' type run (runProfile mode).
 */
async function runProfileFlow(run) {
    console.log(`[${run.id}] 🔐 Starting manual profile flow for profile: ${run.profile?.handle || 'unknown'}`);
    try {
        // Get proxy config from run stats
        const proxyConfig = run.stats?.proxyConfig || null;
        // Initialize XClient for manual login (runProfile mode)
        const xClient = new rawbot_1.XClient();
        await xClient.initializeForRunProfile(run.profile?.handle || 'unknown', proxyConfig);
        // Track the Chrome process for cleanup
        activeBrowsers.set(run.id, {
            close: async () => {
                console.log(`[${run.id}] Closing Chrome process for profile: ${run.profile?.handle || 'unknown'}`);
                // Chrome process will be killed when worker stops or run is stopped
            }
        });
        console.log(`[${run.id}] ✅ Manual profile browser launched for profile: ${run.profile?.handle || 'unknown'}`);
        // Update run status to indicate browser is ready for manual login
        await apiService.updateRunStatus(run.id, 'RUNNING', {
            stats: {
                ...run.stats,
                browserLaunched: true,
                message: 'Browser opened for manual login. Please login to X.com'
            }
        });
    }
    catch (error) {
        // Check if it's a profile already in use error first
        if (error instanceof Error && await handleProfileBusyError(run, error)) {
            return; // Don't throw error, just skip this run
        }
        // Only log error if we didn't handle it
        console.error(`[${run.id}] ❌ Error in profile flow:`, error);
        throw error;
    }
    finally {
        // Cleanup browser when run completes
        if (activeBrowsers.has(run.id)) {
            try {
                const browser = activeBrowsers.get(run.id);
                if (browser && typeof browser.close === 'function') {
                    await browser.close();
                    console.log(`[${run.id}] Browser closed after profile flow completion`);
                }
            }
            catch (error) {
                console.error(`[${run.id}] Error closing browser:`, error);
            }
            finally {
                activeBrowsers.delete(run.id);
            }
        }
    }
}
/**
 * Executes the full yapproject automation pipeline for a 'PROJECT' type run.
 */
async function runProjectFlow(run) {
    console.log(`[${run.id}] Starting YapProject flow...`);
    try {
        // Initialize YapProject service with profile
        const yapProjectService = new rawbot_1.YapProjectService();
        // Initialize XClient with profile and proxy
        console.log(`[${run.id}] Initializing browser for profile: ${run.profile?.handle || 'unknown'}`);
        const proxyConfig = parseProxyString(run.profile.proxy || '');
        await yapProjectService.initializeWithProfile(run.profile, proxyConfig);
        // Track the Playwright browser for cleanup
        activeBrowsers.set(run.id, yapProjectService.xClient);
        // Load user-specific settings for this project
        const settings = await loadUserProjectSettings(run.project.id, run.profile.id);
        // Load user's interaction rules for this specific profile
        const interactionRules = await loadUserInteractionRules(run.profile.id);
        console.log(`[${run.id}] Loaded settings:`, {
            hashtags: settings.hashtags.length,
            handles: settings.handles.length,
            links: settings.links.length,
            maxInteractions: settings.maxInteractions,
            interactionRulesEnabled: interactionRules.settings.enabled,
            rulesCount: interactionRules.rules.length
        });
        // Run the complete yapproject workflow with interaction rules
        const result = await yapProjectService.runYapProjectWorkflow(run.project, run, settings, interactionRules);
        console.log(`[${run.id}] YapProject workflow completed:`, {
            success: result.success,
            tweetsCollected: result.tweetsCollected,
            tweetsFiltered: result.tweetsFiltered,
            interactionsExecuted: result.interactionsExecuted,
            duration: result.duration
        });
        if (!result.success) {
            throw new Error(`YapProject workflow failed: ${result.errors.join(', ')}`);
        }
    }
    catch (error) {
        // Check if it's a profile already in use error first
        if (error instanceof Error && await handleProfileBusyError(run, error)) {
            return; // Don't throw error, just skip this run
        }
        // Only log error if we didn't handle it
        console.error(`[${run.id}] Error in YapProject flow:`, error);
        throw error;
    }
    finally {
        // Cleanup browser when run completes
        if (activeBrowsers.has(run.id)) {
            try {
                const browser = activeBrowsers.get(run.id);
                if (browser && typeof browser.close === 'function') {
                    await browser.close();
                    console.log(`[${run.id}] Browser closed after workflow completion`);
                }
            }
            catch (error) {
                console.error(`[${run.id}] Error closing browser:`, error);
            }
            finally {
                activeBrowsers.delete(run.id);
            }
        }
    }
}
/**
 * Load user's interaction rules
 */
async function loadUserInteractionRules(profileId) {
    try {
        const interactionRules = await apiService.getUserInteractionRules(profileId);
        if (interactionRules) {
            console.log(`[Worker] Found interaction rules for profile ${profileId}`);
            return interactionRules;
        }
        // Fallback to default rules
        console.log(`[Worker] No interaction rules found, using defaults`);
        return {
            rules: [
                {
                    id: "mandatory_discovery",
                    name: "Mandatory Discovery",
                    description: "Always discover when links < 3",
                    followingRange: {
                        min: 0,
                        max: 1000,
                        operator: "always"
                    },
                    actions: {
                        follow: false,
                        like: false,
                        comment: false,
                        discovery: {
                            enabled: true,
                            linkThreshold: 3,
                            mandatory: true
                        }
                    },
                    priority: 0
                },
                {
                    id: "rule_6",
                    name: "Cân bằng (organic active)",
                    description: "Custom interaction rule",
                    followingRange: {
                        min: 80,
                        max: 200,
                        operator: "between_percent"
                    },
                    actions: {
                        follow: false,
                        like: true,
                        comment: true,
                        discovery: {
                            enabled: true,
                            linkThreshold: 20,
                            mandatory: false
                        }
                    },
                    priority: 4
                }
            ],
            settings: {
                enabled: true,
                version: "1.0.0",
                lastUpdated: new Date().toISOString()
            }
        };
    }
    catch (error) {
        console.error('[Worker] Error loading interaction rules:', error);
        // Return default rules if anything fails
        return {
            rules: [],
            settings: {
                enabled: false,
                version: "1.0.0",
                lastUpdated: new Date().toISOString()
            }
        };
    }
}
/**
 * Get and cache Gemini API key for a user
 */
async function getGeminiApiKey(userId) {
    try {
        // Check cache first
        if (userApiKeyCache.has(userId)) {
            console.log(`[Worker] Using cached Gemini API key for user: ${userId}`);
            return userApiKeyCache.get(userId);
        }
        console.log(`[Worker] Fetching Gemini API key for user: ${userId}`);
        const apiKeyData = await apiService.getUserApiKey(userId);
        if (apiKeyData && apiKeyData.geminiApiKey) {
            // Cache the API key
            userApiKeyCache.set(userId, apiKeyData.geminiApiKey);
            console.log(`[Worker] Gemini API key cached for user: ${userId}`);
            return apiKeyData.geminiApiKey;
        }
        console.log(`[Worker] No Gemini API key found for user: ${userId}`);
        return null;
    }
    catch (error) {
        console.error('[Worker] Error fetching Gemini API key:', error);
        return null;
    }
}
/**
 * Load user-specific comment settings
 */
async function loadUserCommentSettings(profileId, userId) {
    try {
        // Try to get user-specific comment settings first
        const userSettings = await apiService.getUserCommentSettings(profileId);
        if (userSettings) {
            console.log(`[Worker] Found user-specific comment settings for profile ${profileId}`);
            // Get Gemini API key if userId is provided and AI is enabled
            if (userId && userSettings.aiCommentEnabled && !userSettings.geminiApiKey) {
                console.log(`[Worker] Fetching Gemini API key for AI comment generation...`);
                const geminiApiKey = await getGeminiApiKey(userId);
                if (geminiApiKey) {
                    userSettings.geminiApiKey = geminiApiKey;
                    console.log(`[Worker] Gemini API key added to settings`);
                }
                else {
                    console.log(`[Worker] No Gemini API key found, AI comments will be disabled`);
                    userSettings.aiCommentEnabled = false;
                }
            }
            // Get prompt settings from database if AI is enabled
            if (userSettings.aiCommentEnabled) {
                console.log(`[Worker] Fetching prompt settings from database...`);
                try {
                    const promptSettings = await apiService.getUserPromptSettings(profileId, 'COMMENT');
                    if (promptSettings && promptSettings.finalPrompt && promptSettings.requirePrompt) {
                        userSettings.databasePrompt = {
                            finalPrompt: promptSettings.finalPrompt,
                            requirePrompt: promptSettings.requirePrompt
                        };
                        // Add selectedPromptStyles from prompt settings
                        if (promptSettings.selectedPromptStyles) {
                            userSettings.selectedPromptStyles = promptSettings.selectedPromptStyles;
                            console.log(`[Worker] Selected prompt styles loaded: ${promptSettings.selectedPromptStyles.length} styles`);
                        }
                        console.log(`[Worker] Database prompt loaded successfully`);
                    }
                    else {
                        console.error(`[Worker] ❌ No database prompt found or incomplete. AI comments will be disabled.`);
                        console.error(`[Worker] Please ensure prompt_final table has a record with type='COMMENT' for this profile.`);
                        userSettings.aiCommentEnabled = false;
                        userSettings.databasePrompt = null;
                    }
                }
                catch (error) {
                    // Retry failed - rethrow to mark run as FAILED
                    console.error(`[Worker] ❌ Failed to load prompt settings after retries:`, error);
                    throw error;
                }
            }
            // Add profileId to settings for database prompt usage
            userSettings.profileId = profileId;
            return userSettings;
        }
        // Fallback to default comment settings
        console.log(`[Worker] No user-specific comment settings found, using defaults`);
        return {
            links: [],
            aiCommentEnabled: false,
            aiCommentPrompt: '',
            geminiApiKey: '',
            delayRange: { min: 5000, max: 15000 },
            aiModel: 'gemini-flash-latest',
            commentStyle: 'friendly',
            commentLength: 'short',
            includeHashtags: false,
            maxHashtags: 2,
            includeMentions: false,
            maxMentions: 1,
            promptStyleMode: 'manual',
            selectedPromptStyles: [],
            promptStyleCategory: 'default',
            commentMode: 'cml', // Default to cml (CommentByLink)
            databasePrompt: null // No database prompt for default settings
        };
    }
    catch (error) {
        console.error('[Worker] Error loading user comment settings:', error);
        // Return default settings if anything fails
        return {
            links: [],
            aiCommentEnabled: false,
            aiCommentPrompt: '',
            geminiApiKey: '',
            delayRange: { min: 5000, max: 15000 },
            aiModel: 'gemini-flash-latest',
            commentStyle: 'friendly',
            commentLength: 'short',
            includeHashtags: false,
            maxHashtags: 2,
            includeMentions: false,
            maxMentions: 1,
            promptStyleMode: 'manual',
            selectedPromptStyles: [],
            promptStyleCategory: 'default',
            commentMode: 'cml', // Default to cml (CommentByLink)
            databasePrompt: null // No database prompt for error fallback
        };
    }
}
/**
 * Load user-specific settings for a project
 */
async function loadUserProjectSettings(projectId, profileId) {
    try {
        // Try to get user-specific settings first
        const userSettings = await apiService.getUserProjectSettings(projectId, profileId);
        if (userSettings) {
            console.log(`[Worker] Found user-specific settings for profile ${profileId}`);
            return userSettings;
        }
        // Fallback to project default settings
        console.log(`[Worker] No user-specific settings found, using project defaults`);
        const project = await apiService.getProject(projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        return await loadProjectSettingsFromRules(project.Rules);
    }
    catch (error) {
        console.error('[Worker] Error loading user project settings:', error);
        // Return default settings if anything fails
        return {
            hashtags: [],
            handles: [],
            links: [],
            officialHandle: '',
            maxTweetsPerSearch: 100,
            timeLimitHours: 24,
            requireVerified: false,
            requireMedia: false,
            minLikes: 0,
            excludeSpam: true,
            maxMentions: 5,
            maxHashtags: 3,
            maxInteractions: 50,
            delayBetweenActions: 2000,
            delayBetweenTweets: 5000,
            scrollDelay: 1000,
            retryAttempts: 3,
            aiCommentEnabled: false,
            aiCommentPrompt: '',
            geminiApiKey: ''
        };
    }
}
/**
 * Load project settings from rules
 */
async function loadProjectSettingsFromRules(rules) {
    const settings = {
        hashtags: [],
        handles: [],
        links: [],
        officialHandle: '',
        maxTweetsPerSearch: 100,
        maxScrollsPerSearch: 20,
        timeLimitHours: 24,
        requireVerified: false,
        requireMedia: false,
        minLikes: 0,
        excludeSpam: true,
        maxMentions: 5,
        maxHashtags: 3,
        maxInteractions: 50,
        delayBetweenActions: 2000,
        delayBetweenTweets: 5000,
        scrollDelay: 1000,
        retryAttempts: 3,
        aiCommentEnabled: false,
        aiCommentPrompt: '',
        geminiApiKey: ''
    };
    // Parse rules to extract settings
    for (const rule of rules) {
        if (rule.payload) {
            const payload = rule.payload;
            switch (rule.type) {
                case 'SEARCH':
                    if (payload.hashtags)
                        settings.hashtags = payload.hashtags;
                    if (payload.handles)
                        settings.handles = payload.handles;
                    if (payload.links)
                        settings.links = payload.links;
                    if (payload.officialHandle)
                        settings.officialHandle = payload.officialHandle;
                    if (payload.maxTweetsPerSearch)
                        settings.maxTweetsPerSearch = payload.maxTweetsPerSearch;
                    if (payload.maxScrollsPerSearch)
                        settings.maxScrollsPerSearch = payload.maxScrollsPerSearch;
                    break;
                case 'FILTER':
                    if (payload.timeLimitHours)
                        settings.timeLimitHours = payload.timeLimitHours;
                    if (payload.requireVerified !== undefined)
                        settings.requireVerified = payload.requireVerified;
                    if (payload.requireMedia !== undefined)
                        settings.requireMedia = payload.requireMedia;
                    if (payload.minLikes)
                        settings.minLikes = payload.minLikes;
                    if (payload.excludeSpam !== undefined)
                        settings.excludeSpam = payload.excludeSpam;
                    if (payload.maxMentions)
                        settings.maxMentions = payload.maxMentions;
                    if (payload.maxHashtags)
                        settings.maxHashtags = payload.maxHashtags;
                    break;
                case 'INTERACTION':
                    if (payload.maxInteractions)
                        settings.maxInteractions = payload.maxInteractions;
                    if (payload.delayBetweenActions)
                        settings.delayBetweenActions = payload.delayBetweenActions;
                    if (payload.delayBetweenTweets)
                        settings.delayBetweenTweets = payload.delayBetweenTweets;
                    if (payload.scrollDelay)
                        settings.scrollDelay = payload.scrollDelay;
                    if (payload.retryAttempts)
                        settings.retryAttempts = payload.retryAttempts;
                    break;
                case 'AI':
                    if (payload.aiCommentEnabled !== undefined)
                        settings.aiCommentEnabled = payload.aiCommentEnabled;
                    if (payload.aiCommentPrompt)
                        settings.aiCommentPrompt = payload.aiCommentPrompt;
                    if (payload.geminiApiKey)
                        settings.geminiApiKey = payload.geminiApiKey;
                    break;
            }
        }
    }
    return settings;
}
/**
 * Load user-specific grow settings
 */
async function loadUserGrowSettings(profileId, userId) {
    try {
        // Try to get user-specific grow settings first
        const userSettings = await apiService.getUserGrowSettings(profileId);
        if (userSettings) {
            console.log(`[Worker] Found user-specific grow settings for profile ${profileId}`);
            // Get Gemini API key if userId is provided and AI is enabled
            if (userId && userSettings.aiCommentEnabled && !userSettings.geminiApiKey) {
                console.log(`[Worker] Fetching Gemini API key for AI comment generation...`);
                const geminiApiKey = await getGeminiApiKey(userId);
                if (geminiApiKey) {
                    userSettings.geminiApiKey = geminiApiKey;
                    console.log(`[Worker] Gemini API key added to settings`);
                }
                else {
                    console.log(`[Worker] No Gemini API key found, AI comments will be disabled`);
                    userSettings.aiCommentEnabled = false;
                }
            }
            // Get prompt settings from database if AI is enabled
            // Note: GROW uses COMMENT prompt settings since both use AI comment generation
            if (userSettings.aiCommentEnabled) {
                console.log(`[Worker] Fetching prompt settings from database (using COMMENT type)...`);
                try {
                    const promptSettings = await apiService.getUserPromptSettings(profileId, 'COMMENT');
                    console.log(`[Worker] Prompt settings response:`, {
                        hasPromptSettings: !!promptSettings,
                        hasFinalPrompt: !!(promptSettings?.finalPrompt),
                        hasRequirePrompt: !!(promptSettings?.requirePrompt),
                        hasSelectedStyles: !!(promptSettings?.selectedPromptStyles?.length)
                    });
                    if (promptSettings && promptSettings.finalPrompt && promptSettings.requirePrompt) {
                        userSettings.databasePrompt = {
                            finalPrompt: promptSettings.finalPrompt,
                            requirePrompt: promptSettings.requirePrompt
                        };
                        // Add selectedPromptStyles from prompt settings
                        if (promptSettings.selectedPromptStyles) {
                            userSettings.selectedPromptStyles = promptSettings.selectedPromptStyles;
                            console.log(`[Worker] Selected prompt styles loaded: ${promptSettings.selectedPromptStyles.length} styles`);
                        }
                        console.log(`[Worker] ✅ Database prompt loaded successfully for GROW`);
                    }
                    else {
                        console.error(`[Worker] ❌ No database prompt found or incomplete. AI comments will be disabled.`);
                        console.error(`[Worker] Prompt settings:`, JSON.stringify(promptSettings, null, 2));
                        console.error(`[Worker] Please ensure prompt_final table has a record with type='COMMENT' for this profile.`);
                        userSettings.aiCommentEnabled = false;
                        userSettings.databasePrompt = null;
                    }
                }
                catch (error) {
                    // Retry failed - rethrow to mark run as FAILED
                    console.error(`[Worker] ❌ Failed to load prompt settings after retries:`, error);
                    throw error;
                }
            }
            else {
                console.log(`[Worker] AI comment not enabled in grow settings, skipping prompt loading`);
            }
            return userSettings;
        }
        // Fallback to default grow settings (no user settings found - this is OK)
        console.log(`[Worker] No user-specific grow settings found, using defaults`);
        return {
            steps: [],
            links: [],
            delay_between_links: { min: 8000, max: 20000 },
            user_delay_follow: { min: 1500, max: 4000 },
            profileId: profileId,
            enableLike: true,
            enableComment: true,
            aiCommentEnabled: false,
            geminiApiKey: ''
        };
    }
    catch (error) {
        // If error is from getUserPromptSettings (network error after retries), rethrow it
        // Otherwise, log and rethrow to mark run as FAILED
        console.error('[Worker] ❌ Error loading user grow settings:', error);
        throw error; // Rethrow to mark run as FAILED
    }
}
/**
 * Executes the YAP Grow automation flow for a 'GROW' type run.
 */
async function runGrowFlow(run) {
    console.log(`[${run.id}] Starting YAP Grow flow for profile: ${run.profile?.handle || 'unknown'}`);
    try {
        // For GROW runs, we need to get userId from run
        const userId = run.userId || run.profile?.userId;
        if (!userId) {
            console.error(`[${run.id}] Security violation: No userId found for run`);
            throw new Error('Security violation: No userId found for run');
        }
        console.log(`[${run.id}] Using userId from run: ${userId}`);
        // Load user-specific grow settings with userId for Gemini API key
        let settings;
        try {
            settings = await loadUserGrowSettings(run.profile.id, userId);
        }
        catch (error) {
            console.error(`[${run.id}] ❌ Failed to load grow settings:`, error);
            await apiService.updateRunStatus(run.id, 'FAILED', {
                completedAt: new Date(),
                error: `Failed to load grow settings: ${error instanceof Error ? error.message : String(error)}`
            });
            return;
        }
        // Process cache to filter out already processed links
        const processedSettings = await processCacheForRun(run, settings);
        console.log(`[${run.id}] Loaded grow settings:`, {
            linksCount: processedSettings.links.length,
            stepsCount: processedSettings.steps?.length || 0,
            enableLike: processedSettings.enableLike,
            enableComment: processedSettings.enableComment,
            delayBetweenLinks: processedSettings.delay_between_links,
            userDelayFollow: processedSettings.user_delay_follow,
            aiCommentEnabled: processedSettings.aiCommentEnabled,
            hasGeminiApiKey: !!processedSettings.geminiApiKey,
            hasDatabasePrompt: !!(processedSettings.databasePrompt && processedSettings.databasePrompt.finalPrompt && processedSettings.databasePrompt.requirePrompt),
            hasSelectedStyles: !!processedSettings.selectedPromptStyles?.length,
            promptStyleMode: processedSettings.promptStyleMode
        });
        // Stop run if no links available to process - BEFORE initializing browser
        if (processedSettings.links.length === 0) {
            console.log(`[${run.id}] No links available to process, stopping run with success`);
            await apiService.updateRunStatus(run.id, 'SUCCESS', {
                completedAt: new Date(),
                stats: {
                    message: 'All links already processed',
                    linksProcessed: 0,
                    followed: 0,
                    liked: 0,
                    commented: 0
                }
            });
            return;
        }
        // Validate that steps are configured
        if (!processedSettings.steps || processedSettings.steps.length === 0) {
            console.log(`[${run.id}] No steps configured in grow settings, stopping run`);
            await apiService.updateRunStatus(run.id, 'FAILED', {
                completedAt: new Date(),
                error: 'No steps configured in grow settings'
            });
            return;
        }
        // Initialize YapGrow service
        console.log(`[${run.id}] Initializing YapGrow service`);
        const yapGrowService = new rawbot_1.YapGrow();
        // Initialize XClient with profile and proxy
        console.log(`[${run.id}] Initializing browser for profile: ${run.profile?.handle || 'unknown'}`);
        const proxyConfig = parseProxyString(run.profile.proxy || '');
        await yapGrowService.initializeWithProfile(run.profile, proxyConfig);
        // Track the browser for cleanup
        activeBrowsers.set(run.id, yapGrowService);
        // Run the complete yapgrow workflow
        const result = await yapGrowService.runYapGrowWorkflow(run.project || { id: 'default', name: 'Grow Run', createdAt: new Date(), updatedAt: new Date() }, run, processedSettings);
        console.log(`[${run.id}] YAP Grow workflow completed:`, {
            success: result.success,
            processedLinks: result.processedLinks.length,
            failedLinks: result.failedLinks.length,
            followed: result.followedCount,
            liked: result.likedCount,
            commented: result.commentedCount,
            profileExtracted: result.profileExtractedCount,
            duration: result.duration
        });
        if (!result.success) {
            throw new Error(`YAP Grow workflow failed: ${result.errors.join(', ')}`);
        }
    }
    catch (error) {
        // Check if it's a profile already in use error first
        if (error instanceof Error && await handleProfileBusyError(run, error)) {
            return; // Don't throw error, just skip this run
        }
        // Only log error if we didn't handle it
        console.error(`[${run.id}] Error in YAP Grow flow:`, error);
        throw error;
    }
    finally {
        // Cleanup browser when run completes
        if (activeBrowsers.has(run.id)) {
            try {
                const browser = activeBrowsers.get(run.id);
                if (browser && typeof browser.close === 'function') {
                    await browser.close();
                    console.log(`[${run.id}] Browser closed after grow workflow completion`);
                }
            }
            catch (error) {
                console.error(`[${run.id}] Error closing browser:`, error);
            }
            finally {
                activeBrowsers.delete(run.id);
            }
        }
    }
}
/**
 * Executes the YAP Comment automation flow for a 'COMMENT' type run.
 * Supports two modes: CommentByProfile and CommentByLink
 */
async function runCommentFlow(run) {
    console.log(`[${run.id}] Starting YAP Comment flow for profile: ${run.profile?.handle || 'unknown'}`);
    try {
        // For COMMENT runs, we need to get userId from run
        const userId = run.userId || run.profile?.userId;
        if (!userId) {
            console.error(`[${run.id}] Security violation: No userId found for run`);
            throw new Error('Security violation: No userId found for run');
        }
        console.log(`[${run.id}] Using userId from run: ${userId}`);
        // Load user-specific comment settings with userId for Gemini API key
        let settings;
        try {
            settings = await loadUserCommentSettings(run.profile.id, userId);
        }
        catch (error) {
            console.error(`[${run.id}] ❌ Failed to load comment settings:`, error);
            await apiService.updateRunStatus(run.id, 'FAILED', {
                completedAt: new Date(),
                error: `Failed to load comment settings: ${error instanceof Error ? error.message : String(error)}`
            });
            return;
        }
        // Process cache to filter out already processed links
        const processedSettings = await processCacheForRun(run, settings);
        console.log(`[${run.id}] Loaded comment settings:`, {
            linksCount: processedSettings.links.length,
            aiEnabled: processedSettings.aiCommentEnabled,
            hasGeminiApiKey: !!processedSettings.geminiApiKey,
            hasDatabasePrompt: !!processedSettings.databasePrompt,
            userId: userId,
            commentMode: processedSettings.commentMode || 'cml'
        });
        // Stop run if no links available to process - BEFORE initializing browser
        if (processedSettings.links.length === 0) {
            console.log(`[${run.id}] No links available to process, stopping run with success`);
            await apiService.updateRunStatus(run.id, 'SUCCESS', {
                completedAt: new Date(),
                stats: {
                    message: 'All links already processed',
                    linksProcessed: 0,
                    commentsPosted: 0,
                    likesPosted: 0,
                    repliesPosted: 0
                }
            });
            return;
        }
        // Determine which comment service to use based on settings
        const commentMode = processedSettings.commentMode || 'cml';
        console.log(`[${run.id}] Using comment mode: ${commentMode}`);
        let yapCommentService;
        if (commentMode === 'cbp') {
            console.log(`[${run.id}] Initializing CommentByProfile service (cbp)`);
            yapCommentService = new rawbot_1.CommentByProfile();
        }
        else {
            console.log(`[${run.id}] Initializing CommentByLink service (cml)`);
            yapCommentService = new rawbot_1.CommentByLink();
        }
        // Initialize XClient with profile and proxy
        console.log(`[${run.id}] Initializing browser for profile: ${run.profile?.handle || 'unknown'}`);
        const proxyConfig = parseProxyString(run.profile.proxy || '');
        await yapCommentService.initializeWithProfile(run.profile, proxyConfig);
        // Track the browser for cleanup
        activeBrowsers.set(run.id, yapCommentService);
        // Run the complete yapcomment workflow
        const result = await yapCommentService.runYapCommentWorkflow(run.project || { id: 'default', name: 'Comment Run', createdAt: new Date(), updatedAt: new Date() }, run, processedSettings);
        console.log(`[${run.id}] YAP Comment workflow completed:`, {
            success: result.success,
            commentsPosted: result.commentsPosted,
            likesPosted: result.likesPosted,
            repliesPosted: result.repliesPosted,
            processedLinks: result.processedLinks.length,
            failedLinks: result.failedLinks.length,
            duration: result.duration,
            commentMode: commentMode
        });
        if (!result.success) {
            throw new Error(`YAP Comment workflow failed: ${result.errors.join(', ')}`);
        }
    }
    catch (error) {
        // Check if it's a profile already in use error first
        if (error instanceof Error && await handleProfileBusyError(run, error)) {
            return; // Don't throw error, just skip this run
        }
        // Only log error if we didn't handle it
        console.error(`[${run.id}] Error in YAP Comment flow:`, error);
        throw error;
    }
    finally {
        // Cleanup browser when run completes
        if (activeBrowsers.has(run.id)) {
            try {
                const browser = activeBrowsers.get(run.id);
                if (browser && typeof browser.close === 'function') {
                    await browser.close();
                    console.log(`[${run.id}] Browser closed after comment workflow completion`);
                }
            }
            catch (error) {
                console.error(`[${run.id}] Error closing browser:`, error);
            }
            finally {
                activeBrowsers.delete(run.id);
            }
        }
    }
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
