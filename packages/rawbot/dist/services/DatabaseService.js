"use strict";
// packages/rawbot/src/services/DatabaseService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
// Database service for rawbot packages to communicate with web API
class DatabaseService {
    constructor() {
        this.baseUrl = process.env.WEB_API_URL || 'http://localhost:3000/api';
        this.apiKey = process.env.API_KEY || null;
        console.log('DatabaseService initialized:');
        console.log('- Base URL:', this.baseUrl);
        console.log('- API Key:', this.apiKey ? 'Present' : 'Not set');
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
    // TargetUser operations
    async findTargetUser(id) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/targets/${id}`, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('Error finding target user:', error);
            return null;
        }
    }
    async upsertTargetUser(data) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/targets`, data, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            if (error.response) {
                console.log('❌ Target user upsert failed:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            else {
                console.log('❌ Target user upsert failed:', error.message);
            }
            throw error;
        }
    }
    // Tweet operations
    async upsertTweet(data) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/tweets`, data, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            if (error.response) {
                console.log('❌ Tweet upsert failed:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            else {
                console.log('❌ Tweet upsert failed:', error.message);
            }
            throw error;
        }
    }
    // Profile operations
    async upsertProfile(data) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/profiles`, data, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            if (error.response) {
                console.log('❌ Profile upsert failed:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            else {
                console.log('❌ Profile upsert failed:', error.message);
            }
            throw error;
        }
    }
    // Interaction operations
    async createInteraction(data) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/interactions`, data, {
                headers: this.getHeaders()
            });
            console.log('✅ Interaction created');
            return response.data;
        }
        catch (error) {
            if (error.response) {
                console.log(`❌ Interaction failed: ${error.response.status} ${JSON.stringify(error.response.data)}`);
            }
            else {
                console.log(`❌ Interaction failed: ${error.message}`);
            }
            throw error;
        }
    }
    // Project operations
    async findProject(id) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/projects/${id}`, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('Error finding project:', error);
            return null;
        }
    }
}
// Create a singleton instance
const db = new DatabaseService();
exports.default = db;
