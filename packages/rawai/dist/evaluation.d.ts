import { BaseAI, AIResult, AIConfig } from './base';
export interface EvaluationOptions {
    criteria?: {
        engagement?: boolean;
        quality?: boolean;
        relevance?: boolean;
        authenticity?: boolean;
        value?: boolean;
    };
    context?: string;
    targetAudience?: string;
}
export interface TweetEvaluation {
    overallScore: number;
    criteriaScores: {
        engagement: number;
        quality: number;
        relevance: number;
        authenticity: number;
        value: number;
    };
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    verdict: 'excellent' | 'good' | 'average' | 'poor' | 'unsuitable';
}
export declare class EvaluationAI extends BaseAI {
    constructor(config: AIConfig);
    /**
     * Evaluate tweet content quality
     */
    evaluateTweet(tweetContent: string, options?: EvaluationOptions): Promise<AIResult>;
    /**
     * Evaluate content for specific action suitability
     */
    evaluateForAction(content: string, action: 'post' | 'comment' | 'retweet' | 'quote', options?: EvaluationOptions): Promise<AIResult>;
    /**
     * Evaluate content against brand guidelines
     */
    evaluateBrandCompliance(content: string, brandGuidelines: string, options?: EvaluationOptions): Promise<AIResult>;
    /**
     * Evaluate content for engagement potential
     */
    evaluateEngagementPotential(content: string, targetAudience?: string, options?: EvaluationOptions): Promise<AIResult>;
    /**
     * Compare multiple content options
     */
    compareContent(contentOptions: string[], criteria?: string[], options?: EvaluationOptions): Promise<AIResult>;
}
