/**
 * Product Routes
 * 
 * Defines routes for product operations including listing, retrieving,
 * creating, updating, and soft-deleting products.
 */

const express = require('express');
const router = express.Router();

// Import controller functions
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSeries,
  restoreProduct,
} = require('../controllers/productController');

// Import middleware
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  createProductValidation,
  updateProductValidation,
  productIdValidation,
  paginationValidation,
} = require('../middleware/validateRequest');

/**
 * @route   GET /api/products
 * @desc    Get all products with optional filtering and pagination
 * @access  Public
 */
router.get('/', apiLimiter, paginationValidation, getProducts);

/**
 * @route   GET /api/products/series/list
 * @desc    Get all product series for filters
 * @access  Public
 */
router.get('/series/list', getSeries);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private/Admin
 */
router.post('/', protect, adminOnly, createProductValidation, createProduct);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id', apiLimiter, productIdValidation, getProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private/Admin
 */
router.put('/:id', protect, adminOnly, updateProductValidation, updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Soft delete product
 * @access  Private/Admin
 */
router.delete('/:id', protect, adminOnly, productIdValidation, deleteProduct);

/**
 * @route   PUT /api/products/:id/restore
 * @desc    Restore soft-deleted product
 * @access  Private/Admin
 */
router.put('/:id/restore', protect, adminOnly, productIdValidation, restoreProduct);

module.exports = router;
