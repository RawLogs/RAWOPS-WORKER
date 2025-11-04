"use strict";
// packages/rawbot/src/yap/grow/handlers/scroll.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleScrollStep = handleScrollStep;
exports.handleScrollRandom = handleScrollRandom;
/**
 * Handle scroll action - uses ScrollOps.scrollStep from rawops
 */
async function handleScrollStep(params, handlerContext) {
    const { drivers } = handlerContext;
    if (!drivers)
        return;
    await drivers.scroll.scrollStep({
        times: params.times,
        distance: params.distance,
        direction: params.direction || 'down',
        randomize: params.randomize !== false
    });
}
/**
 * Handle scroll random action - uses ScrollOps.scrollRandom from rawops
 */
async function handleScrollRandom(params, handlerContext) {
    const { drivers } = handlerContext;
    if (!drivers)
        return;
    const stepDelay = Array.isArray(params.step_delay) || Array.isArray(params.stepDelay)
        ? (Array.isArray(params.step_delay) ? params.step_delay : params.stepDelay)
        : (params.step_delay || params.stepDelay || 1000);
    await drivers.scroll.scrollRandom({
        minSteps: params.min_steps || params.minSteps || 1,
        maxSteps: params.max_steps || params.maxSteps || 3,
        direction: params.direction || 'down',
        stepDelay: stepDelay
    });
}
