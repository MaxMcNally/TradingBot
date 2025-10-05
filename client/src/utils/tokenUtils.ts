/**
 * Token utility functions for managing JWT tokens
 */

export interface TokenPayload {
  id: number;
  username: string;
  email?: string;
  iat: number;
  exp: number;
}

/**
 * Decode JWT token without verification (for client-side checks)
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Get time until token expires (in minutes)
 */
export const getTimeUntilExpiry = (token: string): number => {
  const payload = decodeToken(token);
  if (!payload) return 0;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = payload.exp - currentTime;
  return Math.max(0, Math.floor(timeUntilExpiry / 60)); // Convert to minutes
};

/**
 * Check if token will expire soon (within the next hour)
 */
export const isTokenExpiringSoon = (token: string, thresholdMinutes: number = 60): boolean => {
  const timeUntilExpiry = getTimeUntilExpiry(token);
  return timeUntilExpiry <= thresholdMinutes && timeUntilExpiry > 0;
};

/**
 * Format time until expiry for display
 */
export const formatTimeUntilExpiry = (token: string): string => {
  const minutes = getTimeUntilExpiry(token);
  
  if (minutes <= 0) return 'Expired';
  if (minutes < 60) return `${minutes} minutes`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hours`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
};
