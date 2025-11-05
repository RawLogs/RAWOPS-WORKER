"use strict";
// packages/rawbot/src/index.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFollowRatio = exports.Drivers = exports.setupBrowser = exports.RawOps = exports.submitCacheToAPI = exports.bulkUpdateLinksStatusAPI = exports.YapGrow = exports.YapInitManager = exports.CommentByLink = exports.CommentByProfile = exports.DatabaseService = exports.BaseFlow = exports.SearchFlow = exports.FilterService = exports.SearchService = exports.XClient = void 0;
// Core services exports
var XClient_1 = require("./client/XClient");
Object.defineProperty(exports, "XClient", { enumerable: true, get: function () { return XClient_1.XClient; } });
var SearchService_1 = require("./services/core/SearchService");
Object.defineProperty(exports, "SearchService", { enumerable: true, get: function () { return SearchService_1.SearchService; } });
var FilterService_1 = require("./services/core/FilterService");
Object.defineProperty(exports, "FilterService", { enumerable: true, get: function () { return FilterService_1.FilterService; } });
// Flow exports
var SearchFlow_1 = require("./flows/SearchFlow");
Object.defineProperty(exports, "SearchFlow", { enumerable: true, get: function () { return SearchFlow_1.SearchFlow; } });
var BaseFlow_1 = require("./flows/BaseFlow");
Object.defineProperty(exports, "BaseFlow", { enumerable: true, get: function () { return BaseFlow_1.BaseFlow; } });
// Service exports
var DatabaseService_1 = require("./services/DatabaseService");
Object.defineProperty(exports, "DatabaseService", { enumerable: true, get: function () { return __importDefault(DatabaseService_1).default; } });
// YAP exports (optimized)
__exportStar(require("./yap/project/YapProjectService"), exports);
var cbp_1 = require("./yap/comment/cbp");
Object.defineProperty(exports, "CommentByProfile", { enumerable: true, get: function () { return cbp_1.CommentByProfile; } });
var cbl_1 = require("./yap/comment/cbl");
Object.defineProperty(exports, "CommentByLink", { enumerable: true, get: function () { return cbl_1.CommentByLink; } });
var YapInitManager_1 = require("./yap/YapInitManager");
Object.defineProperty(exports, "YapInitManager", { enumerable: true, get: function () { return YapInitManager_1.YapInitManager; } });
var yg_1 = require("./yap/grow/yg");
Object.defineProperty(exports, "YapGrow", { enumerable: true, get: function () { return yg_1.YapGrow; } });
// Cache utilities exports
var cache_1 = require("./yap/comment/utils/cache");
Object.defineProperty(exports, "bulkUpdateLinksStatusAPI", { enumerable: true, get: function () { return cache_1.bulkUpdateLinksStatusAPI; } });
Object.defineProperty(exports, "submitCacheToAPI", { enumerable: true, get: function () { return cache_1.submitCacheToAPI; } });
// Re-export rawops for convenience
var rawops_1 = require("@rawops/rawops");
Object.defineProperty(exports, "RawOps", { enumerable: true, get: function () { return rawops_1.RawOps; } });
Object.defineProperty(exports, "setupBrowser", { enumerable: true, get: function () { return rawops_1.setupBrowser; } });
// Driver exports
var drivers_1 = require("./driver/drivers");
Object.defineProperty(exports, "Drivers", { enumerable: true, get: function () { return drivers_1.Drivers; } });
Object.defineProperty(exports, "calculateFollowRatio", { enumerable: true, get: function () { return drivers_1.calculateFollowRatio; } });
