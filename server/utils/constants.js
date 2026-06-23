/**
 * Constants Module
 * 
 * Centralizes all application constants for easy maintenance and consistency.
 */

const CONSTANTS = {
  // User roles
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    CREATOR: 'creator',
  },

  // Order statuses
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // Product badges
  BADGES: {
    HOT: 'HOT',
    NEW: 'NEW',
    BESTSELLER: 'BESTSELLER',
    CLASSIC: 'CLASSIC',
    PREMIUM: 'PREMIUM',
  },

  // Badge types
  BADGE_TYPES: {
    NEON: 'neon',
    PINK: 'pink',
  },

  // Default values
  DEFAULTS: {
    USER_POINTS: 150,
    USER_STREAK_DAYS: 1,
    USER_PURCHASES_COUNT: 0,
    PRODUCT_RATING: 0,
    PRODUCT_REVIEWS: 0,
    TAX_RATE: 0.08,
    PAGE_LIMIT: 10,
    MAX_PAGE_LIMIT: 100,
  },

  // Validation limits
  LIMITS: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    PRODUCT_NAME_MAX_LENGTH: 100,
    PASSWORD_MIN_LENGTH: 8,
    MAX_PAGE_SIZE: 100,
  },

  // Rate limiting
  RATE_LIMIT: {
    AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    AUTH_MAX_REQUESTS: 10,
    API_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    API_MAX_REQUESTS: 100,
  },

  // Cookie settings
  COOKIE: {
    REFRESH_TOKEN_NAME: 'refreshToken',
    MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // HTTP Status codes (for reference)
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },
};

module.exports = CONSTANTS;
