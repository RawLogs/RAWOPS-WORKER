import { Project, Run } from '@rawops/shared';
import { YapGrowSettings, YapGrowResult } from './types';
export type { Step, YapGrowSettings, YapGrowResult, FlowContext, DelaySetting } from './types';
/**
 * YapGrow - Automated flow execution based on JSON settings
 * Parses flow configuration and executes actions using driver functions
 */
export declare class YapGrow {
    private xClient;
    private drivers;
    private contentAI;
    private profileHandle;
    private profileId;
    private cacheDir;
    private runId;
    private runType;
    private isClosed;
    private context;
    private processedSettings;
    constructor();
    initializeWithProfile(profile: any, proxyConfig?: any): Promise<void>;
    runYapGrowWorkflow(project: Project, run: Run, settings: YapGrowSettings): Promise<YapGrowResult>;
    /**
     * Execute steps in order
     */
    private executeSteps;
    /**
     * Execute a single step
     */
    private executeStep;
    /**
     * Resolve step params wrapper
     */
    private resolveStepParams;
    /**
     * Get delay value wrapper
     */
    private getDelayValue;
    /**
     * Resolve variable wrapper
     */
    private resolveVariable;
    /**
     * Get handler context
     */
    private getHandlerContext;
    close(): Promise<void>;
}
