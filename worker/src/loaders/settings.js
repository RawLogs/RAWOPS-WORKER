"use strict";
// loaders/settings.ts - Settings loading functions
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadUserCommentSettings = loadUserCommentSettings;
exports.loadUserGrowSettings = loadUserGrowSettings;
exports.loadUserProjectSettings = loadUserProjectSettings;
exports.loadProjectSettingsFromRules = loadProjectSettingsFromRules;
const api_keys_1 = require("./api-keys");
const DEFAULT_PROVIDER_PRIORITY = ['gemini', 'openai', 'deepseek', 'huggingface'];
function pickNonEmptyKey(...vals) {
    for (const v of vals) {
        if (v == null)
            continue;
        if (typeof v !== 'string')
            continue;
        const t = v.trim();
        if (t.length > 0)
            return t;
    }
    return null;
}
/**
 * Merge decrypted profileApiKeys from grow-settings and comment-settings (per-field, prefer first non-empty).
 * Avoids replacing the whole object with a comment payload that omits OpenAI while grow-settings has it.
 */
function mergeGrowProfileApiKeys(growPk, commentPk, rootGemini) {
    const g = growPk && typeof growPk === 'object' ? growPk : {};
    const c = commentPk && typeof commentPk === 'object' ? commentPk : {};
    const geminiApiKey = pickNonEmptyKey(c.geminiApiKey, g.geminiApiKey, rootGemini);
    const openaiApiKey = pickNonEmptyKey(c.openaiApiKey, g.openaiApiKey);
    const deepseekApiKey = pickNonEmptyKey(c.deepseekApiKey, g.deepseekApiKey);
    const huggingfaceApiKey = pickNonEmptyKey(c.huggingfaceApiKey, g.huggingfaceApiKey);
    const has = {
        gemini: !!geminiApiKey,
        openai: !!openaiApiKey,
        deepseek: !!deepseekApiKey,
        huggingface: !!huggingfaceApiKey
    };
    if (!has.gemini && !has.openai && !has.deepseek && !has.huggingface) {
        return null;
    }
    const rawPri = Array.isArray(c.apiKeyPriority) && c.apiKeyPriority.length > 0
        ? c.apiKeyPriority
        : Array.isArray(g.apiKeyPriority) && g.apiKeyPriority.length > 0
            ? g.apiKeyPriority
            : null;
    let apiKeyPriority = rawPri && rawPri.length > 0
        ? rawPri.filter((p) => has[p])
        : [...DEFAULT_PROVIDER_PRIORITY].filter((p) => has[p]);
    if (apiKeyPriority.length === 0 && has.gemini) {
        apiKeyPriority = ['gemini'];
    }
    return {
        geminiApiKey: geminiApiKey ?? null,
        openaiApiKey: openaiApiKey ?? null,
        deepseekApiKey: deepseekApiKey ?? null,
        huggingfaceApiKey: huggingfaceApiKey ?? null,
        apiKeyPriority
    };
}
/**
 * Load user-specific comment settings
 * Throws error if API calls fail - ensures settings are loaded before initializing rawbot services
 */
async function loadUserCommentSettings(profileId, userId, apiService) {
    try {
        console.log(`[Worker] Loading comment settings for profile ${profileId}...`);
        // API call must succeed - throw if null
        const userSettings = await apiService.getUserCommentSettings(profileId);
        if (!userSettings) {
            throw new Error(`Failed to load comment settings from API for profile ${profileId}`);
        }
        console.log(`[Worker] ✅ Comment settings loaded from API for profile ${profileId}`);
        // Get Gemini API key if userId is provided and AI is enabled
        if (userId && userSettings.aiCommentEnabled && !userSettings.geminiApiKey) {
            try {
                const geminiApiKey = await (0, api_keys_1.getGeminiApiKey)(userId, apiService);
                if (geminiApiKey) {
                    userSettings.geminiApiKey = geminiApiKey;
                    console.log(`[Worker] ✅ Gemini API key added to settings`);
                }
                else {
                    console.log(`[Worker] ⚠️ No Gemini API key found, AI comments will be disabled`);
                    userSettings.aiCommentEnabled = false;
                }
            }
            catch (error) {
                // If API call failed after retries, rethrow to stop worker
                console.error(`[Worker] ❌ Failed to load API key after retries:`, error);
                throw new Error(`Failed to load API key: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // Get prompt settings from database if AI is enabled
        if (userSettings.aiCommentEnabled) {
            try {
                const promptSettings = await apiService.getUserPromptSettings(profileId, 'COMMENT');
                if (!promptSettings) {
                    throw new Error(`Failed to load prompt settings from API for profile ${profileId}`);
                }
                if (promptSettings.finalPrompt && promptSettings.requirePrompt) {
                    userSettings.databasePrompt = {
                        finalPrompt: promptSettings.finalPrompt,
                        requirePrompt: promptSettings.requirePrompt
                    };
                    // Add selectedPromptStyles from prompt settings
                    if (promptSettings.selectedPromptStyles) {
                        userSettings.selectedPromptStyles = promptSettings.selectedPromptStyles;
                        console.log(`[Worker] ✅ Selected prompt styles loaded: ${promptSettings.selectedPromptStyles.length} styles`);
                    }
                    console.log(`[Worker] ✅ Database prompt loaded successfully`);
                }
                else {
                    console.error(`[Worker] ❌ No database prompt found or incomplete. AI comments will be disabled.`);
                    console.error(`[Worker] Please ensure prompt_final table has a record with type='COMMENT' for this profile.`);
                    userSettings.aiCommentEnabled = false;
                    userSettings.databasePrompt = null;
                }
            }
            catch (error) {
                // Retry failed - rethrow to mark run as FAILED
                console.error(`[Worker] ❌ Failed to load prompt settings after retries:`, error);
                throw new Error(`Failed to load prompt settings: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // Add profileId to settings for database prompt usage
        userSettings.profileId = profileId;
        // Validate required settings before returning
        if (!userSettings.links || !Array.isArray(userSettings.links)) {
            console.warn(`[Worker] ⚠️ No links found in comment settings, using empty array`);
            userSettings.links = [];
        }
        console.log(`[Worker] ✅ All comment settings loaded and validated successfully`);
        return userSettings;
    }
    catch (error) {
        // All errors should be thrown to prevent rawbot service initialization
        console.error('[Worker] ❌ Error loading user comment settings:', error);
        throw new Error(`Failed to load comment settings: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Load user-specific grow settings
 * Throws error if API calls fail - ensures settings are loaded before initializing rawbot services
 */
async function loadUserGrowSettings(profileId, userId, apiService) {
    try {
        console.log(`[Worker] Loading grow settings for profile ${profileId}...`);
        // API call must succeed - throw if null
        const userSettings = await apiService.getUserGrowSettings(profileId);
        if (!userSettings) {
            throw new Error(`Failed to load grow settings from API for profile ${profileId}`);
        }
        console.log(`[Worker] ✅ Grow settings loaded from API for profile ${profileId}`);
        // When AI is on: merge decrypted keys from grow-settings + comment-settings (same DB row as cbl).
        // Per-field merge so a sparse comment-settings payload cannot wipe OpenAI from grow-settings.
        if (userSettings.aiCommentEnabled) {
            try {
                const commentSettings = await apiService.getUserCommentSettings(profileId);
                const merged = mergeGrowProfileApiKeys(userSettings.profileApiKeys, commentSettings?.profileApiKeys, userSettings.geminiApiKey);
                if (merged) {
                    userSettings.profileApiKeys = merged;
                    console.log('[Worker] Merged profileApiKeys (grow + comment-settings)', {
                        hasGemini: !!merged.geminiApiKey,
                        hasOpenai: !!merged.openaiApiKey,
                        hasDeepseek: !!merged.deepseekApiKey,
                        hasHuggingface: !!merged.huggingfaceApiKey,
                        apiKeyPriority: merged.apiKeyPriority
                    });
                }
            }
            catch (mergeErr) {
                console.warn('[Worker] Could not load comment-settings for profileApiKeys merge:', mergeErr);
            }
        }
        // Get Gemini API key if userId is provided and AI is enabled
        if (userId && userSettings.aiCommentEnabled && !userSettings.geminiApiKey) {
            console.log(`[Worker] Fetching Gemini API key for AI comment generation...`);
            try {
                const geminiApiKey = await (0, api_keys_1.getGeminiApiKey)(userId, apiService);
                if (geminiApiKey) {
                    userSettings.geminiApiKey = geminiApiKey;
                    console.log(`[Worker] ✅ Gemini API key added to settings`);
                }
                else {
                    console.log(`[Worker] ⚠️ No Gemini API key found, AI comments will be disabled`);
                    userSettings.aiCommentEnabled = false;
                }
            }
            catch (error) {
                // If API call failed after retries, rethrow to stop worker
                console.error(`[Worker] ❌ Failed to load API key after retries:`, error);
                throw new Error(`Failed to load API key: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // If comment-settings failed or returned no keys, map root gemini into profileApiKeys for ContentAI.
        if (userSettings.aiCommentEnabled && userSettings.geminiApiKey) {
            const mergedPk = userSettings.profileApiKeys;
            const stillEmpty = !(mergedPk?.geminiApiKey ||
                mergedPk?.openaiApiKey ||
                mergedPk?.deepseekApiKey ||
                mergedPk?.huggingfaceApiKey);
            if (stillEmpty) {
                userSettings.profileApiKeys = {
                    geminiApiKey: userSettings.geminiApiKey,
                    apiKeyPriority: ['gemini']
                };
                console.log('[Worker] Normalized profileApiKeys from root geminiApiKey (fallback)');
            }
        }
        // Get prompt settings from database if AI is enabled (same type as Yap Comment / loadUserCommentSettings)
        if (userSettings.aiCommentEnabled) {
            console.log(`[Worker] Fetching prompt settings from database (type=COMMENT, same as Yap Comment)...`);
            try {
                const promptSettings = await apiService.getUserPromptSettings(profileId, 'COMMENT');
                console.log(`[Worker] Prompt settings response:`, {
                    hasPromptSettings: !!promptSettings,
                    hasFinalPrompt: !!(promptSettings?.finalPrompt),
                    hasRequirePrompt: !!(promptSettings?.requirePrompt),
                    hasSelectedStyles: !!(promptSettings?.selectedPromptStyles?.length)
                });
                if (!promptSettings) {
                    throw new Error(`Failed to load prompt settings from API for profile ${profileId}`);
                }
                if (promptSettings.finalPrompt && promptSettings.requirePrompt) {
                    userSettings.databasePrompt = {
                        finalPrompt: promptSettings.finalPrompt,
                        requirePrompt: promptSettings.requirePrompt
                    };
                    // Add selectedPromptStyles from prompt settings
                    if (promptSettings.selectedPromptStyles) {
                        userSettings.selectedPromptStyles = promptSettings.selectedPromptStyles;
                        console.log(`[Worker] ✅ Selected prompt styles loaded: ${promptSettings.selectedPromptStyles.length} styles`);
                    }
                    console.log(`[Worker] ✅ Database prompt loaded successfully for GROW (COMMENT prompt row)`);
                }
                else {
                    console.error(`[Worker] ❌ No database prompt found or incomplete. AI comments will be disabled.`);
                    console.error(`[Worker] Prompt settings:`, JSON.stringify(promptSettings, null, 2));
                    console.error(`[Worker] Please ensure prompt_final has a record with type='COMMENT' for this profile.`);
                    userSettings.aiCommentEnabled = false;
                    userSettings.databasePrompt = null;
                }
            }
            catch (error) {
                // Retry failed - rethrow to mark run as FAILED
                console.error(`[Worker] ❌ Failed to load prompt settings after retries:`, error);
                throw new Error(`Failed to load prompt settings: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        else {
            console.log(`[Worker] AI comment not enabled in grow settings, skipping prompt loading`);
        }
        // Validate required settings before returning
        if (!userSettings.steps || !Array.isArray(userSettings.steps)) {
            console.warn(`[Worker] ⚠️ No steps found in grow settings, using empty array`);
            userSettings.steps = [];
        }
        // Extract interaction rules from settings if present
        // This allows interaction rules to be stored in grow-settings instead of separate API
        if (userSettings.interactionRules) {
            console.log(`[Worker] ✅ Interaction rules found in grow settings: ${userSettings.interactionRules.rules?.length || 0} rules`);
        }
        else {
            console.log(`[Worker] ⚠️ No interaction rules in grow settings, will use separate API if needed`);
        }
        console.log(`[Worker] ✅ All grow settings loaded and validated successfully`);
        return userSettings;
    }
    catch (error) {
        // All errors should be thrown to prevent rawbot service initialization
        console.error('[Worker] ❌ Error loading user grow settings:', error);
        throw new Error(`Failed to load grow settings: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Load user-specific settings for a project
 */
async function loadUserProjectSettings(projectId, profileId, apiService) {
    try {
        // Try to get user-specific settings first
        const userSettings = await apiService.getUserProjectSettings(projectId, profileId);
        if (userSettings) {
            console.log(`[Worker] Found user-specific settings for profile ${profileId}`);
            return userSettings;
        }
        // Fallback to project default settings
        console.log(`[Worker] No user-specific settings found, using project defaults`);
        const project = await apiService.getProject(projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        return await loadProjectSettingsFromRules(project.Rules);
    }
    catch (error) {
        console.error('[Worker] Error loading user project settings:', error);
        // Return default settings if anything fails
        return {
            hashtags: [],
            handles: [],
            links: [],
            officialHandle: '',
            maxTweetsPerSearch: 100,
            timeLimitHours: 24,
            requireVerified: false,
            requireMedia: false,
            minLikes: 0,
            excludeSpam: true,
            maxMentions: 5,
            maxHashtags: 3,
            maxInteractions: 50,
            delayBetweenActions: 2000,
            delayBetweenTweets: 5000,
            scrollDelay: 1000,
            retryAttempts: 3,
            aiCommentEnabled: false,
            aiCommentPrompt: '',
            geminiApiKey: ''
        };
    }
}
/**
 * Load project settings from rules
 */
async function loadProjectSettingsFromRules(rules) {
    const settings = {
        hashtags: [],
        handles: [],
        links: [],
        officialHandle: '',
        maxTweetsPerSearch: 100,
        maxScrollsPerSearch: 20,
        timeLimitHours: 24,
        requireVerified: false,
        requireMedia: false,
        minLikes: 0,
        excludeSpam: true,
        maxMentions: 5,
        maxHashtags: 3,
        maxInteractions: 50,
        delayBetweenActions: 2000,
        delayBetweenTweets: 5000,
        scrollDelay: 1000,
        retryAttempts: 3,
        aiCommentEnabled: false,
        aiCommentPrompt: '',
        geminiApiKey: ''
    };
    // Parse rules to extract settings
    for (const rule of rules) {
        if (rule.payload) {
            const payload = rule.payload;
            switch (rule.type) {
                case 'SEARCH':
                    if (payload.hashtags)
                        settings.hashtags = payload.hashtags;
                    if (payload.handles)
                        settings.handles = payload.handles;
                    if (payload.links)
                        settings.links = payload.links;
                    if (payload.officialHandle)
                        settings.officialHandle = payload.officialHandle;
                    if (payload.maxTweetsPerSearch)
                        settings.maxTweetsPerSearch = payload.maxTweetsPerSearch;
                    if (payload.maxScrollsPerSearch)
                        settings.maxScrollsPerSearch = payload.maxScrollsPerSearch;
                    break;
                case 'FILTER':
                    if (payload.timeLimitHours)
                        settings.timeLimitHours = payload.timeLimitHours;
                    if (payload.requireVerified !== undefined)
                        settings.requireVerified = payload.requireVerified;
                    if (payload.requireMedia !== undefined)
                        settings.requireMedia = payload.requireMedia;
                    if (payload.minLikes)
                        settings.minLikes = payload.minLikes;
                    if (payload.excludeSpam !== undefined)
                        settings.excludeSpam = payload.excludeSpam;
                    if (payload.maxMentions)
                        settings.maxMentions = payload.maxMentions;
                    if (payload.maxHashtags)
                        settings.maxHashtags = payload.maxHashtags;
                    break;
                case 'INTERACTION':
                    if (payload.maxInteractions)
                        settings.maxInteractions = payload.maxInteractions;
                    if (payload.delayBetweenActions)
                        settings.delayBetweenActions = payload.delayBetweenActions;
                    if (payload.delayBetweenTweets)
                        settings.delayBetweenTweets = payload.delayBetweenTweets;
                    if (payload.scrollDelay)
                        settings.scrollDelay = payload.scrollDelay;
                    if (payload.retryAttempts)
                        settings.retryAttempts = payload.retryAttempts;
                    break;
                case 'AI':
                    if (payload.aiCommentEnabled !== undefined)
                        settings.aiCommentEnabled = payload.aiCommentEnabled;
                    if (payload.aiCommentPrompt)
                        settings.aiCommentPrompt = payload.aiCommentPrompt;
                    if (payload.geminiApiKey)
                        settings.geminiApiKey = payload.geminiApiKey;
                    break;
            }
        }
    }
    return settings;
}
