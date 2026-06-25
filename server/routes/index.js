/**
 * API v1 — aggregates domain routers (relative paths unchanged).
 */

const express = require('express');
const router = express.Router();
const { authLimiter, checkoutLimiter, apiLimiter } = require('../middlewares/rateLimiter');

const authRoutes = require('../routers/authRoutes');
const userRoutes = require('../routers/userRoutes');
const productRoutes = require('../routers/productRoutes');
const cartRoutes = require('../routers/cartRoutes');
const orderRoutes = require('../routers/orderRoutes');
const creatorRoutes = require('../routers/creatorRoutes');
const testRoutes = require('./testRoutes');
const debugRoutes = require('./debugRoutes');
const uploadRoutes = require('../routers/uploadRoutes');
const webhookRoutes = require('../routers/webhookRoutes');
const reviewRoutes = require('../routers/reviewRoutes');
const adminRoutes = require('../routers/adminRoutes');
const seoRoutes = require('../routers/seoRoutes');

router.use(apiLimiter);

router.use('/auth', authLimiter, authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', checkoutLimiter, orderRoutes);
router.use('/', creatorRoutes);
if (process.env.NODE_ENV !== 'production') {
  router.use('/test', testRoutes);
  router.use('/debug', debugRoutes);
}
router.use('/upload', uploadRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/', seoRoutes);

module.exports = router;
