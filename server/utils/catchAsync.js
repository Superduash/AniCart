/**
 * Catch Async Utility
 * 
 * Higher-order function that wraps async route handlers to catch errors
 * and pass them to Express error handling middleware.
 * Eliminates the need for try/catch blocks in every controller function.
 */

/**
 * Wraps an async function to catch errors and forward to error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    // Execute the async function and catch any errors
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
