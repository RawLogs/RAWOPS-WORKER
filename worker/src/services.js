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
    async getUserCommentSettings(profileId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/user/comment-settings?profileId=${profileId}`, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting user comment settings:', error);
            return null;
        }
    }
    async getUserGrowSettings(profileId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/user/grow-settings?profileId=${profileId}`, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting user grow settings:', error);
            return null;
        }
    }
    async getUserApiKey(userId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/user/api-key`, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting user API key:', error);
            return null;
        }
    }
    async getUserPromptSettings(profileId, type = 'COMMENT', retries = 3) {
        let lastError = null;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await axios_1.default.get(`${this.baseUrl}/user/prompt-settings?profileId=${profileId}&type=${type}`, {
                    headers: this.getHeaders(),
                    timeout: 15000
                });
                return response.data;
            }
            catch (error) {
                lastError = error;
                const isNetworkError = error.code === 'ECONNRESET' ||
                    error.code === 'ECONNREFUSED' ||
                    error.code === 'ENOTFOUND' ||
                    error.code === 'ETIMEDOUT' ||
                    error.message?.includes('socket hang up');
                if (isNetworkError && attempt < retries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff: 1s, 2s, 4s (max 5s)
                    console.log(`[Worker] Retry ${attempt}/${retries} for getUserPromptSettings after ${delay}ms (${error.code || error.message})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                // If not network error or last attempt, break and throw
                break;
            }
        }
        // All retries failed - throw error
        console.error(`[Worker] ❌ Failed to get user prompt settings after ${retries} attempts:`, lastError?.message || lastError);
        throw new Error(`Failed to load prompt settings: ${lastError?.message || 'Unknown error'}`);
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
