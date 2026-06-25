const express = require('express');
const router = express.Router();
const { getAdminStats, reprocessProduct, reprocessAllProducts } = require('../controllers/adminController');
const { getProductForAdminEdit, updateProductForAdmin, updateProductAssets, deleteProductAsAdmin } = require('../controllers/adminProductController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/stats', protect, adminOnly, getAdminStats);
router.post('/products/reprocess-all', protect, adminOnly, reprocessAllProducts);
router.post('/products/:id/reprocess', protect, adminOnly, reprocessProduct);

// Admin product editing endpoints
router.get('/products/:id', protect, adminOnly, getProductForAdminEdit);
router.patch('/products/:id', protect, adminOnly, updateProductForAdmin);
router.patch('/products/:id/assets', protect, adminOnly, updateProductAssets);
router.delete('/products/:id', protect, adminOnly, deleteProductAsAdmin);

module.exports = router;
