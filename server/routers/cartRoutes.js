/**
 * Cart Routes
 * 
 * Defines routes for cart operations including retrieving cart,
 * adding items, updating quantities, removing items, and clearing cart.
 */

const express = require('express');
const router = express.Router();

// Import controller functions
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart,
} = require('../controllers/cartController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  addToCartValidation,
  updateCartValidation,
  removeFromCartValidation,
} = require('../middleware/validateRequest');

/**
 * @route   GET /api/cart
 * @desc    Get user's cart with populated product details
 * @access  Private
 */
router.get('/', protect, getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Add product to cart
 * @access  Private
 */
router.post('/add', protect, apiLimiter, addToCartValidation, addToCart);

/**
 * @route   PUT /api/cart/update
 * @desc    Update item quantity in cart
 * @access  Private
 */
router.put('/update', protect, apiLimiter, updateCartValidation, updateCartItem);

/**
 * @route   DELETE /api/cart/remove/:productId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/remove/:productId', protect, apiLimiter, removeFromCartValidation, removeFromCart);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/clear', protect, clearCart);

/**
 * @route   POST /api/cart/sync
 * @desc    Sync cart with client-side cart
 * @access  Private
 */
router.post('/sync', protect, syncCart);

module.exports = router;
