/** Vietnam standard time (UTC+7), same offset year-round */
export declare const DISPLAY_TIMEZONE_UTC_PLUS_7 = "Asia/Ho_Chi_Minh";
/**
 * Format an absolute instant (e.g. from `<time datetime="...Z">`) for display in UTC+7.
 * Parsing still uses the ISO string as UTC; only presentation shifts to Ho Chi Minh.
 */
export declare function formatUtcInstantAsUtcPlus7(input: Date | string | number | null | undefined): string;
