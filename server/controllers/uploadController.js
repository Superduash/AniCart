const catchAsync = require('../utils/catchAsync');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');

const Product = require('../models/Product');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const CONSTANTS = require('../utils/constants');
const uploadService = require('../services/uploadService');
const { enqueueImageProcessing, getJobStatus } = require('../jobs/queues');

const MIN_WIDTH_PX = 1280;
const MAX_DIMENSION_PX = 10000;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const WATERMARK_OPACITY = 0.25;
const WATERMARK_PATH = path.join(__dirname, '..', 'assets', 'watermark.png');
const MONGO_OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;
const ALLOWED_UPLOAD_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const PAID_VARIANT_CONFIG = {
  '4k': { width: 3840, quality: 88, effort: 4, mimeType: 'image/webp' },
  '2k': { width: 2560, quality: 85, effort: 4, mimeType: 'image/webp' },
  '1080p': { width: 1920, quality: 82, effort: 4, mimeType: 'image/webp' },
};

const PUBLIC_VARIANT_CONFIG = {
  preview: { width: 1280, quality: 70, mimeType: 'image/jpeg', format: 'jpeg', progressive: true },
  thumbnail: { width: 400, quality: 55, effort: 2, mimeType: 'image/webp', format: 'webp' },
};

const RESOLUTION_DISPLAY_MAP = {
  '4k': '4K UHD',
  '2k': '2K (QHD)',
  '1080p': 'FHD',
  '720p': 'HD',
  'mobile-portrait': 'Mobile',
  'mobile-landscape': 'Mobile',
};

let fileTypeFromBuffer;
let watermarkOverlayBufferPromise;

const detectFileTypeFromBuffer = async (buffer) => {
  if (!fileTypeFromBuffer) {
    ({ fileTypeFromBuffer } = await import('file-type'));
  }

  return fileTypeFromBuffer(buffer);
};

const getWatermarkOverlayBuffer = async () => {
  if (!watermarkOverlayBufferPromise) {
    watermarkOverlayBufferPromise = (async () => {
      let watermarkFileBuffer;
      try {
        watermarkFileBuffer = await fs.readFile(WATERMARK_PATH);
      } catch (error) {
        throw ApiError.internal('Missing watermark asset at assets/watermark.png');
      }

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
};

const determineAvailableResolutions = (width) => {
  if (width >= 3840) {
    return ['4k', '2k', '1080p'];
  }

  if (width >= 2560) {
    return ['2k', '1080p'];
  }

  if (width >= 1280) {
    return ['1080p'];
  }

  return [];
};

const buildWebpVariant = async (buffer, width, quality, effort = 4) => {
  return sharp(buffer)
    .resize({
      width,
      withoutEnlargement: true,
      fit: 'inside',
      kernel: sharp.kernel.lanczos3,
    })
    .webp({ quality, effort })
    .toBuffer();
};

const buildPreviewVariantWithWatermark = async (buffer, width, quality, progressive = true) => {
  const watermarkOverlayBuffer = await getWatermarkOverlayBuffer();

  return sharp(buffer)
    .resize({
      width,
      withoutEnlargement: true,
      fit: 'inside',
      kernel: sharp.kernel.lanczos3,
    })
    .composite([
      {
        input: watermarkOverlayBuffer,
        gravity: 'center',
      },
    ])
    .jpeg({ quality, progressive })
    .toBuffer();
};

const buildPreviewVariant = async (buffer, width, quality, progressive = true) => {
  return sharp(buffer)
    .resize({
      width,
      withoutEnlargement: true,
      fit: 'inside',
      kernel: sharp.kernel.lanczos3,
    })
    .jpeg({ quality, progressive })
    .toBuffer();
};

const uploadWallpaper = catchAsync(async (req, res) => {
  // Background processing via BullMQ - returns 202 immediately
  if (
    !req.user ||
    ![CONSTANTS.ROLES.ADMIN, CONSTANTS.ROLES.CREATOR].includes(req.user.role)
  ) {
    throw ApiError.forbidden('Only creators can upload wallpapers.');
  }

  if (!req.file) {
    throw ApiError.badRequest('Wallpaper file is required');
  }

  if (req.file.size > MAX_FILE_SIZE_BYTES) {
    throw ApiError.badRequest('File too large. Max size is 25MB');
  }

  const {
    productId,
    rightsConfirmed,
    licenseType,
    authorName,
    sourceLink,
    copyrightOwner,
  } = req.body;

  if (!productId) {
    throw ApiError.badRequest('productId is required');
  }

  if (!MONGO_OBJECT_ID_REGEX.test(productId)) {
    throw ApiError.badRequest('Invalid productId format');
  }

  const rightsConfirmedValue = rightsConfirmed === true || rightsConfirmed === 'true';
  if (rightsConfirmedValue !== true) {
    throw ApiError.badRequest('You must confirm you own the rights to upload this image.');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Validate image type
  const detectedFileType = await detectFileTypeFromBuffer(req.file.buffer);
  if (!detectedFileType || !ALLOWED_UPLOAD_MIME_TYPES.has(detectedFileType.mime)) {
    throw ApiError.badRequest('Invalid file type. Only JPEG, PNG, WEBP allowed.');
  }

  // Check for duplicates
  const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
  const duplicate = await Product.findOne({ fileHash });
  if (duplicate && duplicate._id.toString() !== productId) {
    if (['removed', 'failed', 'rejected'].includes(duplicate.status) || duplicate.assets?.status === 'failed') {
      // Free up the hash so the user can re-upload it
      duplicate.fileHash = undefined;
      await duplicate.save();
    } else {
      throw ApiError.badRequest('Duplicate image detected. This wallpaper already exists.');
    }
  }

  // Update product metadata
  product.rightsConfirmed = true;
  product.termsAcceptedAt = new Date();
  product.fileHash = fileHash;
  if (licenseType !== undefined) product.licenseType = String(licenseType).trim();
  if (authorName !== undefined) product.authorName = String(authorName).trim();
  if (sourceLink !== undefined) product.sourceLink = String(sourceLink).trim();
  if (copyrightOwner !== undefined) product.copyrightOwner = String(copyrightOwner).trim();
  product.status = 'pending';
  product.assets = {
    ...(product.assets || {}),
    status: 'processing',
  };
  await product.save();

  // Upload original to R2
  const originalExtension = detectedFileType.ext || 'bin';
  const originalMimeType = detectedFileType.mime || req.file.mimetype || 'application/octet-stream';
  const originalKey = uploadService.generateAssetKey(
    productId,
    'original',
    originalExtension,
    'private'
  );

  try {
    const originalUpload = await uploadService.uploadPrivateToR2(
      req.file.buffer,
      originalKey,
      originalMimeType
    );

    // Update product with original asset
    product.assets.original = {
      key: originalUpload.key,
      contentType: originalMimeType,
      size: req.file.buffer.length,
    };
    await product.save();

    // Enqueue background processing job
    const job = await enqueueImageProcessing({
      productId,
      r2OriginalKey: originalUpload.key,
      creatorId: req.user.id,
    });

    // Increment creator upload count
    if (req.user?.role === CONSTANTS.ROLES.CREATOR) {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: {
          'creatorStats.uploadsThisMonth': 1,
        },
      });
    }

    // Return 202 Accepted - processing in background
    return res.status(202).json(
      ApiResponse.successResponse({
        message: 'Wallpaper uploaded successfully. Processing in background.',
        data: {
          productId,
          status: 'processing',
          jobId: job.id,
          originalUrl: originalUpload.key,
        },
      })
    );
  } catch (error) {
    // Mark product as failed on upload error
    product.status = 'rejected';
    product.assets = {
      ...(product.assets || {}),
      status: 'failed',
    };
    await product.save();

    throw error;
  }
});

/**
 * Get upload processing status
 * GET /upload/status/:productId
 */
const getUploadStatus = catchAsync(async (req, res) => {
  const { productId } = req.params;

  if (!productId || !MONGO_OBJECT_ID_REGEX.test(productId)) {
    throw ApiError.badRequest('Invalid productId format');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Get job status from BullMQ
  const jobStatus = await getJobStatus(productId);

  // Build response
  const response = {
    status: product.assets?.status || 'unknown',
    progress: jobStatus?.progress || 0,
    previewUrl: product.assets?.preview?.url || null,
    thumbnailUrl: product.assets?.thumbnail?.url || null,
    availableResolutions: product.availableResolutions || [],
  };

  // Add job details if available
  if (jobStatus) {
    response.jobState = jobStatus.state;
    response.processedOn = jobStatus.processedOn;
    response.finishedOn = jobStatus.finishedOn;
    if (jobStatus.failedReason) {
      response.error = jobStatus.failedReason;
    }
  }

  return res.status(200).json(
    ApiResponse.successResponse({
      data: response,
    })
  );
});

module.exports = {
  uploadWallpaper,
  getUploadStatus,
};
