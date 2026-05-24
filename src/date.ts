// Time constants
export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;

// Helper to make the logic clearer
const ONE_MINUTE = SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
const ONE_HOUR = MINUTES_PER_HOUR * ONE_MINUTE;
const ONE_DAY = HOURS_PER_DAY * ONE_HOUR;

// --- Fixed Expiry Times ---

// 15 minutes
export const ACCESS_TOKEN_EXPIRY = 15 * ONE_MINUTE;

// 7 weeks 
export const REFRESH_TOKEN_EXPIRY = 7 * ONE_DAY;

// 10 minutes
export const OAUTH_CODE_EXPIRY = 10 * ONE_MINUTE;
