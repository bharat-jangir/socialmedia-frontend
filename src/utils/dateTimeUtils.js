/**
 * Centralized Date/Time Utility for the Application
 * 
 * This utility handles all date/time formatting across the application.
 * It assumes backend sends timestamps in UTC and converts them to the user's local timezone.
 * 
 * Key Features:
 * - Converts UTC timestamps to user's local timezone automatically
 * - Handles multiple input formats (ISO strings, arrays, numbers, Date objects)
 * - Provides various formatting options (time, date, relative time)
 * - Works globally for any country/timezone
 */

/**
 * Parse a date input from various formats (UTC from backend) to a JavaScript Date object
 * @param {*} dateInput - Can be ISO string, array, number, Date object, or object with date fields
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
export const parseDate = (dateInput) => {
  if (!dateInput) return null;

  try {
    let date;

    // Handle array format from Java LocalDateTime [year, month, day, hour, minute, second, nanosecond]
    if (Array.isArray(dateInput) && dateInput.length >= 6) {
      // Java LocalDateTime array: [year, month, day, hour, minute, second]
      // Note: Java months are 1-12, JavaScript months are 0-11
      // IMPORTANT: Backend LocalDateTime doesn't include timezone, treat as UTC
      date = new Date(Date.UTC(
        dateInput[0],
        dateInput[1] - 1,
        dateInput[2],
        dateInput[3],
        dateInput[4],
        dateInput[5] || 0
      ));
    } else if (typeof dateInput === 'string') {
      // Handle ISO string format (most common from backend)
      // If string is just numbers, parse as number
      if (/^\d+$/.test(dateInput)) {
        date = new Date(parseInt(dateInput));
      } else {
        // Backend sends LocalDateTime as ISO string without timezone (e.g., "2024-12-19T12:19:00")
        // IMPORTANT: The backend stores times in the database's timezone (which should be UTC)
        // but LocalDateTime doesn't include timezone info. We need to interpret these correctly.
        // Check if it's an ISO date-time string without timezone (has 'T' but no 'Z', '+', or timezone offset)
        const isoDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/;
        if (isoDateTimePattern.test(dateInput)) {
          // ISO format without timezone - backend stores in UTC, but sends as local
          // Since the database connection uses serverTimezone=UTC, the times are actually in UTC
          // Treat as UTC by appending 'Z' so JavaScript converts to user's local timezone
          date = new Date(dateInput + 'Z');
        } else if (dateInput.includes('Z') || dateInput.includes('+') || dateInput.includes('-', 10)) {
          // ISO string with timezone info - parse normally
          date = new Date(dateInput);
        } else {
          // Other formats - try parsing as-is, then convert if needed
          date = new Date(dateInput);
          // If parsing failed or seems wrong, try treating as UTC
          if (isNaN(date.getTime()) && dateInput.includes('T')) {
            date = new Date(dateInput + 'Z');
          }
        }
      }
    } else if (typeof dateInput === 'number') {
      // If number is very small, might be a partial timestamp
      // Assume it's milliseconds if > 1000000000000 (year ~2001), otherwise seconds
      if (dateInput > 1000000000000) {
        date = new Date(dateInput);
      } else if (dateInput > 0) {
        date = new Date(dateInput * 1000);
      } else {
        return null;
      }
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'object' && dateInput !== null) {
      // Try to extract date from object (might have timestamp or other date fields)
      const timestamp = dateInput.timestamp || dateInput.createdAt || dateInput.time || dateInput.updatedAt;
      if (timestamp) {
        return parseDate(timestamp);
      }
      return null;
    } else {
      return null;
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateInput);
      return null;
    }

    return date;
  } catch (error) {
    console.error('Error parsing date:', error, dateInput);
    return null;
  }
};

/**
 * Format time for messages (shows time if today, date if older)
 * Automatically uses user's local timezone
 * @param {*} dateInput - Date input in various formats
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted time string
 */
export const formatMessageTime = (dateInput, options = {}) => {
  const date = parseDate(dateInput);
  if (!date) return '';

  const {
    locale = navigator.language || 'en-US',
    hour12 = true,
    showSeconds = false
  } = options;

  try {
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      // Show time for today's messages
      return date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: showSeconds ? '2-digit' : undefined,
        hour12: hour12
      });
    } else {
      // Show date for older messages
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch (error) {
    console.error('Error formatting message time:', error, dateInput);
    return '';
  }
};

/**
 * Format relative time (e.g., "2m ago", "3h ago", "2d ago")
 * Automatically uses user's local timezone
 * @param {*} dateInput - Date input in various formats
 * @returns {string} - Relative time string
 */
export const formatTimeAgo = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return '';

  try {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      // For older dates, show actual date
      const locale = navigator.language || 'en-US';
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch (error) {
    console.error('Error formatting time ago:', error, dateInput);
    return '';
  }
};

/**
 * Format full date and time
 * Automatically uses user's local timezone
 * @param {*} dateInput - Date input in various formats
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date and time string
 */
export const formatDateTime = (dateInput, options = {}) => {
  const date = parseDate(dateInput);
  if (!date) return '';

  const {
    locale = navigator.language || 'en-US',
    hour12 = true,
    includeSeconds = false
  } = options;

  try {
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: hour12
    });
  } catch (error) {
    console.error('Error formatting date time:', error, dateInput);
    return '';
  }
};

/**
 * Format date only (no time)
 * Automatically uses user's local timezone
 * @param {*} dateInput - Date input in various formats
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateInput, options = {}) => {
  const date = parseDate(dateInput);
  if (!date) return '';

  const {
    locale = navigator.language || 'en-US',
    includeYear = true
  } = options;

  try {
    const now = new Date();
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: includeYear && date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch (error) {
    console.error('Error formatting date:', error, dateInput);
    return '';
  }
};

/**
 * Format time only (no date)
 * Automatically uses user's local timezone
 * @param {*} dateInput - Date input in various formats
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted time string
 */
export const formatTime = (dateInput, options = {}) => {
  const date = parseDate(dateInput);
  if (!date) return '';

  const {
    locale = navigator.language || 'en-US',
    hour12 = true,
    includeSeconds = false
  } = options;

  try {
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: hour12
    });
  } catch (error) {
    console.error('Error formatting time:', error, dateInput);
    return '';
  }
};

/**
 * Check if a date is today
 * @param {*} dateInput - Date input in various formats
 * @returns {boolean} - True if date is today
 */
export const isToday = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return false;

  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
};

/**
 * Check if a date is yesterday
 * @param {*} dateInput - Date input in various formats
 * @returns {boolean} - True if date is yesterday
 */
export const isYesterday = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return false;

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Get user's timezone automatically
 * @returns {string} - User's timezone (e.g., "Asia/Kolkata", "America/New_York")
 */
export const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Get user's locale automatically
 * @returns {string} - User's locale (e.g., "en-IN", "en-US")
 */
export const getUserLocale = () => {
  return navigator.language || 'en-US';
};

