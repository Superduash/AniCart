/**
 * Order Routes
 * 
 * Defines routes for order operations including checkout,
 * retrieving order history, and getting order details.
 */

const express = require('express');
const router = express.Router();

// Import controller functions
const {
  checkout,
  getOrders,
  getOrder,
  cancelOrder,
  getOrderStats,
} = require('../controllers/orderController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  orderIdValidation,
  paginationValidation,
} = require('../middleware/validateRequest');

/**
 * @route   POST /api/orders/checkout
 * @desc    Create order from cart (checkout)
 * @access  Private
 */
router.post('/checkout', protect, apiLimiter, checkout);

/**
 * @route   GET /api/orders
 * @desc    Get user's order history
 * @access  Private
 */
router.get('/', protect, paginationValidation, getOrders);

/**
 * @route   GET /api/orders/stats/summary
 * @desc    Get order statistics for user
 * @access  Private
 */
router.get('/stats/summary', protect, getOrderStats);

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order detail
 * @access  Private
 */
router.get('/:id', protect, orderIdValidation, getOrder);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private
 */
router.put('/:id/cancel', protect, orderIdValidation, cancelOrder);

module.exports = router;
