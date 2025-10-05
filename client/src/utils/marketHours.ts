/**
 * Market hours utility functions
 * US Stock Market: Monday-Friday, 9:30 AM - 4:00 PM Eastern Time
 */

export interface MarketStatus {
  isOpen: boolean;
  isMarketHours: boolean;
  nextOpen?: Date;
  nextClose?: Date;
  currentTime: Date;
  timezone: string;
}

/**
 * Check if the current time is during market hours
 * @param date - Date to check (defaults to current time)
 * @returns MarketStatus object with market information
 */
export function getMarketStatus(date: Date = new Date()): MarketStatus {
  const easternTime = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const dayOfWeek = easternTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = easternTime.getHours();
  const minute = easternTime.getMinutes();
  const currentTimeMinutes = hour * 60 + minute;
  
  // Market hours: 9:30 AM (570 minutes) to 4:00 PM (960 minutes)
  const marketOpenMinutes = 9 * 60 + 30; // 9:30 AM
  const marketCloseMinutes = 16 * 60; // 4:00 PM
  
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  const isMarketHours = isWeekday && 
    currentTimeMinutes >= marketOpenMinutes && 
    currentTimeMinutes < marketCloseMinutes;
  
  const isOpen = isMarketHours;
  
  // Calculate next open/close times
  let nextOpen: Date | undefined;
  let nextClose: Date | undefined;
  
  if (isWeekday) {
    if (currentTimeMinutes < marketOpenMinutes) {
      // Market opens today
      nextOpen = new Date(easternTime);
      nextOpen.setHours(9, 30, 0, 0);
      
      nextClose = new Date(easternTime);
      nextClose.setHours(16, 0, 0, 0);
    } else if (currentTimeMinutes < marketCloseMinutes) {
      // Market is open, closes today
      nextClose = new Date(easternTime);
      nextClose.setHours(16, 0, 0, 0);
      
      // Next open is tomorrow (or Monday if it's Friday)
      nextOpen = new Date(easternTime);
      if (dayOfWeek === 5) { // Friday
        nextOpen.setDate(nextOpen.getDate() + 3); // Monday
      } else {
        nextOpen.setDate(nextOpen.getDate() + 1); // Next day
      }
      nextOpen.setHours(9, 30, 0, 0);
    } else {
      // Market closed for today
      if (dayOfWeek === 5) { // Friday
        nextOpen = new Date(easternTime);
        nextOpen.setDate(nextOpen.getDate() + 3); // Monday
        nextOpen.setHours(9, 30, 0, 0);
      } else {
        nextOpen = new Date(easternTime);
        nextOpen.setDate(nextOpen.getDate() + 1); // Tomorrow
        nextOpen.setHours(9, 30, 0, 0);
      }
    }
  } else {
    // Weekend
    if (dayOfWeek === 0) { // Sunday
      nextOpen = new Date(easternTime);
      nextOpen.setDate(nextOpen.getDate() + 1); // Monday
      nextOpen.setHours(9, 30, 0, 0);
    } else { // Saturday
      nextOpen = new Date(easternTime);
      nextOpen.setDate(nextOpen.getDate() + 2); // Monday
      nextOpen.setHours(9, 30, 0, 0);
    }
  }
  
  return {
    isOpen,
    isMarketHours,
    nextOpen,
    nextClose,
    currentTime: easternTime,
    timezone: 'America/New_York'
  };
}

/**
 * Format time for display
 */
export function formatMarketTime(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

/**
 * Get a human-readable market status message
 */
export function getMarketStatusMessage(): string {
  const status = getMarketStatus();
  
  if (status.isOpen) {
    return `Market is open until ${formatMarketTime(status.nextClose!)}`;
  } else {
    if (status.nextOpen) {
      return `Market closed. Opens ${formatMarketTime(status.nextOpen)}`;
    } else {
      return 'Market is closed';
    }
  }
}

/**
 * Check if a given date/time is during market hours
 */
export function isDuringMarketHours(date: Date): boolean {
  return getMarketStatus(date).isMarketHours;
}

/**
 * Get the next market open time
 */
export function getNextMarketOpen(): Date | null {
  const status = getMarketStatus();
  return status.nextOpen || null;
}

/**
 * Get the next market close time
 */
export function getNextMarketClose(): Date | null {
  const status = getMarketStatus();
  return status.nextClose || null;
}
