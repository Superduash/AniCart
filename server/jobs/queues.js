/**
 * BullMQ Queue Configuration
 *
 * Defines the image-processing queue with rate limiting and job options.
 */

const { Queue, RateLimitError } = require('bullmq');
const { redisConnection } = require('../config/redis');

/**
 * Image Processing Queue
 * Handles background image processing jobs
 *
 * Rate Limiting: 10 jobs per minute per creatorId
 */
const imageProcessingQueue = new Queue('image-processing', {
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
});

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
 * @returns {Promise<Job>} - BullMQ Job instance
 */
async function enqueueImageProcessing({ productId, r2OriginalKey, creatorId }) {
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
}

/**
 * Get job status by product ID
 * @param {string} productId - MongoDB product ID
 * @returns {Promise<Object|null>} - Job status or null
 */
async function getJobStatus(productId) {
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
}

module.exports = {
  imageProcessingQueue,
  enqueueImageProcessing,
  getJobStatus,
};
