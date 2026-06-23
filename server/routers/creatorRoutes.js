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
} = require('../controllers/creatorController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  creatorApplyValidation,
  creatorReviewValidation,
} = require('../middleware/validateRequest');

const router = express.Router();

router.post('/creator/apply', protect, creatorApplyValidation, applyCreator);

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
