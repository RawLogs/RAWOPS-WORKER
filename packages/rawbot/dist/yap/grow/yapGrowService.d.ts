import { Project, Run } from '@rawops/shared';
export interface YapGrowSettings {
    targetHandles: string[];
    maxFollows: number;
    maxUnfollows: number;
    delayBetweenActions: number;
    followBackRatio: number;
}
export interface YapGrowResult {
    success: boolean;
    followsExecuted: number;
    unfollowsExecuted: number;
    errors: string[];
    duration: number;
}
export declare class YapGrowService {
    private xClient;
    constructor();
    initializeWithProfile(profile: any, proxyConfig?: any): Promise<void>;
    runYapGrowWorkflow(project: Project, run: Run, settings: YapGrowSettings): Promise<YapGrowResult>;
    close(): Promise<void>;
}
//# sourceMappingURL=yapGrowService.d.ts.map