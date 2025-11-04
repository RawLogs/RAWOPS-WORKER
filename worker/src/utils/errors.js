"use strict";
// utils/errors.ts - Error handling utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleProfileBusyError = handleProfileBusyError;
/**
 * Helper function to handle profile busy errors
 */
async function handleProfileBusyError(run, error, apiService) {
    if (error.message.includes('user data directory is already in use')) {
        console.log(`[${run.id}] ⚠️ Profile ${run.profile?.handle || 'unknown'} is already running. Skipping this run.`);
        // Update run status to indicate profile is busy
        await apiService.updateRunStatus(run.id, 'FAILED', {
            error: 'Profile is already in use by another process',
            profileBusy: true,
            completedAt: new Date()
        });
        return true; // Indicates we handled the error
    }
    return false; // Indicates we didn't handle the error
}
