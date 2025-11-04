"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// RAWOPS CORE AI Logo
function displayLogo() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║                    ██████╗  █████╗ ██╗    ██╗                 ║');
    console.log('║                    ██╔══██╗██╔══██╗██║    ██║                 ║');
    console.log('║                    ██████╔╝███████║██║ █╗ ██║                 ║');
    console.log('║                    ██╔══██╗██╔══██║██║███╗██║                 ║');
    console.log('║                    ██║  ██║██║  ██║╚███╔███╔╝                 ║');
    console.log('║                    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝                  ║');
    console.log('║                                                               ║');
    console.log('║                        🤖 RAWOPS WORKER 🤖                    ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('\n');
}
// Load environment variables first
const envPath = path_1.default.join(process.cwd(), '.env.local');
// Try different approaches to load env
try {
    const result = dotenv_1.default.config({ path: envPath, override: true });
    // Also try reading file directly
    const fs = require('fs');
    const envContent = fs.readFileSync(envPath, 'utf8');
    // Parse manually if dotenv fails
    if (!result.parsed || Object.keys(result.parsed).length === 0) {
        const lines = envContent.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=');
                    process.env[key] = value;
                    console.log(`Set ${key}=${value}`);
                }
            }
        }
    }
}
catch (error) {
    console.error('Error loading env file:', error);
}
function isNetworkError(error) {
    return error.code === 'ECONNRESET' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('socket hang up') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('timeout');
}
function calculateBackoffDelay(attempt, baseDelay = 1000, maxDelay = 5000) {
    return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
}
async function withRetry(operation, options = {}) {
    const { maxRetries = 3, timeout = 15000, retryOn4xx = false, throwOnFailure = true, operationName = 'Operation', on4xxError } = options;
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await operation();
            return result;
        }
        catch (error) {
            lastError = error;
            // Check if it's a network error
            const isNetwork = isNetworkError(error);
            // Handle 4xx errors
            if (error.response?.status >= 400 && error.response?.status < 500) {
                if (on4xxError) {
                    return on4xxError(error.response.status, error.response.data);
                }
                if (!retryOn4xx) {
                    throw new Error(`API returned status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
                }
            }
            // Retry on network errors or if retryOn4xx is true
            if ((isNetwork || retryOn4xx) && attempt < maxRetries) {
                const delay = calculateBackoffDelay(attempt);
                console.log(`[Worker] Retry ${attempt}/${maxRetries} for ${operationName} after ${delay}ms (${error.code || error.message})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            // If not retryable or last attempt, break
            break;
        }
    }
    // All retries failed
    if (throwOnFailure) {
        console.error(`[Worker] ❌ Failed ${operationName} after ${maxRetries} attempts:`, lastError?.message || lastError);
        throw new Error(`Failed ${operationName}: ${lastError?.message || 'Unknown error'}`);
    }
    return null;
}
// API service for communicating with the web application
class ApiService {
    constructor() {
        // Display logo first
        displayLogo();
        this.baseUrl = process.env.WEB_API_URL || '';
        this.apiKey = process.env.API_KEY || '';
        console.log('🔧 API Service initialized:');
        console.log('   📡 Base URL:', this.baseUrl);
        console.log('   🔑 API Key:', this.apiKey ? '✅ Present' : '❌ Not set');
        if (!this.apiKey) {
            console.warn('⚠️  API_KEY not found in environment variables!');
            console.warn('   Please create a .env file in the worker directory with:');
            console.warn('   API_KEY=rawops_your_api_key_here');
        }
    }
    // Get headers with API key authentication
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        return headers;
    }
    // Run operations
    async findAndLockQueuedRun() {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/runs/lock-next`, {}, {
                headers: this.getHeaders(),
                timeout: 10000, // 10 second timeout
                validateStatus: (status) => status < 500 // Don't throw for 4xx errors
            });
            return response.data;
        }
        catch (error) {
            // Handle specific connection errors
            if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.log('🔌 API connection lost - server may be down or restarting');
                console.log(`   Error: ${error.code} - ${error.message}`);
                console.log('   Worker will continue polling...');
                return null;
            }
            if (error.code === 'ETIMEDOUT') {
                console.log('⏱️  API request timeout - server may be overloaded');
                console.log('   Worker will continue polling...');
                return null;
            }
            // Handle axios errors
            if (error.response) {
                console.log(`📡 API responded with status ${error.response.status}: ${error.response.statusText}`);
                return null;
            }
            // Handle other errors
            console.error('❌ Unexpected error finding queued run:', error.message);
            return null;
        }
    }
    async updateRunStatus(runId, status, data) {
        try {
            const response = await axios_1.default.patch(`${this.baseUrl}/runs/${runId}`, {
                status,
                ...data
            }, {
                headers: this.getHeaders(),
                timeout: 10000,
                validateStatus: (status) => status < 500
            });
            return response.data;
        }
        catch (error) {
            // Handle connection errors gracefully
            if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.log(`🔌 API connection lost while updating run ${runId} - server may be down`);
                console.log(`   Error: ${error.code} - ${error.message}`);
                return null;
            }
            if (error.code === 'ETIMEDOUT') {
                console.log(`⏱️  API request timeout while updating run ${runId}`);
                return null;
            }
            console.error(`❌ Error updating run ${runId}:`, error.message);
            throw error;
        }
    }
    async stopRun(runId) {
        try {
            const response = await axios_1.default.patch(`${this.baseUrl}/runs/${runId}`, {
                status: 'STOPPED'
            }, {
                headers: this.getHeaders(),
                timeout: 10000,
                validateStatus: (status) => status < 500
            });
            return response.data;
        }
        catch (error) {
            // Handle connection errors gracefully
            if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.log(`🔌 API connection lost while stopping run ${runId} - server may be down`);
                console.log(`   Error: ${error.code} - ${error.message}`);
                return null;
            }
            if (error.code === 'ETIMEDOUT') {
                console.log(`⏱️  API request timeout while stopping run ${runId}`);
                return null;
            }
            console.error(`❌ Error stopping run ${runId}:`, error.message);
            return null;
        }
    }
    // Project operations
    async getUserProjectSettings(projectId, profileId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/projects/${projectId}/users/${profileId}/settings`, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting user project settings:', error);
            return null;
        }
    }
    async getProject(projectId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/projects/${projectId}`, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting project:', error);
            return null;
        }
    }
    async getUserInteractionRules(profileId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/user/interaction-rules?profileId=${profileId}`, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting user interaction rules:', error);
            return null;
        }
    }
    async getUserCommentSettings(profileId, retries = 3) {
        return withRetry(async () => {
            const response = await axios_1.default.get(`${this.baseUrl}/user/comment-settings?profileId=${profileId}`, {
                headers: this.getHeaders(),
                timeout: 15000,
                validateStatus: (status) => status < 500
            });
            if (response.status >= 200 && response.status < 300) {
                return response.data;
            }
            // Throw for non-2xx responses to trigger retry logic
            throw { response };
        }, {
            maxRetries: retries,
            operationName: 'getUserCommentSettings',
            throwOnFailure: true
        });
    }
    async getUserGrowSettings(profileId, retries = 3) {
        return withRetry(async () => {
            const response = await axios_1.default.get(`${this.baseUrl}/user/grow-settings?profileId=${profileId}`, {
                headers: this.getHeaders(),
                timeout: 15000,
                validateStatus: (status) => status < 500
            });
            if (response.status >= 200 && response.status < 300) {
                return response.data;
            }
            // Throw for non-2xx responses to trigger retry logic
            throw { response };
        }, {
            maxRetries: retries,
            operationName: 'getUserGrowSettings',
            throwOnFailure: true
        });
    }
    async getUserApiKey(userId, retries = 3) {
        const currentUserId = userId; // Capture userId for closure
        return withRetry(async () => {
            const response = await axios_1.default.get(`${this.baseUrl}/user/api-key`, {
                headers: this.getHeaders(),
                timeout: 15000,
                validateStatus: (status) => status < 500
            });
            if (response.status >= 200 && response.status < 300) {
                return response.data;
            }
            // Throw for non-2xx responses to trigger retry logic
            throw { response };
        }, {
            maxRetries: retries,
            operationName: 'getUserApiKey',
            throwOnFailure: true,
            on4xxError: (status) => {
                // 4xx means API key not found - return null instead of throwing
                console.log(`[Worker] API key not found for user ${currentUserId} (status ${status})`);
                return null;
            }
        });
    }
    async getUserPromptSettings(profileId, type = 'COMMENT', retries = 3) {
        return withRetry(async () => {
            const response = await axios_1.default.get(`${this.baseUrl}/user/prompt-settings?profileId=${profileId}&type=${type}`, {
                headers: this.getHeaders(),
                timeout: 15000
            });
            return response.data;
        }, {
            maxRetries: retries,
            operationName: 'getUserPromptSettings',
            throwOnFailure: true
        });
    }
    async getRunStatus(runId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/runs/${runId}`, {
                headers: this.getHeaders(),
                timeout: 10000,
                validateStatus: (status) => status < 500
            });
            return response.data;
        }
        catch (error) {
            // Handle connection errors gracefully
            if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.log(`🔌 API connection lost while getting run status ${runId} - server may be down`);
                console.log(`   Error: ${error.code} - ${error.message}`);
                return null;
            }
            if (error.code === 'ETIMEDOUT') {
                console.log(`⏱️  API request timeout while getting run status ${runId}`);
                return null;
            }
            console.error(`❌ Error getting run status ${runId}:`, error.message);
            return null;
        }
    }
    // Profile operations
    async getProfiles() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/profiles`, {
                headers: this.getHeaders(),
                timeout: 10000,
                validateStatus: (status) => status < 500
            });
            return response.data;
        }
        catch (error) {
            // Handle connection errors gracefully
            if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.log(`🔌 API connection lost while getting profiles - server may be down`);
                console.log(`   Error: ${error.code} - ${error.message}`);
                return null;
            }
            if (error.code === 'ETIMEDOUT') {
                console.log(`⏱️  API request timeout while getting profiles`);
                return null;
            }
            console.error(`❌ Error getting profiles:`, error.message);
            return null;
        }
    }
}
exports.default = ApiService;
