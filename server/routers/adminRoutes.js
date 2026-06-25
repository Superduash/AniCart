const express = require('express');
const router = express.Router();
const { getAdminStats, reprocessProduct, reprocessAllProducts } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/stats', protect, adminOnly, getAdminStats);
router.post('/products/reprocess-all', protect, adminOnly, reprocessAllProducts);
router.post('/products/:id/reprocess', protect, adminOnly, reprocessProduct);

module.exports = router;
