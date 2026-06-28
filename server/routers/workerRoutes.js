/**
 * Worker Routes
 *
 * - Health check endpoint for worker status
 * - Bull Board dashboard for BullMQ queue monitoring
 */

const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { imageProcessingQueue } = require('../jobs/queues');
const { redisConnection } = require('../config/redis');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * Worker Health Check
 * GET /api/v1/worker/health
 */
router.get('/health', async (req, res) => {
  // Check Redis connection
  let redisStatus = redisConnection ? 'configured' : 'disabled';

  // Check MongoDB connection
  let mongoStatus = 'disconnected';
  try {
    if (mongoose.connection.readyState === 1) {
      mongoStatus = 'connected';
    }
  } catch (err) {
    mongoStatus = 'error';
  }

  // Overall status
  const status = (redisStatus === 'configured' || redisStatus === 'disabled') && mongoStatus === 'connected' ? 'ok' : 'degraded';

  res.status(200).json({
    status,
    worker: 'running',
    redis: redisStatus,
    mongodb: mongoStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Bull Board Dashboard Setup
 * Mounted at /admin/queues
 */
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(imageProcessingQueue)],
  serverAdapter,
});

module.exports = { router, serverAdapter };
