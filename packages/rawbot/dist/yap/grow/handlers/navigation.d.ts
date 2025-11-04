import { HandlerContext } from './index';
/**
 * Handle open action - navigate to URL
 * Supports 2 modes:
 * - Mode 1 (default): Navigate to URL directly without parsing (parse_url: false or undefined)
 * - Mode 2: Parse URL and navigate to profile, extract statusId (parse_url: true)
 */
export declare function handleOpen(params: Record<string, any>, handlerContext: HandlerContext): Promise<void>;
/**
 * Handle scroll to element action
 */
export declare function handleScrollToElement(params: Record<string, any>, handlerContext: HandlerContext): Promise<void>;
