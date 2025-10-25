import { WebDriver } from 'selenium-webdriver';
import { ScrollOps, ExtractionOps } from '@rawops/rawops';
/**
 * Perform random scroll pattern using rawops anti-detection
 */
export declare function performRandomScrollPattern(driver: WebDriver, scrollOps: ScrollOps, commentOps: any): Promise<void>;
/**
 * Scroll to find comments for replying using rawops anti-detection
 */
export declare function scrollToFindComments(driver: WebDriver, scrollOps: ScrollOps, extractionOps: ExtractionOps, commentOps: any): Promise<void>;
/**
 * Perform idle scroll to simulate human behavior
 */
export declare function performIdleScroll(driver: WebDriver, scrollOps: ScrollOps, commentOps: any): Promise<void>;
/**
 * Perform random mouse movements for anti-detection using rawops anti-detection
 */
export declare function performRandomMouseMovements(driver: WebDriver, commentOps: any): Promise<void>;
//# sourceMappingURL=anti.d.ts.map