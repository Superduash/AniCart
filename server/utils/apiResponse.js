/**
 * API Response Utility
 * 
 * Provides standardized success response formatting for all API endpoints.
 * Ensures consistent response structure across the application.
 */

/**
 * Create a standardized success response
 * @param {Object} options - Response options
 * @param {string} options.message - Success message
 * @param {*} options.data - Response data payload
 * @param {Object} options.meta - Additional metadata (pagination, etc.)
 * @returns {Object} - Formatted success response object
 */
const successResponse = ({ message = 'Success', data = null, meta = null }) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
};

/**
 * Create a success response with pagination metadata
 * @param {Object} options - Response options
 * @param {string} options.message - Success message
 * @param {Array} options.data - Array of items
 * @param {number} options.page - Current page number
 * @param {number} options.limit - Items per page
 * @param {number} options.total - Total number of items
 * @returns {Object} - Formatted paginated response
 */
const paginatedResponse = ({ 
  message = 'Success', 
  data = [], 
  page = 1, 
  limit = 10, 
  total = 0 
}) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    message,
    data,
    meta: {
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  };
};

module.exports = {
  successResponse,
  paginatedResponse,
};
