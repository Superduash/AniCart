/**
 * BullMQ Worker for Image Processing
 *
 * Processes uploaded images in the background:
 * - Downloads original from R2
 * - Generates variants (4K, 2K, 1080p, preview, thumbnail)
 * - Uploads variants to R2
 * - Updates Product document with processed assets
 *
 * Production-hardened with:
 * - Sharp memory protection
 * - Worker monitoring
 * - Graceful error handling
 */

const { Worker } = require('bullmq');
const sharp = require('sharp');
const { GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { redisConnection } = require('../config/redis');
const { s3Client, bucketName, publicUrl } = require('../config/r2');
const Product = require('../models/Product');
const uploadService = require('../services/uploadService');
const logger = require('../utils/logger');

// Sharp Memory Protection
sharp.concurrency(1);
sharp.cache(false);

// Configuration
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const WATERMARK_OPACITY = 0.25;
const WATERMARK_PATH = require('path').join(__dirname, '..', 'assets', 'watermark.png');

const PAID_VARIANT_CONFIG = {
  '4k': { width: 3840, quality: 88, effort: 4, mimeType: 'image/webp' },
  '2k': { width: 2560, quality: 85, effort: 4, mimeType: 'image/webp' },
  '1080p': { width: 1920, quality: 82, effort: 4, mimeType: 'image/webp' },
  '720p': { width: 1280, quality: 80, effort: 4, mimeType: 'image/webp' },
  'mobile-portrait': { width: 1080, height: 1920, quality: 82, effort: 4, mimeType: 'image/webp' },
  'mobile-landscape': { width: 1920, height: 1080, quality: 82, effort: 4, mimeType: 'image/webp' },
};

const PUBLIC_VARIANT_CONFIG = {
  preview: { width: 1280, quality: 70, mimeType: 'image/jpeg', format: 'jpeg', progressive: true },
  thumbnail: { width: 400, quality: 55, effort: 2, mimeType: 'image/webp', format: 'webp' },
};

const resolutionService = require('../services/resolutionService');

let watermarkOverlayBufferPromise = null;

/**
 * Get watermark buffer with applied opacity
 */
async function getWatermarkOverlayBuffer() {
  if (!watermarkOverlayBufferPromise) {
    watermarkOverlayBufferPromise = (async () => {
      const fs = require('fs/promises');
      const watermarkFileBuffer = await fs.readFile(WATERMARK_PATH);

      const { data, info } = await sharp(watermarkFileBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const alphaChannelOffset = 3;
      const channels = info.channels;

      for (let i = alphaChannelOffset; i < data.length; i += channels) {
        data[i] = Math.round(data[i] * WATERMARK_OPACITY);
      }

      return sharp(data, { raw: info }).png().toBuffer();
    })().catch((error) => {
      watermarkOverlayBufferPromise = null;
      throw error;
    });
  }

  return watermarkOverlayBufferPromise;
}

/**
 * Determine available resolutions based on image width
 */
function determineAvailableResolutions(width) {
  // All images get mobile variants, desktop variants depend on width
  const baseResolutions = ['mobile-portrait', 'mobile-landscape', '720p'];
  if (width >= 3840) return ['4k', '2k', '1080p', ...baseResolutions];
  if (width >= 2560) return ['2k', '1080p', ...baseResolutions];
  if (width >= 1280) return ['1080p', ...baseResolutions];
  if (width >= 720) return baseResolutions;
  return ['mobile-portrait', 'mobile-landscape'];
}

/**
 * Build WebP variant buffer (standard resize maintaining aspect ratio)
 */
async function buildWebpVariant(buffer, width, quality, effort = 4) {
  return sharp(buffer)
    .resize({
      width,
      fit: 'inside',
      kernel: sharp.kernel.lanczos3,
    })
    .webp({ quality, effort })
    .toBuffer();
}

/**
 * Build mobile variant buffer (crop to exact dimensions for mobile screens)
 * For portrait: 1080x1920 (9:16)
 * For landscape: 1920x1080 (16:9)
 */
async function buildMobileVariant(buffer, width, height, quality, effort = 4) {
  return sharp(buffer)
    .resize({
      width,
      height,
      fit: 'cover',
      position: 'center',
      kernel: sharp.kernel.lanczos3,
    })
    .webp({ quality, effort })
    .toBuffer();
}

/**
 * Build preview variant with watermark (for paid products)
 */
async function buildPreviewVariantWithWatermark(buffer, width, quality, progressive = true) {
  const watermarkOverlayBuffer = await getWatermarkOverlayBuffer();

  return sharp(buffer)
    .resize({
      width,
      withoutEnlargement: true,
      fit: 'inside',
      kernel: sharp.kernel.lanczos3,
    })
    .composite([{ input: watermarkOverlayBuffer, gravity: 'center' }])
    .jpeg({ quality, progressive })
    .toBuffer();
}

/**
 * Build preview variant without watermark (for free products)
 */
async function buildPreviewVariant(buffer, width, quality, progressive = true) {
  return sharp(buffer)
    .resize({
      width,
      withoutEnlargement: true,
      fit: 'inside',
      kernel: sharp.kernel.lanczos3,
    })
    .jpeg({ quality, progressive })
    .toBuffer();
}

/**
 * Download original image from R2
 */
async function downloadFromR2(key) {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );

  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Process image job
 */
async function processImageJob(job) {
  const startTime = Date.now();
  const { productId, r2OriginalKey, creatorId } = job.data;

  console.log(`[Worker] Starting image processing for product ${productId}`);

  // Step 1: Update progress to 0%
  await job.updateProgress(0);

  // Get product
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  // Step 2: Download original from R2
  console.log(`[Worker] Downloading original from R2: ${r2OriginalKey}`);
  const originalBuffer = await downloadFromR2(r2OriginalKey);

  // Step 3: Check file size (> 50MB = flagged)
  if (originalBuffer.length > MAX_FILE_SIZE_BYTES) {
    console.log(`[Worker] File too large (${originalBuffer.length} bytes), flagging product`);
    product.assets.status = 'failed';
    await product.save();
    return { status: 'failed', reason: 'File too large' };
  }

  // Step 4: Update progress to 30%
  await job.updateProgress(30);

  // Get metadata
  const metadata = await sharp(originalBuffer).metadata();
  const availableResolutions = determineAvailableResolutions(metadata.width);

  if (availableResolutions.length === 0) {
    throw new Error('Image too small, minimum width is 1280px');
  }

  // Step 5: Generate variants
  console.log(`[Worker] Generating variants for resolutions: ${availableResolutions.join(', ')}`);

const privateAssets = {
    original: { key: r2OriginalKey, width: metadata.width, height: metadata.height },
    '4k': null,
    '2k': null,
    '1080p': null,
    '720p': null,
    'mobile-portrait': null,
    'mobile-landscape': null,
  };

  const failedVariants = [];

  // Generate paid variants
  for (const resolution of availableResolutions) {
    const config = PAID_VARIANT_CONFIG[resolution];
    try {
      // Use mobile variant builder for mobile resolutions (with crop)
      const isMobileVariant = resolution.startsWith('mobile-');
      const variantBuffer = isMobileVariant
        ? await buildMobileVariant(
            originalBuffer,
            config.width,
            config.height,
            config.quality,
            config.effort
          )
        : await buildWebpVariant(
            originalBuffer,
            config.width,
            config.quality,
            config.effort
          );
      const variantKey = uploadService.generateAssetKey(productId, resolution, 'webp', 'private');
      const uploadedVariant = await uploadService.uploadPrivateToR2(
        variantBuffer,
        variantKey,
        config.mimeType
      );
      
      const variantMetadata = await sharp(variantBuffer).metadata();

      privateAssets[resolution] = {
        key: uploadedVariant.key,
        contentType: config.mimeType,
        size: variantBuffer.length,
        width: variantMetadata.width,
        height: variantMetadata.height,
      };
    } catch (error) {
      console.error(`[Worker] Failed to generate ${resolution} variant:`, error.message);
      failedVariants.push(resolution);
    }
  }

  // Step 6: Update progress to 90%
  await job.updateProgress(90);

  // Generate preview and thumbnail
  const isPaidProduct = Number(product.price || 0) > 0;
  const previewVariantConfig = PUBLIC_VARIANT_CONFIG.preview;

  const previewBuffer = isPaidProduct
    ? await buildPreviewVariantWithWatermark(
        originalBuffer,
        previewVariantConfig.width,
        previewVariantConfig.quality,
        previewVariantConfig.progressive
      )
    : await buildPreviewVariant(
        originalBuffer,
        previewVariantConfig.width,
        previewVariantConfig.quality,
        previewVariantConfig.progressive
      );

  const previewKey = uploadService.generateAssetKey(productId, 'preview', 'jpg', 'public');
  const previewUpload = await uploadService.uploadPublicToR2(
    previewBuffer,
    previewKey,
    previewVariantConfig.mimeType
  );
  const previewMetadata = await sharp(previewBuffer).metadata();

  const thumbnailBuffer = await buildWebpVariant(
    originalBuffer,
    PUBLIC_VARIANT_CONFIG.thumbnail.width,
    PUBLIC_VARIANT_CONFIG.thumbnail.quality,
    PUBLIC_VARIANT_CONFIG.thumbnail.effort
  );
  const thumbnailKey = uploadService.generateAssetKey(productId, 'thumbnail', 'webp', 'public');
  const thumbnailUpload = await uploadService.uploadPublicToR2(
    thumbnailBuffer,
    thumbnailKey,
    PUBLIC_VARIANT_CONFIG.thumbnail.mimeType
  );
  const thumbnailMetadata = await sharp(thumbnailBuffer).metadata();

  // Step 7: Update Product document
  const successfulResolutions = availableResolutions.filter(
    (resolution) => Boolean(privateAssets[resolution])
  );

  product.availableResolutions = successfulResolutions;
  product.assets = {
    original: privateAssets.original,
    '4k': privateAssets['4k'],
    '2k': privateAssets['2k'],
    '1080p': privateAssets['1080p'],
    '720p': privateAssets['720p'],
    'mobile-portrait': privateAssets['mobile-portrait'],
    'mobile-landscape': privateAssets['mobile-landscape'],
    preview: {
      key: previewUpload.key,
      url: previewUpload.url,
      contentType: previewVariantConfig.mimeType,
      size: previewBuffer.length,
      width: previewMetadata.width,
      height: previewMetadata.height,
    },
    thumbnail: {
      key: thumbnailUpload.key,
      url: thumbnailUpload.url,
      contentType: PUBLIC_VARIANT_CONFIG.thumbnail.mimeType,
      size: thumbnailBuffer.length,
      width: thumbnailMetadata.width,
      height: thumbnailMetadata.height,
    },
    status: failedVariants.length > 0 ? 'failed' : 'ready',
  };
  product.img = thumbnailUpload.url;
  // Use resolution service to get the correct display label and default download
  if (successfulResolutions.length > 0) {
    const computedMetadata = resolutionService.computeResolutionMetadata(product);
    product.displayResolution = computedMetadata.displayResolutionLabel || product.displayResolution;
    product.defaultDownload = computedMetadata.defaultDownload || product.defaultDownload;
    product.availableResolutions = computedMetadata.availableVariants;
  }
  product.status = failedVariants.length > 0 ? 'pending' : 'active';

  await product.save();

  // Clear products cache to show new active products on the marketplace immediately
  if (product.status === 'active' && redisConnection) {
    try {
      const keys = await redisConnection.keys('products:*');
      if (keys.length > 0) {
        await redisConnection.del(...keys);
      }
    } catch (err) {
      console.error(`[Worker] Failed to clear Redis cache:`, err.message);
    }
  }

  // Step 8: Update progress to 100%
  await job.updateProgress(100);

  const processingTime = Date.now() - startTime;
  console.log(`[Worker] Image processing completed in ${processingTime}ms`);

  // Emit real-time socket event if possible
  try {
    const { getIo } = require('../socket');
    getIo().to(`user_${creatorId}`).emit('product_status_updated', {
      productId,
      status: product.assets.status,
      product: product.toJSON(),
    });
  } catch (err) {
    console.error(`[Worker] Failed to emit socket event:`, err.message);
  }

  return {
    status: product.assets.status,
    processingTime,
    resolutions: successfulResolutions,
    failedVariants,
  };
}

/**
 * Handle job failure
 */
async function handleJobFailure(job, error) {
  console.error(`[Worker] Job ${job.id} failed (Attempt ${job.attemptsMade + 1}/${job.opts.attempts}):`, error.message);

  const { productId } = job.data;
  
  // Only flag product if this is the final attempt
  if (job.attemptsMade + 1 >= job.opts.attempts) {
    try {
      const product = await Product.findById(productId);
      if (product) {
        product.assets.status = 'failed';
        product.status = 'pending';
        // Add to DLQ (by marking in DB, could also be a separate collection)
        product.rejectionReason = `Processing failed: ${error.message}`;
        await product.save();
        console.log(`[Worker] Product ${productId} moved to DLQ (failed) due to processing error`);

        // Emit socket event on final failure
        try {
          const { getIo } = require('../socket');
          getIo().to(`user_${job.data.creatorId}`).emit('product_status_updated', {
            productId,
            status: 'failed',
            error: error.message,
          });
        } catch (err) {}
      }
    } catch (saveError) {
      console.error(`[Worker] Failed to update product status:`, saveError.message);
    }
  }
}

/**
 * Helper to process image directly (fallback logic for when Redis is disabled)
 */
async function processImageDirectly({ productId, r2OriginalKey, creatorId }) {
  const dummyJob = {
    id: `sync-${productId}`,
    data: { productId, r2OriginalKey, creatorId },
    updateProgress: async (progress) => {
      logger.info(`[Fallback Processing] Product ${productId} progress: ${progress}%`);
    },
  };
  try {
    return await processImageJob(dummyJob);
  } catch (error) {
    await handleJobFailure(dummyJob, error);
    throw error;
  }
}

/**
 * Create and export the BullMQ Worker
 * Concurrency MUST be 1
 */
let imageProcessorWorker = null;

if (redisConnection) {
  imageProcessorWorker = new Worker(
    'image-processing',
    async (job) => {
      try {
        return await processImageJob(job);
      } catch (error) {
        await handleJobFailure(job, error);
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 1, // MUST be 1 as per requirements
      limiter: {
        max: 10,
        duration: 60000, // 10 jobs per minute
      },
    }
  );

  // Worker event handlers with enhanced monitoring
  imageProcessorWorker.on('active', (job) => {
    logger.info(`[QUEUE] Job ${job.id} started`);
  });

  imageProcessorWorker.on('progress', (job, progress) => {
    logger.info(`[QUEUE] Job ${job.id} progress: ${progress}%`);
  });

  imageProcessorWorker.on('completed', (job, result) => {
    logger.info(`[QUEUE] Job ${job.id} completed`);
  });

  imageProcessorWorker.on('failed', (job, err) => {
    logger.error(`[QUEUE] Job ${job.id} failed: ${err.message}`);
  });

  imageProcessorWorker.on('error', (error) => {
    logger.error(`[WORKER] Error: ${error.message}`);
  });

  logger.info('✓ BullMQ Worker Ready');
} else {
  logger.warn('⚠ BullMQ Worker is disabled: Redis connection not available.');
}

module.exports = imageProcessorWorker;
module.exports.processImageDirectly = processImageDirectly;
