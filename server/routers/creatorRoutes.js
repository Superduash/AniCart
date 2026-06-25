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
  connectStripe,
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

// Stripe Connect Mock Endpoints (Portfolio Mode)
router.post('/creator/connect', protect, connectStripe);

// C5 Fix: add missing DELETE route for creator product deletion
router.delete('/creator/products/:id', protect, async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, creatorId: req.user.id });
    if (!product) throw ApiError.notFound('Product not found or you do not own it');
    // Creators can only delete non-active products; admins have a separate route
    if (product.status === 'active') throw ApiError.badRequest('Cannot delete a live product — contact admin to deactivate it first');
    await product.deleteOne();
    res.status(200).json(successResponse({ message: 'Product deleted' }));
  } catch (err) { next(err); }
});

// Admin route: delete any product regardless of status with full cleanup
router.delete('/admin/products/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw ApiError.notFound('Product not found');
    
    // Dynamic import for storage cleanup
    const config = require('../config');
    const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const Cart = require('../models/Cart');
    const User = require('../models/User');
    
    // Clean up carts and wishlists
    await Cart.updateMany(
      { 'items.product': req.params.id },
      { $pull: { items: { product: req.params.id } } }
    );
    await User.updateMany(
      { wishlist: req.params.id },
      { $pull: { wishlist: req.params.id } }
    );
    
    // Delete assets from R2/S3 storage
    if (config.R2_ACCOUNT_ID && config.R2_ACCESS_KEY_ID) {
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.R2_ACCESS_KEY_ID,
          secretAccessKey: config.R2_SECRET_ACCESS_KEY,
        },
      });
      
      const assetKeys = [];
      ['preview', 'thumbnail', 'original', '4k', '2k', '1080p'].forEach(resKey => {
        if (product.assets && product.assets[resKey] && product.assets[resKey].key) {
          assetKeys.push(product.assets[resKey].key);
        }
      });

      for (const key of assetKeys) {
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: config.R2_BUCKET_NAME,
            Key: key,
          }));
        } catch (err) {
          console.error(`Failed to delete asset ${key} from R2:`, err);
        }
      }
    }
    
    // Admins can permanently delete any product including live ones
    await product.deleteOne();
    res.status(200).json(successResponse({ message: 'Product permanently deleted by admin' }));
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
