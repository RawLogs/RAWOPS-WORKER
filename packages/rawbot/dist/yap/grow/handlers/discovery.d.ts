import { YapGrowSettings } from '../types';
import { HandlerContext } from './index';
/**
 * Handle follower discovery step
 * Uses interaction rules from grow-settings
 */
export declare function handleDiscoverFollowers(params: Record<string, any>, settings: YapGrowSettings | undefined, handlerContext: HandlerContext): Promise<void>;
