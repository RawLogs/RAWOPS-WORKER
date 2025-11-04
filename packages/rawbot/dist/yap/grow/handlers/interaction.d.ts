import { YapGrowSettings } from '../types';
import { HandlerContext } from './index';
/**
 * Handle scroll and detect tweets action
 */
export declare function handleScrollAndDetectTweets(params: Record<string, any>, settings: YapGrowSettings | undefined, handlerContext: HandlerContext): Promise<void>;
/**
 * Handle scroll and detect tweets by time filter
 * Similar to handleScrollAndDetectTweets but filters tweets by time and selects the newest tweet
 */
export declare function handleScrollAndDetectTweetsByTime(params: Record<string, any>, settings: YapGrowSettings | undefined, handlerContext: HandlerContext): Promise<void>;
