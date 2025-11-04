import { HandlerContext } from './index';
/**
 * Handle scroll action - uses ScrollOps.scrollStep from rawops
 */
export declare function handleScrollStep(params: Record<string, any>, handlerContext: HandlerContext): Promise<void>;
/**
 * Handle scroll random action - uses ScrollOps.scrollRandom from rawops
 */
export declare function handleScrollRandom(params: Record<string, any>, handlerContext: HandlerContext): Promise<void>;
