import { Step, DelaySetting, FlowContext } from '../types';
/**
 * Resolve step params (convert step object to params, excluding 'action' and 'ms')
 */
export declare function resolveStepParams(step: Step, context: FlowContext, resolveVariable: (varName: string | number) => any): Record<string, any>;
/**
 * Get delay value from DelaySetting (number or {min, max})
 * If it's an object, returns random value between min and max
 */
export declare function getDelayValue(delaySetting: DelaySetting): number;
/**
 * Resolve a variable value
 */
export declare function resolveVariable(varName: string | number, context: FlowContext, getDelayValue: (delaySetting: DelaySetting) => number): any;
