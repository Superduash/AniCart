/**
 * Orphaned R2 File Cleanup Job
 *
 * Runs daily at 3 AM to clean up orphaned files in R2.
 * An orphaned file is one that exists in R2 but has no corresponding Product document.
 *
 * Process:
 * 1. List all files under "originals/" prefix in R2
 * 2. For each file, check if a Product exists with that original key
 * 3. If no Product exists and file is older than 24 hours → delete from R2
 */

const { ListObjectsV2Command, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, bucketName } = require('../config/r2');
const Product = require('../models/Product');
const logger = require('../utils/logger');

const ORPHANED_FILE_AGE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_PREFIX = 'originals/';

/**
 * Extract product ID from R2 key
 * Key format: originals/{productId}/original.{ext}
 */
function extractProductIdFromKey(key) {
  const match = key.match(/^originals\/([a-f0-9]{24})\/original\./);
  return match ? match[1] : null;
}

/**
 * Get file metadata to check age
 */
async function getFileMetadata(key) {
  try {
    const response = await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    return {
      lastModified: response.LastModified,
      size: response.ContentLength,
    };
  } catch (error) {
    logger.error(`Failed to get metadata for ${key}`, { error: error.message });
    return null;
  }
}

/**
 * Delete file from R2
 */
async function deleteFromR2(key) {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    logger.error(`Failed to delete ${key} from R2`, { error: error.message });
    return false;
  }
}

/**
 * List all files under a prefix in R2
 */
async function listAllFiles(prefix) {
  const files = [];
  let continuationToken = null;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      files.push(...response.Contents);
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return files;
}

/**
 * Check if product exists with given original key
 */
async function productExistsWithKey(key) {
  const productId = extractProductIdFromKey(key);

  if (!productId) {
    return false;
  }

  const product = await Product.findById(productId);
  return !!product;
}

/**
 * Run the cleanup job
 */
async function runCleanup() {
  const startTime = Date.now();
  logger.info('[Cleanup] Starting orphaned files cleanup job');

  let stats = {
    scanned: 0,
    orphaned: 0,
    deleted: 0,
    errors: 0,
    skipped: 0,
  };

  try {
    // List all files under originals/
    const files = await listAllFiles(CLEANUP_PREFIX);
    stats.scanned = files.length;

    logger.info(`[Cleanup] Found ${files.length} files to scan`);

    for (const file of files) {
      const key = file.Key;

      // Skip non-original files (variants, previews, thumbnails)
      if (!key.includes('/original.')) {
        stats.skipped++;
        continue;
      }

      // Check if file is older than threshold
      const metadata = await getFileMetadata(key);
      if (!metadata) {
        stats.errors++;
        continue;
      }

      const fileAge = Date.now() - new Date(metadata.lastModified).getTime();
      if (fileAge < ORPHANED_FILE_AGE_THRESHOLD_MS) {
        // File is too new, skip it
        continue;
      }

      // Check if product exists
      const productExists = await productExistsWithKey(key);

      if (!productExists) {
        stats.orphaned++;
        logger.info(`[Cleanup] Found orphaned file: ${key} (age: ${Math.round(fileAge / 3600000)}h)`);

        // Delete the orphaned file
        const deleted = await deleteFromR2(key);
        if (deleted) {
          stats.deleted++;
          logger.info(`[Cleanup] Deleted orphaned file: ${key}`);
        } else {
          stats.errors++;
        }
      }
    }

    const duration = Date.now() - startTime;
    logger.info('[Cleanup] Cleanup job completed', {
      duration: `${duration}ms`,
      ...stats,
    });

    return stats;
  } catch (error) {
    logger.error('[Cleanup] Cleanup job failed', { error: error.message });
    throw error;
  }
}

/**
 * Schedule cleanup job to run daily at 3 AM
 * Returns the interval ID for cleanup
 */
function scheduleCleanupJob() {
  const now = new Date();
  const next3AM = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    3, 0, 0, 0
  );

  // If it's already past 3 AM, schedule for tomorrow
  if (next3AM <= now) {
    next3AM.setDate(next3AM.getDate() + 1);
  }

  const delay = next3AM - now;

  logger.silly(`[Cleanup] Scheduled next cleanup at ${next3AM.toISOString()}`);

  // Initial delay to reach 3 AM, then run every 24 hours
  const timeoutId = setTimeout(() => {
    runCleanup().catch((error) => {
      logger.error('[Cleanup] Scheduled cleanup failed', { error: error.message });
    });

    // Schedule recurring runs every 24 hours
    setInterval(() => {
      runCleanup().catch((error) => {
        logger.error('[Cleanup] Scheduled cleanup failed', { error: error.message });
      });
    }, 24 * 60 * 60 * 1000);
  }, delay);

  return timeoutId;
}

module.exports = {
  runCleanup,
  scheduleCleanupJob,
};
