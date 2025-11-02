"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomMouseMovement = randomMouseMovement;
exports.advancedMouseMovement = advancedMouseMovement;
exports.curvedMouseMovement = curvedMouseMovement;
exports.simulateReadingBehavior = simulateReadingBehavior;
exports.generateMousePattern = generateMousePattern;
/**
 * Random mouse movement to simulate human behavior
 */
async function randomMouseMovement(driver) {
    try {
        const actions = driver.actions({ async: true });
        // Generate random mouse movement
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;
        await actions.move({
            x: offsetX,
            y: offsetY
        }).perform();
        await driver.sleep(100 + Math.random() * 200);
    }
    catch (error) {
        // Ignore mouse movement errors
    }
}
/**
 * Advanced mouse movement with pattern simulation
 */
async function advancedMouseMovement(driver, pattern = 'browsing') {
    try {
        const actions = driver.actions({ async: true });
        let offsetX, offsetY, duration;
        switch (pattern) {
            case 'reading':
                // Slow, deliberate movements
                offsetX = (Math.random() - 0.5) * 8;
                offsetY = (Math.random() - 0.5) * 4;
                duration = 200 + Math.random() * 300;
                break;
            case 'scanning':
                // Quick, jerky movements
                offsetX = (Math.random() - 0.5) * 25;
                offsetY = (Math.random() - 0.5) * 15;
                duration = 50 + Math.random() * 100;
                break;
            default: // browsing
                // Medium speed movements
                offsetX = (Math.random() - 0.5) * 15;
                offsetY = (Math.random() - 0.5) * 10;
                duration = 100 + Math.random() * 200;
        }
        await actions.move({
            x: offsetX,
            y: offsetY
        }).perform();
        await driver.sleep(duration);
    }
    catch (error) {
        // Ignore mouse movement errors
    }
}
/**
 * Simulate human-like mouse movement with curves
 */
async function curvedMouseMovement(driver, duration = 1000) {
    try {
        const actions = driver.actions({ async: true });
        const steps = Math.floor(duration / 50); // 50ms per step
        for (let i = 0; i < steps; i++) {
            const progress = i / steps;
            // Use sine wave for natural curve
            const curveX = Math.sin(progress * Math.PI) * 20;
            const curveY = Math.cos(progress * Math.PI * 0.5) * 10;
            // Add randomness
            const randomX = (Math.random() - 0.5) * 5;
            const randomY = (Math.random() - 0.5) * 3;
            await actions.move({
                x: curveX + randomX,
                y: curveY + randomY
            }).perform();
            await driver.sleep(50);
        }
    }
    catch (error) {
        // Ignore mouse movement errors
    }
}
/**
 * Simulate reading behavior with pauses
 */
async function simulateReadingBehavior(driver) {
    const behaviorPattern = Math.random();
    if (behaviorPattern < 0.15) {
        // Long pause as if reading carefully
        await driver.sleep(Math.random() * 1200 + 800);
    }
    else if (behaviorPattern < 0.25) {
        // Medium pause as if scanning
        await driver.sleep(Math.random() * 600 + 300);
    }
    else if (behaviorPattern < 0.35) {
        // Short pause as if checking something
        await driver.sleep(Math.random() * 300 + 150);
    }
}
/**
 * Generate realistic mouse movement pattern
 */
function generateMousePattern(progress, patternType) {
    let offsetX, offsetY;
    switch (patternType) {
        case 'reading':
            // Slow, deliberate movements
            offsetX = Math.sin(progress * Math.PI * 3) * 8 + Math.random() * 4 - 2;
            offsetY = Math.cos(progress * Math.PI * 2) * 4 + Math.random() * 2 - 1;
            break;
        case 'scanning':
            // Quick, jerky movements
            offsetX = Math.sin(progress * Math.PI * 8) * 15 + Math.random() * 8 - 4;
            offsetY = Math.cos(progress * Math.PI * 5) * 8 + Math.random() * 4 - 2;
            break;
        default: // browsing
            // Medium speed movements
            offsetX = Math.sin(progress * Math.PI * 5) * 12 + Math.random() * 6 - 3;
            offsetY = Math.cos(progress * Math.PI * 3) * 6 + Math.random() * 3 - 1.5;
    }
    return { offsetX, offsetY };
}
