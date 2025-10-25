"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationAI = void 0;
const base_1 = require("./base");
class EvaluationAI extends base_1.BaseAI {
    constructor(config) {
        super(config);
    }
    /**
     * Evaluate tweet content quality
     */
    async evaluateTweet(tweetContent, options = {}) {
        const { criteria = {
            engagement: true,
            quality: true,
            relevance: true,
            authenticity: true,
            value: true
        }, context = 'crypto/tech community', targetAudience = 'crypto enthusiasts' } = options;
        let prompt = `Evaluate this tweet for the ${targetAudience} audience in the ${context} context:

"${tweetContent}"

Evaluation criteria (rate each 0-10):
`;
        if (criteria.engagement) {
            prompt += `- Engagement: Potential for likes, retweets, replies, and discussion
`;
        }
        if (criteria.quality) {
            prompt += `- Quality: Content value, clarity, and professionalism
`;
        }
        if (criteria.relevance) {
            prompt += `- Relevance: How well it fits the target audience and context
`;
        }
        if (criteria.authenticity) {
            prompt += `- Authenticity: Genuine voice, natural language, human-like
`;
        }
        if (criteria.value) {
            prompt += `- Value: Educational, informative, or entertaining content
`;
        }
        prompt += `
Provide evaluation in JSON format:
{
  "overallScore": 8.5,
  "criteriaScores": {
    "engagement": 8.0,
    "quality": 9.0,
    "relevance": 8.5,
    "authenticity": 8.0,
    "value": 9.0
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "verdict": "excellent|good|average|poor|unsuitable"
}

Respond with ONLY the JSON object - no other text.`;
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            try {
                const evaluation = JSON.parse(result.content);
                return {
                    success: true,
                    content: JSON.stringify(evaluation),
                    model: result.model,
                    attempts: result.attempts
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse evaluation JSON: ${error}`,
                    attempts: result.attempts
                };
            }
        }
        return result;
    }
    /**
     * Evaluate content for specific action suitability
     */
    async evaluateForAction(content, action, options = {}) {
        const actionCriteria = {
            post: 'original content, brand alignment, engagement potential',
            comment: 'discussion value, respectful tone, meaningful contribution',
            retweet: 'shareable value, brand alignment, quality content',
            quote: 'analysis potential, valuable insights, commentary opportunities'
        };
        const prompt = `Evaluate this content for ${action} action suitability:

"${content}"

Action: ${action}
Criteria: ${actionCriteria[action]}

Consider:
- Appropriateness for the action
- Potential impact and engagement
- Brand alignment and consistency
- Risk assessment
- Value to audience

Provide evaluation in JSON format:
{
  "actionSuitability": "high|medium|low",
  "score": 8.5,
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "riskLevel": "low|medium|high",
  "verdict": "proceed|proceed_with_caution|do_not_proceed"
}

Respond with ONLY the JSON object - no other text.`;
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            try {
                const evaluation = JSON.parse(result.content);
                return {
                    success: true,
                    content: JSON.stringify(evaluation),
                    model: result.model,
                    attempts: result.attempts
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse action evaluation JSON: ${error}`,
                    attempts: result.attempts
                };
            }
        }
        return result;
    }
    /**
     * Evaluate content against brand guidelines
     */
    async evaluateBrandCompliance(content, brandGuidelines, options = {}) {
        const prompt = `Evaluate this content against brand guidelines:

Content: "${content}"

Brand Guidelines: "${brandGuidelines}"

Consider:
- Tone and voice alignment
- Message consistency
- Brand values adherence
- Audience appropriateness
- Content quality standards

Provide evaluation in JSON format:
{
  "complianceScore": 8.5,
  "alignmentAreas": ["area1", "area2", "area3"],
  "misalignmentAreas": ["area1", "area2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "verdict": "compliant|mostly_compliant|needs_revision|non_compliant"
}

Respond with ONLY the JSON object - no other text.`;
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            try {
                const evaluation = JSON.parse(result.content);
                return {
                    success: true,
                    content: JSON.stringify(evaluation),
                    model: result.model,
                    attempts: result.attempts
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse brand compliance evaluation JSON: ${error}`,
                    attempts: result.attempts
                };
            }
        }
        return result;
    }
    /**
     * Evaluate content for engagement potential
     */
    async evaluateEngagementPotential(content, targetAudience = 'crypto enthusiasts', options = {}) {
        const prompt = `Evaluate the engagement potential of this content for ${targetAudience}:

"${content}"

Consider:
- Discussion potential
- Shareability
- Like/retweet appeal
- Comment-worthy aspects
- Viral potential
- Audience resonance

Provide evaluation in JSON format:
{
  "engagementScore": 8.5,
  "likelihoodScores": {
    "likes": 8.0,
    "retweets": 7.5,
    "replies": 9.0,
    "saves": 6.5
  },
  "engagementFactors": ["factor1", "factor2", "factor3"],
  "improvementSuggestions": ["suggestion1", "suggestion2"],
  "predictedEngagement": "high|medium|low"
}

Respond with ONLY the JSON object - no other text.`;
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            try {
                const evaluation = JSON.parse(result.content);
                return {
                    success: true,
                    content: JSON.stringify(evaluation),
                    model: result.model,
                    attempts: result.attempts
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse engagement evaluation JSON: ${error}`,
                    attempts: result.attempts
                };
            }
        }
        return result;
    }
    /**
     * Compare multiple content options
     */
    async compareContent(contentOptions, criteria = ['engagement', 'quality', 'relevance'], options = {}) {
        const contentList = contentOptions.map((content, index) => `${index + 1}. "${content}"`).join('\n');
        const prompt = `Compare these content options based on: ${criteria.join(', ')}

${contentList}

Comparison criteria:
${criteria.map(criterion => `- ${criterion}: Description of evaluation criteria`).join('\n')}

Provide comparison in JSON format:
{
  "comparison": [
    {
      "index": 1,
      "content": "content preview",
      "overallScore": 8.5,
      "criteriaScores": {
        "engagement": 8.0,
        "quality": 9.0,
        "relevance": 8.5
      },
      "rank": 1,
      "summary": "Brief evaluation summary"
    }
  ],
  "winner": 1,
  "recommendations": ["recommendation1", "recommendation2"],
  "insights": ["insight1", "insight2"]
}

Respond with ONLY the JSON object - no other text.`;
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            try {
                const comparison = JSON.parse(result.content);
                return {
                    success: true,
                    content: JSON.stringify(comparison),
                    model: result.model,
                    attempts: result.attempts
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse comparison JSON: ${error}`,
                    attempts: result.attempts
                };
            }
        }
        return result;
    }
}
exports.EvaluationAI = EvaluationAI;
//# sourceMappingURL=evaluation.js.map