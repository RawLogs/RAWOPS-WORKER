export { generateCommentWithUserStyles, buildContentAI, buildAnalysisAI, getActivePromotionalUrlEntries, commentTextContainsPromotionalUrl, resolvePromotionalInjectForCbl, getPromotionalInjectFallbackForCbl, selectRandomPromptStyle, cleanCommentForBMP, generateReplyToComment, generateReplyToTweetComment, RAWOPS_IMPORTANT_PROMPT, stripHttpUrlsFromText, splitPromotionalDescriptionForPipeline } from './ai';
export { performRandomScrollPattern, scrollToFindComments, performIdleScroll, performRandomMouseMovements } from './anti';
export { checkPageLoad, waitForPageLoad, getPageInfo } from './page';
export { ensureCacheDirectory, saveToCache, submitCacheToAPI, updateRemainingLinksAPI, filterProcessedLinks, saveLinkStatusToAPI, saveCacheAndSubmitAPI, bulkUpdateLinksStatusAPI } from './cache';
export { incrementPromotionalSuccessViaAPI } from './promotional-stats';
