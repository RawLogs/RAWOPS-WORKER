"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrollOps = void 0;
exports.smoothRandomScroll = smoothRandomScroll;
const base_1 = require("./base");
class ScrollOps extends base_1.BaseOps {
    constructor(driver) {
        super(driver);
    }
    /**
     * Smooth scroll with customizable options and anti-detection
     */
    async smoothScrollWithResult(options = {}) {
        try {
            const { duration = 2000, speed = 50, direction = 'down', steps = 20, target = 'page', scrollAmount = 800, // Default scroll amount
            smoothness = 'high', // Default to high smoothness
            useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium' } = options;
            // Switch behavioral pattern if specified
            if (behavioralPattern !== this.antiDetection.getCurrentPattern().name) {
                this.antiDetection.switchPattern(behavioralPattern);
            }
            if (useAntiDetection) {
                // Use anti-detection scroll with mouse movement
                const actualScrollAmount = scrollAmount || (direction === 'down' ? 800 : -800);
                await this.antiDetection.scrollWithMouseMovement({
                    scrollAmount: actualScrollAmount,
                    steps,
                    direction,
                    smoothness,
                    pattern: behavioralPattern,
                    intensity: mouseIntensity,
                    includeMicroMovements: true,
                    includePauses: true
                });
            }
            else {
                // Legacy scroll without anti-detection
                const stepDelay = duration / steps;
                const scrollAmount = direction === 'down' ? 100 : -100;
                // Use smooth scrolling with CSS animation
                await this.driver.executeScript(`
          // Add smooth scrolling CSS
          const style = document.createElement('style');
          style.textContent = 'html { scroll-behavior: smooth !important; }';
          document.head.appendChild(style);
        `);
                for (let i = 0; i < steps; i++) {
                    if (target === 'tweets') {
                        // Smooth scroll to load more tweets
                        await this.driver.executeScript(`
              window.scrollBy({
                top: 100,
                left: 0,
                behavior: 'smooth'
              });
            `);
                    }
                    else {
                        // Smooth regular page scroll
                        await this.driver.executeScript(`
              window.scrollBy({
                top: ${scrollAmount},
                left: 0,
                behavior: 'smooth'
              });
            `);
                    }
                    await this.driver.sleep(stepDelay);
                }
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error scrolling: ${error}` };
        }
    }
    /**
     * Scroll to load more tweets with anti-detection
     */
    async scrollToLoadTweets(options = {}) {
        try {
            const { duration = 2000, steps = 8, useAntiDetection = true, behavioralPattern = 'browsing', mouseIntensity = 'medium' } = options;
            // Switch behavioral pattern if specified
            if (behavioralPattern !== this.antiDetection.getCurrentPattern().name) {
                this.antiDetection.switchPattern(behavioralPattern);
            }
            // Enable smooth scrolling
            await this.driver.executeScript(`
        const style = document.createElement('style');
        style.textContent = 'html { scroll-behavior: smooth !important; }';
        document.head.appendChild(style);
      `);
            // Get current tweet count
            const initialTweetCount = await this.driver.executeScript(`
        return document.querySelectorAll('article[data-testid="tweet"]').length;
      `);
            console.log(`[ScrollOps] Initial tweet count: ${initialTweetCount}`);
            if (useAntiDetection) {
                // Use anti-detection scroll with mouse movement
                await this.antiDetection.scrollWithMouseMovement({
                    scrollAmount: 300,
                    steps,
                    direction: 'down',
                    smoothness: 'medium',
                    pattern: behavioralPattern,
                    intensity: mouseIntensity,
                    includeMicroMovements: true,
                    includePauses: true
                });
            }
            else {
                // Legacy scroll without anti-detection
                // Calculate base step delay
                const baseStepDelay = duration / steps;
                for (let i = 0; i < steps; i++) {
                    // Calculate scroll amount based on visible articles
                    const scrollAmount = await this.driver.executeScript(`
            const articles = document.querySelectorAll('article[data-testid="tweet"]');
            if (articles.length === 0) return 300; // Fallback
            
            // Find the last visible article
            let lastVisibleArticle = null;
            for (let j = articles.length - 1; j >= 0; j--) {
              const rect = articles[j].getBoundingClientRect();
              if (rect.top < window.innerHeight && rect.bottom > 0) {
                lastVisibleArticle = articles[j];
                break;
              }
            }
            
            if (lastVisibleArticle) {
              // Scroll to show next article (half article height)
              const articleHeight = lastVisibleArticle.getBoundingClientRect().height;
              return Math.max(articleHeight * 0.8, 200); // At least 300px
            }
            
            return 300; // Fallback
          `);
                    console.log(`[ScrollOps] Step ${i + 1}: Scrolling ${scrollAmount}px`);
                    // Scroll by calculated amount
                    await this.driver.executeScript(`
            window.scrollBy({
              top: ${scrollAmount},
              left: 0,
              behavior: 'smooth'
            });
          `);
                    // Random delay between scrolls (1000-5000ms)
                    const randomDelay = Math.random() * 2000 + 500; // 500-2500ms
                    console.log(`[ScrollOps] Step ${i + 1}: Waiting ${Math.round(randomDelay)}ms`);
                    await this.driver.sleep(randomDelay);
                    // Check if new tweets loaded after each step
                    const currentTweetCount = await this.driver.executeScript(`
            return document.querySelectorAll('article[data-testid="tweet"]').length;
          `);
                    if (currentTweetCount > initialTweetCount) {
                        console.log(`[ScrollOps] New tweets detected after step ${i + 1}: ${currentTweetCount - initialTweetCount} new tweets`);
                        break; // Stop scrolling if new tweets loaded
                    }
                }
            }
            // Final check
            const finalTweetCount = await this.driver.executeScript(`
        return document.querySelectorAll('article[data-testid="tweet"]').length;
      `);
            console.log(`[ScrollOps] Final tweet count: ${finalTweetCount} (${finalTweetCount - initialTweetCount} new tweets)`);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error scrolling to load tweets: ${error}` };
        }
    }
    /**
     * Scroll to specific element
     */
    async scrollToElement(selector) {
        try {
            await this.driver.executeScript(`
        const element = document.querySelector('${selector}');
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      `);
            await this.randomDelay(1000, 2000);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error scrolling to element: ${error}` };
        }
    }
    /**
     * Scroll to top of page
     */
    async scrollToTop() {
        try {
            await this.driver.executeScript(`
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      `);
            await this.randomDelay(1000, 2000);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error scrolling to top: ${error}` };
        }
    }
    /**
     * Scroll to bottom of page
     */
    async scrollToBottom() {
        try {
            await this.driver.executeScript(`
        window.scrollTo({
          top: document.body.scrollHeight,
          left: 0,
          behavior: 'smooth'
        });
      `);
            await this.randomDelay(1000, 2000);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error scrolling to bottom: ${error}` };
        }
    }
    /**
     * Random scroll pattern to mimic human behavior
     */
    async randomScroll(options = {}) {
        try {
            const { duration = 10000, steps = 20 } = options;
            const stepDelay = duration / steps;
            // Enable smooth scrolling
            await this.driver.executeScript(`
        const style = document.createElement('style');
        style.textContent = 'html { scroll-behavior: smooth !important; }';
        document.head.appendChild(style);
      `);
            for (let i = 0; i < steps; i++) {
                // Random scroll amount and direction
                const scrollAmount = Math.floor(Math.random() * 200) + 50;
                const direction = Math.random() > 0.7 ? -1 : 1; // 30% chance to scroll up
                await this.driver.executeScript(`
          window.scrollBy({
            top: ${scrollAmount * direction},
            left: 0,
            behavior: 'smooth'
          });
        `);
                // Random pause between scrolls
                const pauseTime = Math.random() * 1000 + 500;
                await this.driver.sleep(pauseTime);
                // Random mouse movement
                if (Math.random() < 0.3) {
                    await this.randomMouseMovement();
                }
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error in random scroll: ${error}` };
        }
    }
    /**
     * Scroll to specific tweet by index
     */
    async scrollToTweet(index) {
        try {
            await this.driver.executeScript(`
        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        if (tweets[${index}]) {
          tweets[${index}].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      `);
            await this.randomDelay(1000, 2000);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Error scrolling to tweet: ${error}` };
        }
    }
    /**
     * Infinite scroll until no more content
     */
    async infiniteScroll(options = {}) {
        try {
            const { maxScrolls = 10, delayBetweenScrolls = 2000 } = options;
            let previousHeight = 0;
            let scrollCount = 0;
            // Enable smooth scrolling
            await this.driver.executeScript(`
        const style = document.createElement('style');
        style.textContent = 'html { scroll-behavior: smooth !important; }';
        document.head.appendChild(style);
      `);
            while (scrollCount < maxScrolls) {
                // Get current page height
                const currentHeight = await this.driver.executeScript('return document.body.scrollHeight;');
                // Smooth scroll down
                await this.driver.executeScript(`
          window.scrollTo({
            top: document.body.scrollHeight,
            left: 0,
            behavior: 'smooth'
          });
        `);
                await this.driver.sleep(delayBetweenScrolls);
                // Check if new content loaded
                const newHeight = await this.driver.executeScript('return document.body.scrollHeight;');
                if (newHeight === previousHeight) {
                    // No new content loaded, break
                    break;
                }
                previousHeight = newHeight;
                scrollCount++;
            }
            return { success: true, data: { scrollCount } };
        }
        catch (error) {
            return { success: false, error: `Error in infinite scroll: ${error}` };
        }
    }
}
exports.ScrollOps = ScrollOps;
// Standalone smooth random scroll function (moved from selenium-utils.ts)
async function smoothRandomScroll(driver, duration = 10000) {
    console.log("Starting smooth animation scroll to avoid spam detection...");
    // Generate random scroll pattern for this session
    const patternType = Math.random();
    let scrollSteps, easingType, mousePattern;
    if (patternType < 0.3) {
        // Reading pattern - slower, more pauses
        scrollSteps = 5; // Much slower
        easingType = "slow";
        mousePattern = "gentle";
        console.log("Using reading pattern with pauses");
    }
    else if (patternType < 0.6) {
        // Browsing pattern - medium speed
        scrollSteps = 8; // Much slower
        easingType = "medium";
        mousePattern = "normal";
        console.log("Using browsing pattern");
    }
    else {
        // Quick scan pattern - faster movements
        scrollSteps = 12; // Much slower
        easingType = "fast";
        mousePattern = "quick";
        console.log("Using quick scan pattern");
    }
    const stepDuration = duration / scrollSteps;
    for (let step = 0; step < scrollSteps; step++) {
        // Generate smooth scroll parameters using natural curves
        const progress = step / scrollSteps;
        // Use multiple sine waves for natural human-like movement
        const baseWave = Math.sin(progress * Math.PI * 2.2); // Main scroll rhythm
        const microWave = Math.sin(progress * Math.PI * 12) * 0.3; // Micro adjustments
        const readingPause = progress > 0.3 && progress < 0.7 ? 0.5 : 1; // Slow down middle
        const scrollAmount = (baseWave * 50 + microWave * 15) * readingPause; // Reduced scroll amount
        const fineScrollAmount = Math.floor(scrollAmount);
        // Smooth animation with CSS transitions
        await driver.executeScript(`
      (function smoothAnimateScroll(amount) {
        const body = document.body;
        const startTime = performance.now();
        const scrollDuration = Math.random() * 250 + 150;
        
        function animateScroll(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / scrollDuration, 1);
          
          // Smooth easing function (ease-out)
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          // Apply scroll
          window.scrollBy(0, amount * easeOut);
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        }
        
        requestAnimationFrame(animateScroll);
      })(${fineScrollAmount});
    `);
        // Natural delay variation - much slower
        const baseDelay = stepDuration * (1.5 + Math.random() * 1.0); // Increased delay
        await driver.sleep(Math.floor(baseDelay));
        // Enhanced natural mouse movement simulation
        try {
            const actions = driver.actions({ async: true });
            // Generate more realistic mouse movement patterns
            const mousePattern = Math.random();
            let mouseOffsetX, mouseOffsetY;
            if (mousePattern < 0.3) {
                // Reading pattern - slow, deliberate movements
                mouseOffsetX = Math.sin(progress * Math.PI * 3) * 8 + Math.random() * 4 - 2;
                mouseOffsetY = Math.cos(progress * Math.PI * 2) * 4 + Math.random() * 2 - 1;
            }
            else if (mousePattern < 0.6) {
                // Browsing pattern - medium speed movements
                mouseOffsetX = Math.sin(progress * Math.PI * 5) * 12 + Math.random() * 6 - 3;
                mouseOffsetY = Math.cos(progress * Math.PI * 3) * 6 + Math.random() * 3 - 1.5;
            }
            else {
                // Quick scan pattern - faster movements
                mouseOffsetX = Math.sin(progress * Math.PI * 8) * 15 + Math.random() * 8 - 4;
                mouseOffsetY = Math.cos(progress * Math.PI * 5) * 8 + Math.random() * 4 - 2;
            }
            // Add micro-movements for more human-like behavior
            const microX = (Math.random() - 0.5) * 2;
            const microY = (Math.random() - 0.5) * 2;
            await actions.move({
                x: mouseOffsetX + microX,
                y: mouseOffsetY + microY
            }).perform();
            // Simulate different reading behaviors
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
        catch (error) {
            // Ignore mouse movement errors
        }
    }
    console.log("Smooth animation scroll completed.");
}
//# sourceMappingURL=scroll.js.map