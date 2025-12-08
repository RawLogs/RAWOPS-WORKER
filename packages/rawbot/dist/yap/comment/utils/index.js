"use strict";
// packages/rawbot/src/yap/comment/utils/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateLinksStatusAPI = exports.saveCacheAndSubmitAPI = exports.saveLinkStatusToAPI = exports.filterProcessedLinks = exports.updateRemainingLinksAPI = exports.submitCacheToAPI = exports.saveToCache = exports.ensureCacheDirectory = exports.getPageInfo = exports.waitForPageLoad = exports.checkPageLoad = exports.performRandomMouseMovements = exports.performIdleScroll = exports.scrollToFindComments = exports.performRandomScrollPattern = exports.generateReplyToTweetComment = exports.generateReplyToComment = exports.cleanCommentForBMP = exports.selectRandomPromptStyle = exports.generateCommentWithUserStyles = void 0;
// AI utilities
var ai_1 = require("./ai");
Object.defineProperty(exports, "generateCommentWithUserStyles", { enumerable: true, get: function () { return ai_1.generateCommentWithUserStyles; } });
Object.defineProperty(exports, "selectRandomPromptStyle", { enumerable: true, get: function () { return ai_1.selectRandomPromptStyle; } });
Object.defineProperty(exports, "cleanCommentForBMP", { enumerable: true, get: function () { return ai_1.cleanCommentForBMP; } });
Object.defineProperty(exports, "generateReplyToComment", { enumerable: true, get: function () { return ai_1.generateReplyToComment; } });
Object.defineProperty(exports, "generateReplyToTweetComment", { enumerable: true, get: function () { return ai_1.generateReplyToTweetComment; } });
// Anti-detection utilities
var anti_1 = require("./anti");
Object.defineProperty(exports, "performRandomScrollPattern", { enumerable: true, get: function () { return anti_1.performRandomScrollPattern; } });
Object.defineProperty(exports, "scrollToFindComments", { enumerable: true, get: function () { return anti_1.scrollToFindComments; } });
Object.defineProperty(exports, "performIdleScroll", { enumerable: true, get: function () { return anti_1.performIdleScroll; } });
Object.defineProperty(exports, "performRandomMouseMovements", { enumerable: true, get: function () { return anti_1.performRandomMouseMovements; } });
// Page utilities
var page_1 = require("./page");
Object.defineProperty(exports, "checkPageLoad", { enumerable: true, get: function () { return page_1.checkPageLoad; } });
Object.defineProperty(exports, "waitForPageLoad", { enumerable: true, get: function () { return page_1.waitForPageLoad; } });
Object.defineProperty(exports, "getPageInfo", { enumerable: true, get: function () { return page_1.getPageInfo; } });
// Cache utilities
var cache_1 = require("./cache");
Object.defineProperty(exports, "ensureCacheDirectory", { enumerable: true, get: function () { return cache_1.ensureCacheDirectory; } });
Object.defineProperty(exports, "saveToCache", { enumerable: true, get: function () { return cache_1.saveToCache; } });
Object.defineProperty(exports, "submitCacheToAPI", { enumerable: true, get: function () { return cache_1.submitCacheToAPI; } });
Object.defineProperty(exports, "updateRemainingLinksAPI", { enumerable: true, get: function () { return cache_1.updateRemainingLinksAPI; } });
Object.defineProperty(exports, "filterProcessedLinks", { enumerable: true, get: function () { return cache_1.filterProcessedLinks; } });
Object.defineProperty(exports, "saveLinkStatusToAPI", { enumerable: true, get: function () { return cache_1.saveLinkStatusToAPI; } });
Object.defineProperty(exports, "saveCacheAndSubmitAPI", { enumerable: true, get: function () { return cache_1.saveCacheAndSubmitAPI; } });
Object.defineProperty(exports, "bulkUpdateLinksStatusAPI", { enumerable: true, get: function () { return cache_1.bulkUpdateLinksStatusAPI; } });
