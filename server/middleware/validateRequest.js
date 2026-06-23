/**
 * Request Validation Middleware
 * 
 * Uses express-validator to validate and sanitize request data.
 * Provides validation chains for common fields and a middleware to check validation results.
 */

const { body, param, query, validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');
const { checkPasswordStrength } = require('../utils/passwordStrength');
const { isCommonPassword } = require('../utils/commonPasswords');

/**
 * Middleware to check validation results from express-validator
 * Throws ApiError with validation details if errors exist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }

  // Format errors for consistent response
  const formattedErrors = errors.array().map((error) => ({
    field: error.path || error.param,
    message: error.msg,
    value: error.value,
  }));

  // Throw validation error with user-friendly summary
  throw ApiError.validationError('Please correct the highlighted fields.', formattedErrors);
};

// ============================================
// Auth Validations
// ============================================

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .custom((value) => {
      if (isCommonPassword(value)) {
        throw new Error('This password is too common. Please choose a more secure password.');
      }

      const { strength } = checkPasswordStrength(value);
      if (strength === 'very_weak' || strength === 'weak') {
        throw new Error(
          'Password is too weak. Use at least 6-8 characters with letters and numbers.'
        );
      }

      return true;
    }),
  validate,
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
  validate,
];

const resendVerificationValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  validate,
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  validate,
];

const verifyEmailTokenValidation = [
  param('token')
    .trim()
    .notEmpty()
    .withMessage('Verification token is required'),
  validate,
];

const resetPasswordValidation = [
  param('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .custom((value) => {
      if (isCommonPassword(value)) {
        throw new Error('This password is too common. Please choose a more secure password.');
      }

      const { strength } = checkPasswordStrength(value);
      if (strength === 'very_weak' || strength === 'weak') {
        throw new Error(
          'Password is too weak. Use at least 6-8 characters with letters and numbers.'
        );
      }

      return true;
    }),
  validate,
];

// ============================================
// User Validations
// ============================================

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  validate,
];

const changePasswordValidation = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
  validate,
];

const creatorApplyValidation = [
  body('displayName')
    .trim()
    .notEmpty()
    .withMessage('Display name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Display name must be between 3 and 50 characters'),
  body('paymentEmail')
    .trim()
    .notEmpty()
    .withMessage('Payment email is required')
    .isEmail()
    .withMessage('Please enter a valid payment email')
    .normalizeEmail()
    .toLowerCase(),
  body('portfolioLink')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Portfolio link must be a valid URL'),
  body('rightsAgreement')
    .custom((value) => value === true || value === 'true')
    .withMessage('Rights agreement must be accepted'),
  validate,
];

const creatorReviewValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  validate,
];

// ============================================
// Product Validations
// ============================================

const createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 100 })
    .withMessage('Product name cannot exceed 100 characters'),
  body('series')
    .trim()
    .notEmpty()
    .withMessage('Series is required'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isInt({ min: 10, max: 10000 })
    .withMessage('Price must be between ₹10 and ₹10000'),
  body('img')
    .trim()
    .notEmpty()
    .withMessage('Product image URL is required')
    .isURL()
    .withMessage('Please enter a valid URL'),
  body('badge')
    .optional()
    .trim()
    .isIn(['HOT', 'NEW', 'BESTSELLER', 'CLASSIC', 'PREMIUM', ''])
    .withMessage('Invalid badge value'),
  body('badgeType')
    .optional()
    .trim()
    .isIn(['neon', 'pink', ''])
    .withMessage('Invalid badge type'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  body('reviews')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reviews count must be a positive integer'),
  body('resolution')
    .optional()
    .trim(),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  validate,
];

const updateProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Product name cannot exceed 100 characters'),
  body('series')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Series cannot be empty'),
  body('price')
    .optional()
    .isInt({ min: 10, max: 10000 })
    .withMessage('Price must be between ₹10 and ₹10000'),
  body('img')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Image URL cannot be empty')
    .isURL()
    .withMessage('Please enter a valid URL'),
  body('badge')
    .optional()
    .trim()
    .isIn(['HOT', 'NEW', 'BESTSELLER', 'CLASSIC', 'PREMIUM', ''])
    .withMessage('Invalid badge value'),
  body('badgeType')
    .optional()
    .trim()
    .isIn(['neon', 'pink', ''])
    .withMessage('Invalid badge type'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  body('reviews')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reviews count must be a positive integer'),
  validate,
];

const productIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  validate,
];

// ============================================
// Cart Validations
// ============================================

const addToCartValidation = [
  body('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),
  validate,
];

const updateCartValidation = [
  body('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  validate,
];

const removeFromCartValidation = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  validate,
];

// ============================================
// Order Validations
// ============================================

const orderIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID'),
  validate,
];

// ============================================
// Pagination Validations
// ============================================

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  resendVerificationValidation,
  forgotPasswordValidation,
  verifyEmailTokenValidation,
  resetPasswordValidation,
  updateProfileValidation,
  changePasswordValidation,
  creatorApplyValidation,
  creatorReviewValidation,
  createProductValidation,
  updateProductValidation,
  productIdValidation,
  addToCartValidation,
  updateCartValidation,
  removeFromCartValidation,
  orderIdValidation,
  paginationValidation,
};
