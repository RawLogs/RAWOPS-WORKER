import { HandlerContext } from './index';
/**
 * Handle extract profile action - uses ProfileOps.extractProfileData from rawops
 * Extracts profile data including followers/following counts for interaction rules evaluation
 * Ensures data is available for ratio calculation
 */
export declare function handleExtractProfile(params: Record<string, any>, handlerContext: HandlerContext): Promise<void>;
/**
 * Handle wait until extract done action - uses WaitOps.waitUntilCondition from rawops
 */
export declare function handleWaitUntilExtractDone(params: Record<string, any>, handlerContext: HandlerContext): Promise<void>;
