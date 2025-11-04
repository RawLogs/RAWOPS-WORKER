import { YapGrowSettings } from '../types';
import { HandlerContext } from './index';
/**
 * Handle follow user action - uses ProfileOps from rawops
 * Now includes interaction rules evaluation if settings are provided
 */
export declare function handleFollowUser(params: Record<string, any>, handlerContext: HandlerContext, settings?: YapGrowSettings): Promise<void>;
