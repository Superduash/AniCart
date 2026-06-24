/**
 * Creator routes
 * Includes user creator-apply endpoint and admin review endpoints.
 */

const express = require('express');
const {
  applyCreator,
  getPendingCreatorRequests,
  approveCreator,
  rejectCreator,
  getCreatorProducts,
  getCreatorStats,
  createCreatorProduct,
} = require('../controllers/creatorController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  creatorApplyValidation,
  creatorReviewValidation,
} = require('../middleware/validateRequest');
// C5 Fix: models needed for inline delete route handler
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();

router.post('/creator/apply', protect, creatorApplyValidation, applyCreator);

router.post('/creator/products', protect, createCreatorProduct);
router.get('/creator/products', protect, getCreatorProducts);
router.get('/creator/stats', protect, getCreatorStats);

// C5 Fix: add missing DELETE route for creator product deletion
router.delete('/creator/products/:id', protect, async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, creator: req.user.id });
    if (!product) throw ApiError.notFound('Product not found or you do not own it');
    if (product.status === 'active') throw ApiError.badRequest('Cannot delete a live product — contact admin to deactivate it first');
    await product.deleteOne();
    res.status(200).json(successResponse({ message: 'Product deleted' }));
  } catch (err) { next(err); }
});

router.get('/admin/creator-requests', protect, adminOnly, getPendingCreatorRequests);
router.put(
  '/admin/creator-requests/:userId/approve',
  protect,
  adminOnly,
  creatorReviewValidation,
  approveCreator
);
router.put(
  '/admin/creator-requests/:userId/reject',
  protect,
  adminOnly,
  creatorReviewValidation,
  rejectCreator
);

module.exports = router;
