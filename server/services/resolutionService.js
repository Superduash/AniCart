/**
 * Resolution Service
 * 
 * Centralized service for handling wallpaper resolution logic.
 * 
 * Source of Truth: The wallpaper's variants stored in MongoDB / Cloudflare R2.
 * 
 * Rules:
 * - Every wallpaper derives its available resolutions ONLY from the variants actually stored
 * - Never use hardcoded labels for the highest resolution
 * - Never assume every wallpaper has every resolution
 * - If a variant does not exist, DO NOT display it
 * - Never fake resolutions
 */

const config = require('../config');

/**
 * Standard mapping from variant keys to display labels
 */
const RESOLUTION_CONFIG = {
  'original': {
    key: 'original',
    label: 'Original',
    priority: 0,
    minDimensions: null, // No minimum - it's the source
  },
  '4k': {
    key: '4k',
    label: '4K Ultra HD',
    standardDimensions: { width: 3840, height: 2160 },
    priority: 1,
    minDimensions: { width: 3840, height: 2160 },
  },
  '2k': {
    key: '2k',
    label: '2K Quad HD',
    standardDimensions: { width: 2560, height: 1440 },
    priority: 2,
    minDimensions: { width: 2560, height: 1440 },
  },
  '1080p': {
    key: '1080p',
    label: 'HD (1920×1080)',
    standardDimensions: { width: 1920, height: 1080 },
    priority: 3,
    minDimensions: { width: 1920, height: 1080 },
  },
  '720p': {
    key: '720p',
    label: 'HD Ready',
    standardDimensions: { width: 1280, height: 720 },
    priority: 4,
    minDimensions: { width: 1280, height: 720 },
  },
  'mobile-portrait': {
    key: 'mobile-portrait',
    label: 'Mobile Portrait',
    standardDimensions: { width: 1080, height: 1920 },
    priority: 5,
    minDimensions: { width: 1080, height: 1920 },
  },
  'mobile-landscape': {
    key: 'mobile-landscape',
    label: 'Mobile Landscape',
    standardDimensions: { width: 1920, height: 1080 },
    priority: 6,
    minDimensions: { width: 1920, height: 1080 },
  },
};

/**
 * Priority order for selecting the highest available resolution
 * (lower number = higher priority)
 */
const RESOLUTION_PRIORITY = ['original', '4k', '2k', '1080p', '720p', 'mobile-portrait', 'mobile-landscape'];

/**
 * Get the display label for a resolution key
 * @param {string} key - Resolution key (e.g., '4k', '2k', 'mobile-portrait')
 * @returns {string} - Human-readable label
 */
function getResolutionLabel(key) {
  return RESOLUTION_CONFIG[key]?.label || key.toUpperCase();
}

/**
 * Get the standard dimensions for a resolution key
 * @param {string} key - Resolution key
 * @returns {{width: number, height: number}|null}
 */
function getStandardDimensions(key) {
  return RESOLUTION_CONFIG[key]?.standardDimensions || null;
}

/**
 * Get the priority for a resolution key (lower = higher priority)
 * @param {string} key - Resolution key
 * @returns {number}
 */
function getResolutionPriority(key) {
  const index = RESOLUTION_PRIORITY.indexOf(key);
  return index === -1 ? 999 : index;
}

/**
 * Extract available variants from a product's assets
 * Only includes variants that have a valid R2 key
 * 
 * @param {Object} product - Product document with assets
 * @returns {string[]} - Array of available variant keys
 */
function getAvailableVariants(product) {
  if (!product || !product.assets) {
    return [];
  }

  const availableKeys = [];
  
  for (const key of RESOLUTION_PRIORITY) {
    const asset = product.assets[key];
    // Check if asset exists and has a key (meaning it's stored in R2)
    if (asset && asset.key) {
      availableKeys.push(key);
    }
  }

  return availableKeys;
}

/**
 * Find the highest priority resolution from available variants
 * 
 * @param {string[]} availableVariants - Array of available variant keys
 * @returns {string|null} - Highest priority variant key, or null if none available
 */
function getHighestResolution(availableVariants) {
  if (!availableVariants || availableVariants.length === 0) {
    return null;
  }

  let highestPriority = 999;
  let highestKey = null;

  for (const key of availableVariants) {
    const priority = getResolutionPriority(key);
    if (priority < highestPriority) {
      highestPriority = priority;
      highestKey = key;
    }
  }

  return highestKey;
}

/**
 * Get detailed information about an available variant
 * 
 * @param {Object} product - Product document
 * @param {string} variantKey - Variant key
 * @returns {Object|null} - Variant details or null
 */
function getVariantDetails(product, variantKey) {
  const asset = product?.assets?.[variantKey];
  if (!asset || !asset.key) {
    return null;
  }

  const config = RESOLUTION_CONFIG[variantKey];
  const displayLabel = config?.label || variantKey.toUpperCase();
  const standardDimensions = config?.standardDimensions;

  // Use actual dimensions from asset if available, otherwise use standard
  const dimensions = {
    width: asset.width || standardDimensions?.width || null,
    height: asset.height || standardDimensions?.height || null,
  };

  // Format file size
  const fileSize = formatFileSize(asset.size);

  // Get content type / format
  const format = getFormatFromContentType(asset.contentType) || 'WebP';

  return {
    key: variantKey,
    label: displayLabel,
    dimensions,
    format,
    fileSize,
    fileSizeBytes: asset.size || null,
    r2Key: asset.key,
  };
}

/**
 * Get all available variants with full details for a product
 * Returns variants in priority order (highest first)
 * 
 * @param {Object} product - Product document
 * @returns {Object[]} - Array of variant details
 */
function getAllVariantDetails(product) {
  const availableVariants = getAvailableVariants(product);
  const details = [];

  for (const key of availableVariants) {
    const variantDetails = getVariantDetails(product, key);
    if (variantDetails) {
      details.push(variantDetails);
    }
  }

  return details;
}

/**
 * Get the highest resolution details for a product
 * This is used for the product card badge
 * 
 * @param {Object} product - Product document
 * @returns {Object|null} - Highest resolution details or null
 */
function getHighestResolutionDetails(product) {
  const availableVariants = getAvailableVariants(product);
  const highestKey = getHighestResolution(availableVariants);
  
  if (!highestKey) {
    return null;
  }

  return getVariantDetails(product, highestKey);
}

/**
 * Format file size in bytes to human-readable string
 * 
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "6.8 MB")
 */
function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) {
    return 'Unknown';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Get format name from content type
 * 
 * @param {string} contentType - MIME type (e.g., 'image/webp')
 * @returns {string|null} - Format name (e.g., 'WebP')
 */
function getFormatFromContentType(contentType) {
  if (!contentType) return null;

  const formatMap = {
    'image/webp': 'WebP',
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPEG',
    'image/png': 'PNG',
  };

  return formatMap[contentType.toLowerCase()] || null;
}

/**
 * Compute the correct resolution metadata for a product
 * This is used to repair incorrect metadata
 * 
 * @param {Object} product - Product document
 * @returns {Object} - Object with displayResolution, defaultDownload, availableVariants, displayLabels
 */
function computeResolutionMetadata(product) {
  const availableVariants = getAvailableVariants(product);
  
  // For display badge: use highest quality variant (not original)
  const displayVariants = availableVariants.filter(v => v !== 'original');
  const displayKey = displayVariants.length > 0 
    ? getHighestResolution(displayVariants) 
    : availableVariants.length > 0 
      ? getHighestResolution(availableVariants) 
      : null;
  const displayLabel = displayKey ? getResolutionLabel(displayKey) : null;

  // For download: prefer original if available, otherwise highest quality
  const defaultDownload = availableVariants.includes('original') 
    ? 'original' 
    : availableVariants.length > 0 
      ? getHighestResolution(availableVariants) 
      : null;

  return {
    displayResolution: displayKey,
    displayResolutionLabel: displayLabel,
    defaultDownload,
    availableVariants,
    displayLabels: availableVariants.map(key => ({
      key,
      label: getResolutionLabel(key),
    })),
  };
}

/**
 * Infer resolution from variant filename
 * Used for migration of old wallpapers
 * 
 * @param {string} filename - Variant filename (e.g., 'wallpaper-4k.webp')
 * @returns {string|null} - Resolution key or null
 */
function inferResolutionFromFilename(filename) {
  if (!filename) return null;

  const lowerFilename = filename.toLowerCase();
  
  // Check for exact matches first
  if (lowerFilename.includes('4k') || lowerFilename.includes('3840')) return '4k';
  if (lowerFilename.includes('2k') || lowerFilename.includes('2560') || lowerFilename.includes('1440p')) return '2k';
  if (lowerFilename.includes('1080p') || lowerFilename.includes('1920')) return '1080p';
  if (lowerFilename.includes('720p') || lowerFilename.includes('1280')) return '720p';
  if (lowerFilename.includes('mobile-portrait') || lowerFilename.includes('portrait')) return 'mobile-portrait';
  if (lowerFilename.includes('mobile-landscape') || lowerFilename.includes('landscape')) return 'mobile-landscape';
  if (lowerFilename.includes('original')) return 'original';

  return null;
}

/**
 * Infer resolution from sharp metadata (dimensions)
 * Used for migration when filename doesn't contain resolution info
 * 
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {string} - Best matching resolution key
 */
function inferResolutionFromDimensions(width, height) {
  if (!width || !height) return null;

  const aspectRatio = width / height;
  const isPortrait = height > width;

  // Check for mobile portrait first
  if (isPortrait && width >= 1080 && height >= 1920) {
    return 'mobile-portrait';
  }

  // Check for mobile landscape
  if (!isPortrait && width >= 1920 && height >= 1080 && aspectRatio >= 1.7) {
    return 'mobile-landscape';
  }

  // Desktop resolutions
  if (width >= 3840 && height >= 2160) return '4k';
  if (width >= 2560 && height >= 1440) return '2k';
  if (width >= 1920 && height >= 1080) return '1080p';
  if (width >= 1280 && height >= 720) return '720p';

  // Fallback to mobile
  return isPortrait ? 'mobile-portrait' : 'mobile-landscape';
}

/**
 * Validate that a product's resolution metadata matches its actual variants
 * 
 * @param {Object} product - Product document
 * @returns {Object} - { isValid: boolean, issues: string[], fixes: Object }
 */
function validateResolutionMetadata(product) {
  const issues = [];
  const fixes = {};

  const availableVariants = getAvailableVariants(product);
  const computedMetadata = computeResolutionMetadata(product);

  // Check if displayResolution field matches highest quality variant (not original)
  const currentDisplayResolution = product.displayResolution;
  const expectedDisplayResolution = computedMetadata.displayResolutionLabel;

  if (currentDisplayResolution && expectedDisplayResolution && currentDisplayResolution !== expectedDisplayResolution) {
    issues.push(`displayResolution field "${currentDisplayResolution}" does not match highest quality variant "${expectedDisplayResolution}"`);
    fixes.displayResolution = expectedDisplayResolution;
  }

  // Check if defaultDownload field matches preferred download variant
  const currentDefaultDownload = product.defaultDownload;
  const expectedDefaultDownload = computedMetadata.defaultDownload;

  if (currentDefaultDownload && expectedDefaultDownload && currentDefaultDownload !== expectedDefaultDownload) {
    issues.push(`defaultDownload field "${currentDefaultDownload}" does not match preferred download variant "${expectedDefaultDownload}"`);
    fixes.defaultDownload = expectedDefaultDownload;
  }

  // Check if availableResolutions matches actual variants
  const currentAvailableResolutions = product.availableResolutions || [];
  const missingVariants = availableVariants.filter(v => !currentAvailableResolutions.includes(v));
  const extraVariants = currentAvailableResolutions.filter(v => !availableVariants.includes(v));

  if (missingVariants.length > 0) {
    issues.push(`Missing variants in availableResolutions: ${missingVariants.join(', ')}`);
  }

  if (extraVariants.length > 0) {
    issues.push(`Extra variants in availableResolutions (no R2 key): ${extraVariants.join(', ')}`);
  }

  if (missingVariants.length > 0 || extraVariants.length > 0) {
    fixes.availableResolutions = availableVariants;
  }

  return {
    isValid: issues.length === 0,
    issues,
    fixes,
  };
}

module.exports = {
  // Core functions
  getAvailableVariants,
  getHighestResolution,
  getHighestResolutionDetails,
  getAllVariantDetails,
  getVariantDetails,
  computeResolutionMetadata,
  
  // Helper functions
  getResolutionLabel,
  getStandardDimensions,
  getResolutionPriority,
  formatFileSize,
  getFormatFromContentType,
  
  // Migration helpers
  inferResolutionFromFilename,
  inferResolutionFromDimensions,
  validateResolutionMetadata,
  
  // Constants
  RESOLUTION_CONFIG,
  RESOLUTION_PRIORITY,
};