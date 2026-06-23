/**
 * API Error Class
 * 
 * Custom error class for API errors that includes HTTP status code
 * and optional array of field-specific error details.
 * Extends the native Error class for seamless integration with Express.
 */

class ApiError extends Error {
  /**
   * Create an API error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Array} errors - Array of field-specific errors [{ field, message }]
   * @param {boolean} isOperational - Whether error is operational (expected) or programming error
   */
  constructor(statusCode, message, errors = [], isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    
    // Maintain proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   * @param {string} message - Error message
   * @param {Array} errors - Field-specific errors
   * @returns {ApiError}
   */
  static badRequest(message = 'Bad Request', errors = []) {
    return new ApiError(400, message, errors);
  }

  /**
   * Create a 401 Unauthorized error
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  /**
   * Create a 403 Forbidden error
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  /**
   * Create a 404 Not Found error
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  /**
   * Create a 409 Conflict error
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }

  /**
   * Create a 422 Unprocessable Entity error
   * @param {string} message - Error message
   * @param {Array} errors - Field-specific validation errors
   * @returns {ApiError}
   */
  static validationError(message = 'Validation failed', errors = []) {
    return new ApiError(422, message, errors);
  }

  /**
   * Create a 500 Internal Server Error
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static internal(message = 'Internal server error') {
    return new ApiError(500, message, [], false);
  }
}

module.exports = ApiError;
