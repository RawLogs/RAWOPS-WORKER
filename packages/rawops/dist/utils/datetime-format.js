"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISPLAY_TIMEZONE_UTC_PLUS_7 = void 0;
exports.formatUtcInstantAsUtcPlus7 = formatUtcInstantAsUtcPlus7;
/** Vietnam standard time (UTC+7), same offset year-round */
exports.DISPLAY_TIMEZONE_UTC_PLUS_7 = 'Asia/Ho_Chi_Minh';
/**
 * Format an absolute instant (e.g. from `<time datetime="...Z">`) for display in UTC+7.
 * Parsing still uses the ISO string as UTC; only presentation shifts to Ho Chi Minh.
 */
function formatUtcInstantAsUtcPlus7(input) {
    if (input == null || input === '')
        return '';
    const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
    if (isNaN(d.getTime()))
        return '';
    return new Intl.DateTimeFormat('vi-VN', {
        timeZone: exports.DISPLAY_TIMEZONE_UTC_PLUS_7,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(d);
}
