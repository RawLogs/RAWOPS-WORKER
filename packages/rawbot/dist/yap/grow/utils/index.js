"use strict";
// packages/rawbot/src/yap/grow/utils/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveStepParams = resolveStepParams;
exports.getDelayValue = getDelayValue;
exports.resolveVariable = resolveVariable;
/**
 * Resolve step params (convert step object to params, excluding 'action' and 'ms')
 */
function resolveStepParams(step, context, resolveVariable) {
    const params = {};
    for (const [key, value] of Object.entries(step)) {
        if (key !== 'action' && key !== 'ms') {
            // Resolve variables in values
            if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
                const varName = value.slice(2, -2);
                params[key] = resolveVariable(varName);
            }
            else {
                params[key] = value;
            }
        }
    }
    return params;
}
/**
 * Get delay value from DelaySetting (number or {min, max})
 * If it's an object, returns random value between min and max
 */
function getDelayValue(delaySetting) {
    if (typeof delaySetting === 'number') {
        return delaySetting;
    }
    return Math.random() * (delaySetting.max - delaySetting.min) + delaySetting.min;
}
/**
 * Resolve a variable value
 */
function resolveVariable(varName, context, getDelayValue) {
    if (typeof varName === 'number') {
        return varName;
    }
    // Check context variables
    if (varName === 'current_link') {
        return context.current_link;
    }
    if (varName === 'user_delay_follow') {
        const delaySetting = context.variables?.user_delay_follow || 2000;
        return getDelayValue(delaySetting);
    }
    if (varName === 'delay_between_links') {
        const delaySetting = context.variables?.delay_between_links || 10000;
        return getDelayValue(delaySetting);
    }
    // Check context variables object
    if (context.variables && varName in context.variables) {
        const value = context.variables[varName];
        // If it's a delay setting (object with min/max), resolve it
        if (typeof value === 'object' && value !== null && 'min' in value && 'max' in value) {
            return getDelayValue(value);
        }
        return value;
    }
    return varName;
}
