import { Drivers } from '../../../driver/drivers';
import { FlowContext } from '../types';
export interface HandlerContext {
    drivers: Drivers;
    context: FlowContext;
    cacheDir?: string;
    resolveVariable?: (varName: string | number) => any;
    processedLinks?: string[];
    remainingLinksCount?: number;
}
