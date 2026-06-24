const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/v1/reviews/:productId
 * @desc    Create a review for a product
 * @access  Private
 */
router.post('/:productId', protect, createReview);

/**
 * @route   GET /api/v1/reviews/:productId
 * @desc    Get all reviews for a product
 * @access  Public
 */
router.get('/:productId', getProductReviews);

/**
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete a review
 * @access  Private
 */
router.delete('/:id', protect, deleteReview);

module.exports = router;
