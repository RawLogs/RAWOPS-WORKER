"use strict";
// packages/rawbot/src/yap/grow/handlers/wait.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWait = handleWait;
/**
 * Handle wait/delay action - uses WaitOps from rawops
 */
async function handleWait(params, handlerContext) {
    const { drivers } = handlerContext;
    if (!drivers)
        return;
    // Handle wait/delay actions
    if (params.min !== undefined && params.max !== undefined) {
        // Random delay: { action: "wait", min: 1000, max: 3000 }
        await drivers.wait.waitRandom(params.min, params.max);
    }
    else if (params.ms !== undefined) {
        // Fixed delay: { action: "wait", ms: 1500 }
        if (handlerContext.resolveVariable) {
            const delay = handlerContext.resolveVariable(params.ms);
            if (typeof delay === 'number') {
                await drivers.wait.waitWithDelay(delay);
            }
            else {
                await drivers.wait.waitWithDelay(1000);
            }
        }
        else {
            // Fallback: use value directly if it's a number
            const delay = typeof params.ms === 'number' ? params.ms : 1000;
            await drivers.wait.waitWithDelay(delay);
        }
    }
    else if (params.seconds !== undefined) {
        // Variable delay: { action: "wait", seconds: "{{delay_between_links}}" }
        if (handlerContext.resolveVariable) {
            const delay = handlerContext.resolveVariable(params.seconds);
            if (typeof delay === 'number') {
                await drivers.wait.waitWithDelay(delay * 1000);
            }
            else {
                await drivers.wait.waitWithDelay(1000);
            }
        }
        else {
            // Fallback: use value directly if it's a number
            const delay = typeof params.seconds === 'number' ? params.seconds * 1000 : 1000;
            await drivers.wait.waitWithDelay(delay);
        }
    }
}
