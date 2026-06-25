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
  downloadProduct,
  getPendingProducts,
  approveProduct,
  rejectProduct,
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
 * @route   GET /api/products/admin/pending
 * @desc    Get all pending products
 * @access  Private/Admin
 * NOTE: This MUST come before /:id to prevent Express from matching 'admin' as an id
 */
router.get('/admin/pending', protect, adminOnly, paginationValidation, getPendingProducts);

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
 * @desc    Delete or archive product (Admin or Creator)
 * @access  Private
 */
router.delete('/:id', protect, productIdValidation, deleteProduct);

/**
 * @route   PUT /api/products/:id/restore
 * @desc    Restore soft-deleted product
 * @access  Private/Admin
 */
router.put('/:id/restore', protect, adminOnly, productIdValidation, restoreProduct);

/**
 * @route   GET /api/products/:id/download
 * @desc    Get presigned download URL
 * @access  Private
 */
router.get('/:id/download', protect, productIdValidation, downloadProduct);

/**
 * @route   PUT /api/products/:id/approve
 * @desc    Approve pending product
 * @access  Private/Admin
 */
router.put('/:id/approve', protect, adminOnly, productIdValidation, approveProduct);

/**
 * @route   PUT /api/products/:id/reject
 * @desc    Reject pending product
 * @access  Private/Admin
 */
router.put('/:id/reject', protect, adminOnly, productIdValidation, rejectProduct);

module.exports = router;
