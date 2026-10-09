export const ACCESS_TOKEN_COOKIE = 'access_token';
// Keep the cookie lifetime aligned with the JWT's 15min expiry.
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;

export const REFRESH_TOKEN_COOKIE = 'refresh_token';
// Keep the cookie lifetime aligned with the JWT's seven-day expiry.
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
