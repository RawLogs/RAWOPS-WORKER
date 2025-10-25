"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisAI = void 0;
const base_1 = require("./base");
class AnalysisAI extends base_1.BaseAI {
    constructor(config) {
        super(config);
    }
    /**
     * Analyze tweet content
     */
    async analyzeTweet(tweetContent, options = {}) {
        const { includeSentiment = true, includeTopics = true, includeEngagement = true, includeQuality = true } = options;
        let prompt = `Analyze this tweet: "${tweetContent}"

Provide analysis in JSON format with the following structure:
{
  "sentiment": "positive|negative|neutral",
  "topics": ["topic1", "topic2", "topic3"],
  "engagementScore": 0-10,
  "qualityScore": 0-10,
  "summary": "Brief summary of the tweet",
  "recommendations": ["recommendation1", "recommendation2"]
}

Analysis criteria:
`;
        if (includeSentiment) {
            prompt += `- Sentiment: Analyze emotional tone and attitude
`;
        }
        if (includeTopics) {
            prompt += `- Topics: Identify main themes and subjects discussed
`;
        }
        if (includeEngagement) {
            prompt += `- Engagement Score: Rate potential for likes, retweets, replies (0-10)
`;
        }
        if (includeQuality) {
            prompt += `- Quality Score: Rate content quality, value, and authenticity (0-10)
`;
        }
        prompt += `
Respond with ONLY the JSON object - no other text.`;
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            try {
                const analysis = JSON.parse(result.content);
                return {
                    success: true,
                    content: JSON.stringify(analysis),
                    model: result.model,
                    attempts: result.attempts
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse analysis JSON: ${error}`,
                    attempts: result.attempts
                };
            }
        }
        return result;
    }
    /**
     * Analyze multiple tweets for comparison
     */
    async analyzeTweetBatch(tweets, options = {}) {
        const tweetList = tweets.map((tweet, index) => `${index + 1}. "${tweet}"`).join('\n');
        const prompt = `Analyze these ${tweets.length} tweets for comparison:

${tweetList}

Provide analysis in JSON format with the following structure:
{
  "tweets": [
    {
      "index": 1,
      "sentiment": "positive|negative|neutral",
      "topics": ["topic1", "topic2"],
      "engagementScore": 0-10,
      "qualityScore": 0-10,
      "summary": "Brief summary"
    }
  ],
  "comparison": {
    "bestEngagement": 1,
    "bestQuality": 1,
    "mostPositive": 1,
    "mostNegative": 1,
    "overallRanking": [1, 2, 3]
  },
  "insights": ["insight1", "insight2", "insight3"]
}

Respond with ONLY the JSON object - no other text.`;
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            try {
                const analysis = JSON.parse(result.content);
                return {
                    success: true,
                    content: JSON.stringify(analysis),
                    model: result.model,
                    attempts: result.attempts
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse batch analysis JSON: ${error}`,
                    attempts: result.attempts
                };
            }
        }
        return result;
    }
    /**
     * Analyze user's tweet history for patterns
     */
    async analyzeUserPatterns(tweets, username) {
        const tweetList = tweets.map((tweet, index) => `${index + 1}. "${tweet}"`).join('\n');
        const prompt = `Analyze the tweet patterns for user @${username}:

${tweetList}

Provide analysis in JSON format with the following structure:
{
  "userProfile": {
    "username": "${username}",
    "primaryTopics": ["topic1", "topic2", "topic3"],
    "writingStyle": "casual|professional|enthusiastic|analytical",
    "averageSentiment": "positive|negative|neutral",
    "engagementLevel": "high|medium|low",
    "contentQuality": "high|medium|low"
  },
  "patterns": {
    "commonThemes": ["theme1", "theme2"],
    "postingFrequency": "high|medium|low",
    "contentTypes": ["type1", "type2"],
    "hashtagUsage": "frequent|moderate|rare",
    "mentionUsage": "frequent|moderate|rare"
  },
  "recommendations": [
    "recommendation1",
    "recommendation2",
    "recommendation3"
  ]
}

Respond with ONLY the JSON object - no other text.`;
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            try {
                const analysis = JSON.parse(result.content);
                return {
                    success: true,
                    content: JSON.stringify(analysis),
                    model: result.model,
                    attempts: result.attempts
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse user pattern analysis JSON: ${error}`,
                    attempts: result.attempts
                };
            }
        }
        return result;
    }
    /**
     * Analyze trending topics
     */
    async analyzeTrendingTopics(topics, context) {
        const topicList = topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n');
        const contextText = context ? `\nContext: ${context}\n` : '';
        const prompt = `Analyze these trending topics:${contextText}

${topicList}

Provide analysis in JSON format with the following structure:
{
  "trendAnalysis": {
    "mostRelevant": "topic1",
    "leastRelevant": "topic2",
    "emergingTrends": ["trend1", "trend2"],
    "decliningTrends": ["trend1", "trend2"]
  },
  "opportunities": [
    {
      "topic": "topic1",
      "opportunity": "description",
      "engagementPotential": "high|medium|low",
      "contentIdeas": ["idea1", "idea2"]
    }
  ],
  "recommendations": [
    "recommendation1",
    "recommendation2",
    "recommendation3"
  ]
}

Respond with ONLY the JSON object - no other text.`;
        const result = await this.generateWithRetry(prompt);
        if (result.success && result.content) {
            try {
                const analysis = JSON.parse(result.content);
                return {
                    success: true,
                    content: JSON.stringify(analysis),
                    model: result.model,
                    attempts: result.attempts
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to parse trending topics analysis JSON: ${error}`,
                    attempts: result.attempts
                };
            }
        }
        return result;
    }
}
exports.AnalysisAI = AnalysisAI;
//# sourceMappingURL=analysis.js.map