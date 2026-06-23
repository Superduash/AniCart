/**
 * API v1 — aggregates domain routers (relative paths unchanged).
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('../routers/authRoutes');
const userRoutes = require('../routers/userRoutes');
const productRoutes = require('../routers/productRoutes');
const cartRoutes = require('../routers/cartRoutes');
const orderRoutes = require('../routers/orderRoutes');
const creatorRoutes = require('../routers/creatorRoutes');
const testRoutes = require('./testRoutes');
const debugRoutes = require('./debugRoutes');
const uploadRoutes = require('../routers/uploadRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/', creatorRoutes);
router.use('/test', testRoutes);
router.use('/debug', debugRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
