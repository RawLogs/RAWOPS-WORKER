import { Project, Run } from '@rawops/shared';
export interface YapCommentSettings {
    aiCommentEnabled: boolean;
    aiCommentPrompt: string;
    geminiApiKey: string;
    delayRange: {
        min: number;
        max: number;
    };
    links: string[];
    aiModel?: string;
    commentStyle?: 'casual' | 'professional' | 'enthusiastic' | 'analytical' | 'friendly';
    commentLength?: 'short' | 'medium' | 'long';
    includeHashtags?: boolean;
    maxHashtags?: number;
    includeMentions?: boolean;
    maxMentions?: number;
    promptStyles?: {
        category: string;
        mode: 'select' | 'random';
        enabled: boolean;
        selectedStyles: string[];
        customStyles: Record<string, any>;
    };
    promptStyleMode?: 'manual' | 'random';
    selectedPromptStyles?: Array<{
        id: string;
        name: string;
        prompt: string;
        displayName: string;
        description: string;
        category: string;
        weight: number;
    }>;
    promptStyleCategory?: string;
    availablePromptStyles?: Array<{
        id: string;
        name: string;
        displayName: string;
        description: string;
        weight: number;
        prompt: string;
    }>;
    databasePrompt?: {
        finalPrompt: string;
        requirePrompt: string;
    } | null;
    profileId?: string;
}
export interface YapCommentResult {
    success: boolean;
    commentsPosted: number;
    likesPosted: number;
    repliesPosted: number;
    errors: string[];
    duration: number;
    processedLinks: string[];
    failedLinks: string[];
}
export interface CommentLink {
    url: string;
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
    error?: string;
    commentText?: string;
    liked?: boolean;
    replied?: boolean;
}
export declare class CommentByProfile {
    private xClient;
    private contentAI;
    private commentOps;
    private likeOps;
    private scrollOps;
    private extractionOps;
    private usernameExtractionOps;
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
    /**
     * Navigate to Home and perform Random Anti-detect (Mouse, Delay, Scroll)
     */
    private navigateToHomeWithAntiDetection;
    /**
     * Process workflow for a single link with new approach
     */
    private processLinkWithNewWorkflow;
    /**
     * Scroll and detect tweets with interaction matching
     */
    private scrollAndDetectTweets;
    /**
     * Process interaction with a specific tweet article (like and reply)
     */
    private processTweetInteractionWithArticle;
    /**
     * Close comment modal by clicking the Back button
     */
    private closeCommentModal;
    private processCommentLink;
    close(): Promise<void>;
}
//# sourceMappingURL=cbp.d.ts.map