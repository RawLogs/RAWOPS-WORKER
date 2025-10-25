"use strict";
// packages/rawbot/src/flows/BaseFlow.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseFlow = void 0;
class BaseFlow {
    constructor(config) {
        this.config = config;
        this.driver = null;
        this.status = 'idle';
        this.results = null;
    }
    initialize(driver) {
        this.driver = driver;
        this.status = 'idle';
    }
    async cleanup() {
        this.status = 'idle';
        this.results = null;
    }
    getStatus() {
        return this.status;
    }
    getResults() {
        return this.results;
    }
    async executeWithRetry(operation, operationName) {
        const maxRetries = this.config.retries || 3;
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[BaseFlow] ${operationName} - Attempt ${attempt}/${maxRetries}`);
                return await operation();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                console.warn(`[BaseFlow] ${operationName} failed on attempt ${attempt}:`, lastError.message);
                if (attempt < maxRetries) {
                    const delay = this.config.delay || 1000;
                    await this.driver.sleep(delay * attempt);
                }
            }
        }
        throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
    }
    async waitForDelay() {
        if (this.config.delay) {
            await this.driver.sleep(this.config.delay);
        }
    }
}
exports.BaseFlow = BaseFlow;
//# sourceMappingURL=BaseFlow.js.map