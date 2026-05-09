import { Project, Run } from '@rawops/shared';
import type { YapCommentSettings, YapCommentResult } from './cbp';
export type { YapCommentSettings, YapCommentResult, CommentLink } from './cbp';
export declare class CommentByLink {
    private xClient;
    private contentAI;
    private commentOps;
    private likeOps;
    private scrollOps;
    private extractionOps;
    private profileHandle;
    private profileId;
    private cacheDir;
    private runId;
    private runType;
    private isClosed;
    private processedSettings;
    constructor();
    initializeWithProfile(profile: any, proxyConfig?: any): Promise<void>;
    runYapCommentWorkflow(project: Project, run: Run, settings: YapCommentSettings): Promise<YapCommentResult>;
    private processCommentLink;
    close(): Promise<void>;
}
