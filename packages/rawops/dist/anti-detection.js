"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntiDetectionIntegration = exports.BEHAVIORAL_PATTERNS = void 0;
exports.createAntiDetection = createAntiDetection;
exports.quickScrollWithMouse = quickScrollWithMouse;
exports.quickClickWithMouse = quickClickWithMouse;
exports.simulateBrowsingSession = simulateBrowsingSession;
const selenium_webdriver_1 = require("selenium-webdriver");
/**
 * Predefined behavioral patterns for different scenarios
 */
exports.BEHAVIORAL_PATTERNS = {
    reading: {
        name: 'reading',
        mouseIntensity: 0.3,
        pauseProbability: 0.4,
        microMovementFrequency: 0.8,
        scrollSpeed: 0.5,
        clickDelay: 800
    },
    browsing: {
        name: 'browsing',
        mouseIntensity: 0.6,
        pauseProbability: 0.2,
        microMovementFrequency: 0.6,
        scrollSpeed: 0.8,
        clickDelay: 400
    },
    scanning: {
        name: 'scanning',
        mouseIntensity: 0.8,
        pauseProbability: 0.1,
        microMovementFrequency: 0.4,
        scrollSpeed: 1.2,
        clickDelay: 200
    },
    casual: {
        name: 'casual',
        mouseIntensity: 0.5,
        pauseProbability: 0.3,
        microMovementFrequency: 0.7,
        scrollSpeed: 0.7,
        clickDelay: 500
    },
    focused: {
        name: 'focused',
        mouseIntensity: 0.4,
        pauseProbability: 0.15,
        microMovementFrequency: 0.5,
        scrollSpeed: 0.6,
        clickDelay: 300
    }
};
class AntiDetectionIntegration {
    constructor(driver, initialPattern = 'browsing') {
        this.driver = driver;
        this.currentPattern = exports.BEHAVIORAL_PATTERNS[initialPattern] || exports.BEHAVIORAL_PATTERNS.browsing;
        this.sessionStartTime = Date.now();
        this.interactionCount = 0;
    }
    /**
     * Switch behavioral pattern dynamically
     */
    switchPattern(patternName) {
        this.currentPattern = exports.BEHAVIORAL_PATTERNS[patternName] || this.currentPattern;
        console.log(`[AntiDetection] Switched to ${this.currentPattern.name} pattern`);
    }
    /**
     * Get current behavioral pattern
     */
    getCurrentPattern() {
        return this.currentPattern;
    }
    /**
     * Enhanced mouse movement with realistic human behavior simulation
     */
    async simulateMouseMovement(options = {}) {
        const { pattern = this.currentPattern.name, intensity = 'medium', duration = 1000, includeMicroMovements = true, includePauses = true } = options;
        const behavioralPattern = exports.BEHAVIORAL_PATTERNS[pattern] || this.currentPattern;
        const intensityMultiplier = intensity === 'low' ? 0.5 : intensity === 'high' ? 1.5 : 1;
        try {
            const actions = this.driver.actions({ async: true });
            const steps = Math.floor(duration / 50); // 50ms per step
            for (let i = 0; i < steps; i++) {
                const progress = i / steps;
                // Generate movement based on behavioral pattern
                const movement = this.generateMovementPattern(progress, behavioralPattern, intensityMultiplier);
                // Add micro-movements for more realistic behavior
                if (includeMicroMovements && Math.random() < behavioralPattern.microMovementFrequency) {
                    const microX = (Math.random() - 0.5) * 3;
                    const microY = (Math.random() - 0.5) * 3;
                    movement.offsetX += microX;
                    movement.offsetY += microY;
                }
                await actions.move({
                    x: movement.offsetX,
                    y: movement.offsetY
                }).perform();
                // Simulate reading pauses
                if (includePauses && Math.random() < behavioralPattern.pauseProbability) {
                    const pauseDuration = this.calculatePauseDuration(behavioralPattern);
                    await this.driver.sleep(pauseDuration);
                }
                await this.driver.sleep(50);
            }
        }
        catch (error) {
            // Ignore mouse movement errors
        }
    }
    /**
     * Enhanced scroll with integrated mouse movement - improved smoothness
     */
    async scrollWithMouseMovement(options = {}) {
        const { scrollAmount = 800, // Increased default scroll amount
        steps = 12, // Increased steps for smoother scroll
        direction = 'down', smoothness = 'high', // Default to high smoothness
        pattern = this.currentPattern.name, intensity = 'medium', includeMicroMovements = true, includePauses = true } = options;
        const behavioralPattern = exports.BEHAVIORAL_PATTERNS[pattern] || this.currentPattern;
        const smoothnessMultiplier = smoothness === 'low' ? 0.3 : smoothness === 'high' ? 0.8 : 0.5;
        console.log(`[AntiDetection] Scrolling with ${behavioralPattern.name} pattern (${scrollAmount}px, ${steps} steps)`);
        // Enable smooth scrolling with better CSS
        await this.driver.executeScript(`
      const style = document.createElement('style');
      style.textContent = \`
        html, body { 
          scroll-behavior: smooth !important; 
          scroll-padding: 0 !important;
        }
        * { 
          scroll-behavior: smooth !important; 
        }
      \`;
      document.head.appendChild(style);
    `);
        // Calculate step amount with random minimum threshold
        const minStepAmount = 40 + Math.random() * 30; // Random 40-70px per step
        const stepAmount = Math.max(minStepAmount, scrollAmount / steps);
        const actualSteps = Math.ceil(scrollAmount / stepAmount);
        // Improved step delay calculation with random base delay
        const baseDelay = 60 + Math.random() * 40; // Random 60-100ms base delay
        const stepDelay = baseDelay * smoothnessMultiplier * behavioralPattern.scrollSpeed;
        console.log(`[AntiDetection] Scroll details: ${stepAmount}px per step, ${actualSteps} steps, ${stepDelay}ms delay`);
        for (let i = 0; i < actualSteps; i++) {
            const progress = i / actualSteps;
            // Calculate scroll direction
            let currentScrollAmount = stepAmount;
            if (direction === 'random') {
                currentScrollAmount *= Math.random() > 0.5 ? 1 : -1;
            }
            else if (direction === 'up') {
                currentScrollAmount *= -1;
            }
            // Add natural variation to scroll amount (reduced variation for smoother scroll)
            const variation = 0.9 + Math.random() * 0.2; // 90% to 110% of base amount
            currentScrollAmount *= variation;
            // Use requestAnimationFrame for smoother scrolling
            await this.driver.executeScript(`
        return new Promise((resolve) => {
          requestAnimationFrame(() => {
            window.scrollBy({
              top: ${currentScrollAmount},
              left: 0,
              behavior: 'smooth'
            });
            setTimeout(resolve, ${stepDelay});
          });
        });
      `);
            // Reduced mouse movement during scroll for smoother experience
            if (i % 2 === 0) { // Only every other step to reduce lag
                await this.simulateMouseMovement({
                    pattern,
                    intensity: 'low', // Reduced intensity
                    duration: stepDelay * 0.5, // Reduced duration
                    includeMicroMovements: false, // Disabled during scroll
                    includePauses: false
                });
            }
            // Reduced pause frequency for smoother scroll
            if (behavioralPattern.name === 'reading' && Math.random() < 0.1) {
                await this.driver.sleep(Math.random() * 200 + 100);
            }
        }
        // Final smooth scroll to ensure completion
        await this.driver.executeScript(`
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          window.scrollBy({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
          setTimeout(resolve, 100);
        });
      });
    `);
        this.interactionCount++;
    }
    /**
     * Enhanced click with integrated mouse movement and hover simulation
     */
    async clickWithMouseMovement(element, options = {}) {
        const { hoverDuration = 300, clickDelay = 200, includeHover = true, pattern = this.currentPattern.name, intensity = 'medium', includeMicroMovements = true, includePauses = true } = options;
        const behavioralPattern = exports.BEHAVIORAL_PATTERNS[pattern] || this.currentPattern;
        try {
            let targetElement;
            let selectorString = null;
            if (typeof element === 'string') {
                selectorString = element;
                targetElement = await this.driver.findElement(selenium_webdriver_1.By.css(element));
            }
            else {
                targetElement = element;
                // Try to get selector from element if possible (for retry)
                try {
                    const elementId = await targetElement.getId();
                    // Store element reference for potential retry
                }
                catch (e) {
                    // Cannot get selector, will retry with element
                }
            }
            // Scroll element into view with mouse movement
            await this.scrollToElementWithMouse(targetElement);
            // Simulate approach movement
            await this.simulateApproachMovement(targetElement, behavioralPattern);
            // Hover simulation with mouse movement
            if (includeHover) {
                await this.simulateHoverWithMovement(targetElement, {
                    duration: hoverDuration * behavioralPattern.clickDelay / 500,
                    pattern,
                    intensity,
                    includeMicroMovements,
                    includePauses
                });
            }
            // Pre-click micro-movements
            await this.simulateMouseMovement({
                pattern,
                intensity: 'low',
                duration: clickDelay,
                includeMicroMovements: true,
                includePauses: false
            });
            // Perform click with retry for stale element
            try {
                await targetElement.click();
            }
            catch (clickError) {
                // If stale element error and we have selector, retry by finding element again
                if (clickError.name === 'StaleElementReferenceError' ||
                    clickError.message?.includes('stale element') ||
                    clickError.message?.includes('StaleElementReference')) {
                    console.log('[AntiDetection] Element stale, attempting to find and click again...');
                    // If we have selector string, use it to find element again
                    if (selectorString) {
                        try {
                            targetElement = await this.driver.findElement(selenium_webdriver_1.By.css(selectorString));
                            // Verify element is still valid
                            await targetElement.isDisplayed();
                            // Try click again
                            await targetElement.click();
                        }
                        catch (retryError) {
                            console.error('[AntiDetection] Retry click failed:', retryError);
                            throw retryError;
                        }
                    }
                    else {
                        // No selector available, throw original error
                        throw clickError;
                    }
                }
                else {
                    throw clickError;
                }
            }
            // Post-click behavior
            await this.simulatePostClickBehavior(behavioralPattern);
            this.interactionCount++;
            return true;
        }
        catch (error) {
            console.error('[AntiDetection] Click failed:', error);
            return false;
        }
    }
    /**
     * Scroll to element with integrated mouse movement
     */
    async scrollToElementWithMouse(element) {
        try {
            // Get element position
            const rect = await this.driver.executeScript(`
        const element = arguments[0];
        const rect = element.getBoundingClientRect();
        return {
          top: rect.top,
          left: rect.left,
          height: rect.height,
          width: rect.width
        };
      `, element);
            // Calculate scroll amount needed
            const viewportHeight = await this.driver.executeScript('return window.innerHeight;');
            const scrollAmount = rect.top - (viewportHeight / 2);
            if (Math.abs(scrollAmount) > 50) {
                await this.scrollWithMouseMovement({
                    scrollAmount: Math.abs(scrollAmount),
                    direction: scrollAmount > 0 ? 'down' : 'up',
                    steps: Math.max(3, Math.floor(Math.abs(scrollAmount) / 100)),
                    pattern: this.currentPattern.name
                });
            }
        }
        catch (error) {
            // Fallback to simple scroll
            await this.driver.executeScript(`
        arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      `, element);
        }
    }
    /**
     * Simulate approach movement before clicking
     */
    async simulateApproachMovement(element, pattern) {
        try {
            const actions = this.driver.actions({ async: true });
            // Get element center position
            const elementRect = await this.driver.executeScript(`
        const element = arguments[0];
        const rect = element.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      `, element);
            // Generate approach path
            const steps = 3 + Math.floor(Math.random() * 3);
            const startX = elementRect.x + (Math.random() - 0.5) * 100;
            const startY = elementRect.y + (Math.random() - 0.5) * 100;
            for (let i = 0; i < steps; i++) {
                const progress = i / steps;
                const currentX = startX + (elementRect.x - startX) * progress;
                const currentY = startY + (elementRect.y - startY) * progress;
                // Add natural curve
                const curveOffset = Math.sin(progress * Math.PI) * 20;
                await actions.move({
                    x: currentX - elementRect.x + curveOffset,
                    y: currentY - elementRect.y
                }).perform();
                await this.driver.sleep(50 + Math.random() * 100);
            }
        }
        catch (error) {
            // Ignore approach movement errors
        }
    }
    /**
     * Simulate hover with mouse movement
     */
    async simulateHoverWithMovement(element, options) {
        const { duration = 300 } = options;
        try {
            const actions = this.driver.actions({ async: true });
            // Move to element
            await actions.move({ origin: element }).perform();
            // Simulate hover movements
            await this.simulateMouseMovement({
                ...options,
                duration,
                intensity: 'low'
            });
        }
        catch (error) {
            // Ignore hover errors
        }
    }
    /**
     * Simulate post-click behavior
     */
    async simulatePostClickBehavior(pattern) {
        try {
            // Brief pause after click
            await this.driver.sleep(pattern.clickDelay + Math.random() * 200);
            // Small mouse movement away from click point
            if (Math.random() < 0.7) {
                await this.simulateMouseMovement({
                    pattern: pattern.name,
                    intensity: 'low',
                    duration: 200,
                    includeMicroMovements: true,
                    includePauses: false
                });
            }
        }
        catch (error) {
            // Ignore post-click errors
        }
    }
    /**
     * Generate movement pattern based on behavioral pattern
     */
    generateMovementPattern(progress, pattern, intensityMultiplier) {
        let offsetX, offsetY;
        switch (pattern.name) {
            case 'reading':
                // Slow, deliberate movements with reading pauses
                offsetX = Math.sin(progress * Math.PI * 2) * 8 * pattern.mouseIntensity * intensityMultiplier;
                offsetY = Math.cos(progress * Math.PI * 1.5) * 4 * pattern.mouseIntensity * intensityMultiplier;
                break;
            case 'scanning':
                // Quick, jerky movements
                offsetX = Math.sin(progress * Math.PI * 6) * 15 * pattern.mouseIntensity * intensityMultiplier;
                offsetY = Math.cos(progress * Math.PI * 4) * 8 * pattern.mouseIntensity * intensityMultiplier;
                break;
            case 'casual':
                // Relaxed, natural movements
                offsetX = Math.sin(progress * Math.PI * 3) * 10 * pattern.mouseIntensity * intensityMultiplier;
                offsetY = Math.cos(progress * Math.PI * 2) * 6 * pattern.mouseIntensity * intensityMultiplier;
                break;
            case 'focused':
                // Precise, controlled movements
                offsetX = Math.sin(progress * Math.PI * 4) * 6 * pattern.mouseIntensity * intensityMultiplier;
                offsetY = Math.cos(progress * Math.PI * 3) * 4 * pattern.mouseIntensity * intensityMultiplier;
                break;
            default: // browsing
                // Medium speed movements
                offsetX = Math.sin(progress * Math.PI * 4) * 12 * pattern.mouseIntensity * intensityMultiplier;
                offsetY = Math.cos(progress * Math.PI * 2.5) * 6 * pattern.mouseIntensity * intensityMultiplier;
        }
        // Add randomness
        offsetX += (Math.random() - 0.5) * 4;
        offsetY += (Math.random() - 0.5) * 3;
        return { offsetX, offsetY };
    }
    /**
     * Calculate pause duration based on behavioral pattern
     */
    calculatePauseDuration(pattern) {
        const basePause = pattern.name === 'reading' ? 800 :
            pattern.name === 'scanning' ? 200 : 400;
        return basePause + Math.random() * 400;
    }
    /**
     * Get session statistics
     */
    getSessionStats() {
        const duration = Date.now() - this.sessionStartTime;
        const avgInterval = this.interactionCount > 0 ? duration / this.interactionCount : 0;
        return {
            duration,
            interactions: this.interactionCount,
            pattern: this.currentPattern.name,
            avgInteractionInterval: avgInterval
        };
    }
    /**
     * Reset session statistics
     */
    resetSession() {
        this.sessionStartTime = Date.now();
        this.interactionCount = 0;
    }
}
exports.AntiDetectionIntegration = AntiDetectionIntegration;
/**
 * Utility functions for easy integration
 */
/**
 * Create anti-detection instance with default settings
 */
function createAntiDetection(driver, pattern = 'browsing') {
    return new AntiDetectionIntegration(driver, pattern);
}
/**
 * Quick scroll with mouse movement
 */
async function quickScrollWithMouse(driver, options = {}) {
    const antiDetection = new AntiDetectionIntegration(driver, options.pattern);
    await antiDetection.scrollWithMouseMovement(options);
}
/**
 * Quick click with mouse movement
 */
async function quickClickWithMouse(driver, element, options = {}) {
    const antiDetection = new AntiDetectionIntegration(driver, options.pattern);
    return await antiDetection.clickWithMouseMovement(element, options);
}
/**
 * Simulate realistic browsing session
 */
async function simulateBrowsingSession(driver, actions, pattern = 'browsing') {
    const antiDetection = new AntiDetectionIntegration(driver, pattern);
    for (const action of actions) {
        // Random delay between actions
        const delay = Math.random() * 2000 + 1000;
        await driver.sleep(delay);
        // Simulate mouse movement before action
        await antiDetection.simulateMouseMovement({
            pattern,
            duration: Math.random() * 1000 + 500
        });
        // Execute action
        await action();
        // Simulate post-action behavior
        await antiDetection.simulateMouseMovement({
            pattern,
            duration: Math.random() * 500 + 200
        });
    }
}
