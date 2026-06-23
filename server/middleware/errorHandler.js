/**
 * Error Handling Middleware
 * 
 * Centralized error handling for the Express application.
 * Handles different types of errors and returns consistent error responses.
 * In development, returns full error details including stack traces.
 * In production, returns sanitized error messages.
 */

const config = require('../config');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Handle Mongoose validation errors
 * @param {Error} err - Mongoose validation error
 * @returns {ApiError} - Formatted API error
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((val) => ({
    field: val.path,
    message: val.message,
  }));
  return ApiError.validationError('Validation failed', errors);
};

/**
 * Handle Mongoose duplicate key errors
 * @param {Error} err - Mongoose duplicate key error
 * @returns {ApiError} - Formatted API error
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists`;
  return ApiError.conflict(message);
};

/**
 * Handle Mongoose cast errors (invalid ObjectId)
 * @param {Error} err - Mongoose cast error
 * @returns {ApiError} - Formatted API error
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return ApiError.badRequest(message);
};

/**
 * Handle JWT errors
 * @param {Error} err - JWT error
 * @returns {ApiError} - Formatted API error
 */
const handleJWTError = () => {
  return ApiError.unauthorized('Invalid token. Please login again.');
};

/**
 * Handle JWT expiration errors
 * @param {Error} err - JWT expiration error
 * @returns {ApiError} - Formatted API error
 */
const handleJWTExpiredError = () => {
  return ApiError.unauthorized('Your token has expired. Please login again.');
};

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Set default error values
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal server error';

  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  logger.error('Unhandled request error', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }
  if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  }
  if (err.name === 'CastError') {
    error = handleCastError(err);
  }
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Build error response
  const response = {
    success: false,
    message: error.message || err.message,
  };

  // Add field-specific errors if available
  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors;
  }

  // Add stack trace in development mode
  if (config.isDevelopment) {
    response.stack = err.stack;
    response.error = err;
  }

  // Send response
  res.status(error.statusCode || err.statusCode).json(response);
};

/**
 * 404 Not Found handler for undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFound = (req, res, next) => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
};
