"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectionAI = void 0;
const base_1 = require("./base");
class SelectionAI extends base_1.BaseAI {
    constructor(config) {
        super(config);
    }
    /**
     * Select best tweets from a list based on criteria
     */
    async selectBestTweets(tweets, options = {}) {
        const { criteria = {}, maxResults = 5, prioritizeBy = 'engagement' } = options;
        const tweetList = tweets.map((tweet, index) => `${index + 1}. "${tweet}"`).join('\n');
        let prompt = `Select the best ${maxResults} tweets from this list based on ${prioritizeBy}:

${tweetList}

Selection criteria:
- Prioritize by: ${prioritizeBy}
`;
        if (criteria.minEngagement) {
            prompt += `- Minimum engagement potential: ${criteria.minEngagement}/10
`;
        }
        if (criteria.maxEngagement) {
            prompt += `- Maximum engagement potential: ${criteria.maxEngagement}/10
`;
        }
        if (criteria.minQuality) {
            prompt += `- Minimum quality score: ${criteria.minQuality}/10
`;
        }
        if (criteria.maxQuality) {
            prompt += `- Maximum quality score: ${criteria.maxQuality}/10
`;
        }
        if (criteria.sentiment && criteria.sentiment !== 'any') {
            prompt += `- Preferred sentiment: ${criteria.sentiment}
`;
        }
        if (criteria.topics && criteria.topics.length > 0) {
            prompt += `- Must relate to topics: ${criteria.topics.join(', ')}
`;
        }
        if (criteria.excludeTopics && criteria.excludeTopics.length > 0) {
            prompt += `- Exclude topics: ${criteria.excludeTopics.join(', ')}
`;
        }
        prompt += `
Provide selection in JSON format:
{
  "selectedTweets": [
    {
      "index": 1,
      "content": "tweet content",
      "score": 8.5,
      "reasons": ["reason1", "reason2", "reason3"]
    }
  ],
  "summary": "Brief explanation of selection criteria and results"
}

Respond with ONLY the JSON object - no other text.`;
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            try {
                const selection = JSON.parse(result.content);
                return {
                    success: true,
                    content: JSON.stringify(selection),
                    model: result.model,
                    attempts: result.attempts
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse selection JSON: ${error}`,
                    attempts: result.attempts
                };
            }
        }
        return result;
    }
    /**
     * Select tweets suitable for specific actions
     */
    async selectTweetsForAction(tweets, action, options = {}) {
        const tweetList = tweets.map((tweet, index) => `${index + 1}. "${tweet}"`).join('\n');
        const actionCriteria = {
            like: 'high engagement potential, positive sentiment, relevant to your interests',
            retweet: 'high quality content, aligns with your brand, shareable value',
            comment: 'interesting topics, discussion-worthy, opportunities for meaningful engagement',
            quote: 'valuable insights, analysis opportunities, content that adds value when quoted'
        };
        const prompt = `Select the best tweets for ${action} action from this list:

${tweetList}

Action: ${action}
Selection criteria: ${actionCriteria[action]}

Consider:
- Content quality and value
- Engagement potential
- Relevance to crypto/tech topics
- Authenticity and credibility
- Discussion potential

Provide selection in JSON format:
{
  "selectedTweets": [
    {
      "index": 1,
      "content": "tweet content",
      "score": 8.5,
      "reasons": ["reason1", "reason2", "reason3"],
      "actionSuitability": "high|medium|low"
    }
  ],
  "actionRecommendations": [
    "recommendation1",
    "recommendation2"
  ]
}

Respond with ONLY the JSON object - no other text.`;
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            try {
                const selection = JSON.parse(result.content);
                return {
                    success: true,
                    content: JSON.stringify(selection),
                    model: result.model,
                    attempts: result.attempts
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse action selection JSON: ${error}`,
                    attempts: result.attempts
                };
            }
        }
        return result;
    }
    /**
     * Select tweets for content creation
     */
    async selectTweetsForContent(tweets, contentType, options = {}) {
        const tweetList = tweets.map((tweet, index) => `${index + 1}. "${tweet}"`).join('\n');
        const contentTypeCriteria = {
            thread: 'complex topics, multiple angles, educational value, discussion potential',
            quote: 'insightful content, analysis opportunities, valuable perspectives',
            analysis: 'data-rich content, trends, technical topics, analytical depth'
        };
        const prompt = `Select the best tweets for creating ${contentType} content from this list:

${tweetList}

Content type: ${contentType}
Selection criteria: ${contentTypeCriteria[contentType]}

Consider:
- Content depth and complexity
- Educational value
- Analysis potential
- Discussion opportunities
- Relevance to crypto/tech community

Provide selection in JSON format:
{
  "selectedTweets": [
    {
      "index": 1,
      "content": "tweet content",
      "score": 8.5,
      "reasons": ["reason1", "reason2", "reason3"],
      "contentPotential": "high|medium|low",
      "contentIdeas": ["idea1", "idea2"]
    }
  ],
  "contentStrategy": {
    "recommendedType": "${contentType}",
    "keyThemes": ["theme1", "theme2"],
    "targetAudience": "description",
    "engagementStrategy": "strategy description"
  }
}

Respond with ONLY the JSON object - no other text.`;
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            try {
                const selection = JSON.parse(result.content);
                return {
                    success: true,
                    content: JSON.stringify(selection),
                    model: result.model,
                    attempts: result.attempts
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse content selection JSON: ${error}`,
                    attempts: result.attempts
                };
            }
        }
        return result;
    }
    /**
     * Rank tweets by multiple criteria
     */
    async rankTweets(tweets, criteria = ['engagement', 'quality', 'relevance']) {
        const tweetList = tweets.map((tweet, index) => `${index + 1}. "${tweet}"`).join('\n');
        const prompt = `Rank these tweets by the following criteria: ${criteria.join(', ')}

${tweetList}

Ranking criteria:
${criteria.map(criterion => `- ${criterion}: Description of how to evaluate this criterion`).join('\n')}

Provide ranking in JSON format:
{
  "rankings": [
    {
      "index": 1,
      "content": "tweet content",
      "overallScore": 8.5,
      "criteriaScores": {
        "engagement": 8.0,
        "quality": 9.0,
        "relevance": 8.5
      },
      "rank": 1,
      "summary": "Brief explanation of ranking"
    }
  ],
  "insights": [
    "insight1",
    "insight2",
    "insight3"
  ]
}

Respond with ONLY the JSON object - no other text.`;
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            try {
                const ranking = JSON.parse(result.content);
                return {
                    success: true,
                    content: JSON.stringify(ranking),
                    model: result.model,
                    attempts: result.attempts
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse ranking JSON: ${error}`,
                    attempts: result.attempts
                };
            }
        }
        return result;
    }
}
exports.SelectionAI = SelectionAI;
