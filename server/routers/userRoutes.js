/**
 * User Routes
 * 
 * Defines routes for user profile operations including retrieving
 * profile, updating profile, and changing passwords.
 */

const express = require('express');
const router = express.Router();

// Import controller functions
const {
  getProfile,
  updateProfile,
  changePassword,
  getLibrary,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkProductOwnership,  // H8 Fix
} = require('../controllers/userController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');
const { strictLimiter } = require('../middleware/rateLimiter');
const {
  updateProfileValidation,
  changePasswordValidation,
} = require('../middleware/validateRequest');

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', protect, getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, updateProfileValidation, updateProfile);

/**
 * @route   PUT /api/users/password
 * @desc    Change user password
 * @access  Private
 */
router.put('/password', protect, strictLimiter, changePasswordValidation, changePassword);

/**
 * @route   GET /api/users/library
 * @desc    Get user's purchased wallpapers library
 * @access  Private
 */
router.get('/library', protect, getLibrary);

/**
 * @route   GET /api/users/library/:productId
 * @desc    H8 Fix: Check if user owns a specific product (dedicated endpoint, avoids fetching entire library)
 * @access  Private
 */
router.get('/library/:productId', protect, checkProductOwnership);

/**
 * @route   GET /api/users/wishlist
 * @desc    Get user wishlist
 * @access  Private
 */
router.get('/wishlist', protect, getWishlist);

/**
 * @route   POST /api/users/wishlist/:productId
 * @desc    Add product to wishlist
 * @access  Private
 */
router.post('/wishlist/:productId', protect, addToWishlist);

/**
 * @route   DELETE /api/users/wishlist/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
router.delete('/wishlist/:productId', protect, removeFromWishlist);

module.exports = router;
