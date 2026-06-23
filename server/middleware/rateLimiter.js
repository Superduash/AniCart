/**
 * Rate Limiting Middleware
 * 
 * Configures rate limiting for different routes to prevent abuse.
 * Uses express-rate-limit with stricter limits for authentication routes.
 */

const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/apiError');

// NOTE: This limiter is process-local/in-memory and temporary for early phases.
// Day 9 plan: replace with Upstash Redis sliding-window rate limiting for shared counters.

/**
 * Create a custom rate limit handler
 * @param {string} message - Custom error message
 * @returns {Function} - Rate limit handler
 */
const createRateLimitHandler = (message) => {
  return (req, res, next, options) => {
    throw new ApiError(429, message || 'Too many requests, please try again later.');
  };
};

/**
 * Strict rate limiter for authentication routes
 * Limits: 10 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  handler: createRateLimitHandler('Too many authentication attempts. Please try again after 15 minutes.'),
  skipSuccessfulRequests: false, // Count all requests, even successful ones
});

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  handler: createRateLimitHandler('Too many requests. Please try again later.'),
});

/**
 * Stricter rate limiter for sensitive operations
 * Limits: 5 requests per 15 minutes per IP
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests for this operation. Please try again later.',
  },
  handler: createRateLimitHandler('Too many requests for this operation. Please try again later.'),
});

module.exports = {
  authLimiter,
  apiLimiter,
  strictLimiter,
};
