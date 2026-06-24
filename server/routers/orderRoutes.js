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
  createPaymentIntent,
  getOrders,
  getOrder,
  cancelOrder,
  getOrderStats,
  getStripeConfig,
} = require('../controllers/orderController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  orderIdValidation,
  paginationValidation,
} = require('../middleware/validateRequest');

/**
 * @route   GET /api/orders/config
 * @desc    Get Stripe Config
 * @access  Public
 */
router.get('/config', getStripeConfig);

/**
 * @route   POST /api/orders/create-payment-intent
 * @desc    Create Stripe PaymentIntent
 * @access  Private
 */
router.post('/create-payment-intent', protect, apiLimiter, createPaymentIntent);

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
