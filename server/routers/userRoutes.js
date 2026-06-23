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

module.exports = router;
