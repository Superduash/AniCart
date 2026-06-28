/**
 * BullMQ Queue Configuration
 *
 * Defines the image-processing queue with rate limiting and job options.
 */

const { Queue, RateLimitError } = require('bullmq');
const { redisConnection } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Image Processing Queue
 * Handles background image processing jobs
 *
 * Rate Limiting: 10 jobs per minute per creatorId
 */
const imageProcessingQueue = redisConnection
  ? new Queue('image-processing', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
      limiter: {
        max: 10,
        duration: 60000, // 10 jobs per minute
      },
    })
  : null;

if (!imageProcessingQueue) {
  logger.warn('⚠ BullMQ Queue is disabled: Running in fallback mode (synchronous in background).');
}

/**
 * Get rate limit key for a creator
 * Used by the worker for per-creator rate limiting
 */
function getRateLimitKey(creatorId) {
  return `rate-limit:${creatorId}`;
}

/**
 * Enqueue an image processing job
 * @param {Object} params - Job parameters
 * @param {string} params.productId - MongoDB product ID
 * @param {string} params.r2OriginalKey - R2 key for original image
 * @param {string} params.creatorId - Creator user ID for rate limiting
 * @returns {Promise<Object>} - BullMQ Job instance or fallback result
 */
async function enqueueImageProcessing({ productId, r2OriginalKey, creatorId }) {
  if (imageProcessingQueue) {
    const job = await imageProcessingQueue.add(
      'process-image',
      {
        productId,
        r2OriginalKey,
        creatorId,
      },
      {
        jobId: `process-${productId}`,
        // Group key for per-creator rate limiting
        group: {
          id: creatorId,
          limit: {
            max: 10,
            duration: 60000,
          },
        },
      }
    );
    return job;
  } else {
    logger.info(`[Fallback Processing] Processing image for product: ${productId} synchronously in background`);
    setImmediate(async () => {
      try {
        const { processImageDirectly } = require('./imageProcessor');
        await processImageDirectly({ productId, r2OriginalKey, creatorId });
      } catch (err) {
        logger.error(`[Fallback Processing] Synchronous image processing failed for product ${productId}:`, err);
      }
    });
    return {
      id: `sync-${productId}`,
      state: 'completed',
      progress: 100,
      timestamp: Date.now(),
    };
  }
}

/**
 * Get job status by product ID
 * @param {string} productId - MongoDB product ID
 * @returns {Promise<Object|null>} - Job status or null
 */
async function getJobStatus(productId) {
  if (imageProcessingQueue) {
    const jobId = `process-${productId}`;
    const job = await imageProcessingQueue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    let progress = 0;
    try {
      if (typeof job.progress === 'function') {
        progress = await job.progress();
      } else if (typeof job.progress === 'number') {
        progress = job.progress;
      } else if (job._progress && typeof job._progress === 'number') {
        progress = job._progress;
      }
    } catch (err) {
      // Some BullMQ versions expose progress differently; default to 0 on error
      progress = 0;
    }

    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  } else {
    const Product = require('../models/Product');
    const product = await Product.findById(productId);
    if (!product) {
      return null;
    }

    let state = 'waiting';
    let progress = 0;

    if (product.assets && product.assets.status === 'ready') {
      state = 'completed';
      progress = 100;
    } else if (product.assets && product.assets.status === 'flagged') {
      state = 'failed';
    } else if (product.status === 'active') {
      state = 'completed';
      progress = 100;
    } else if (product.status === 'review') {
      state = 'failed';
    }

    return {
      id: `sync-${productId}`,
      state,
      progress,
      data: { productId },
      timestamp: product.createdAt ? new Date(product.createdAt).getTime() : Date.now(),
    };
  }
}

module.exports = {
  imageProcessingQueue,
  enqueueImageProcessing,
  getJobStatus,
};
