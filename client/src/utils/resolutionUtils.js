/**
 * Resolution Utilities
 * 
 * Shared utilities for handling wallpaper resolution logic on the frontend.
 * This mirrors the backend resolutionService for consistent behavior.
 * 
 * Source of Truth: The wallpaper's variants stored in MongoDB / Cloudflare R2.
 */

/**
 * Resolution configuration matching backend service
 */
export const RESOLUTION_CONFIG = {
  original: {
    key: 'original',
    label: 'Original',
    priority: 0,
    standardDimensions: null,
  },
  '4k': {
    key: '4k',
    label: '4K Ultra HD',
    standardDimensions: { width: 3840, height: 2160 },
    priority: 1,
  },
  '2k': {
    key: '2k',
    label: '2K Quad HD',
    standardDimensions: { width: 2560, height: 1440 },
    priority: 2,
  },
  '1080p': {
    key: '1080p',
    label: 'HD (1920×1080)',
    standardDimensions: { width: 1920, height: 1080 },
    priority: 3,
  },
  '720p': {
    key: '720p',
    label: 'HD Ready',
    standardDimensions: { width: 1280, height: 720 },
    priority: 4,
  },
  'mobile-portrait': {
    key: 'mobile-portrait',
    label: 'Mobile Portrait',
    standardDimensions: { width: 1080, height: 1920 },
    priority: 5,
  },
  'mobile-landscape': {
    key: 'mobile-landscape',
    label: 'Mobile Landscape',
    standardDimensions: { width: 1920, height: 1080 },
    priority: 6,
  },
};

/**
 * Priority order for selecting highest resolution (lower = higher priority)
 */
export const RESOLUTION_PRIORITY = [
  'original',
  '4k',
  '2k',
  '1080p',
  '720p',
  'mobile-portrait',
  'mobile-landscape',
];

/**
 * Get available variants from product assets
 * Only includes variants that have a valid R2 key
 * 
 * @param {Object} product - Product object with assets
 * @returns {string[]} - Array of available variant keys
 */
export function getAvailableVariants(product) {
  if (!product || !product.assets) return [];
  
  const availableKeys = [];
  for (const key of RESOLUTION_PRIORITY) {
    const asset = product.assets[key];
    if (asset && asset.key) {
      availableKeys.push(key);
    }
  }
  return availableKeys;
}

/**
 * Get the highest resolution from available variants
 * 
 * @param {string[]} availableVariants - Array of available variant keys
 * @returns {string|null} - Highest priority variant key
 */
export function getHighestResolution(availableVariants) {
  if (!availableVariants || availableVariants.length === 0) return null;
  
  for (const key of RESOLUTION_PRIORITY) {
    if (availableVariants.includes(key)) {
      return key;
    }
  }
  return null;
}

/**
 * Get the display label for a resolution key
 * 
 * @param {string} key - Resolution key
 * @returns {string} - Human-readable label
 */
export function getResolutionLabel(key) {
  return RESOLUTION_CONFIG[key]?.label || key.toUpperCase();
}

/**
 * Get the standard dimensions for a resolution key
 * 
 * @param {string} key - Resolution key
 * @returns {{width: number, height: number}|null}
 */
export function getStandardDimensions(key) {
  return RESOLUTION_CONFIG[key]?.standardDimensions || null;
}

/**
 * Get detailed display label for a resolution with all info
 * 
 * @param {Object} product - Product object
 * @param {string} resolutionKey - Resolution key
 * @returns {string} - Formatted display string
 */
export function getDisplayLabel(product, resolutionKey) {
  const config = RESOLUTION_CONFIG[resolutionKey];
  const baseLabel = config?.label || resolutionKey.toUpperCase();
  const asset = product?.assets?.[resolutionKey];
  
  if (asset) {
    const width = asset.width || config?.standardDimensions?.width;
    const height = asset.height || config?.standardDimensions?.height;
    const format = getFormatFromContentType(asset.contentType) || 'WebP';
    const fileSize = formatFileSize(asset.size);
    
    if (width && height) {
      return `${baseLabel} — ${width}×${height} · ${format} · ${fileSize}`;
    }
  }
  
  return baseLabel;
}

/**
 * Get format name from content type
 * 
 * @param {string} contentType - MIME type
 * @returns {string|null} - Format name
 */
export function getFormatFromContentType(contentType) {
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
 * Format file size in bytes to human-readable string
 * 
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return 'Unknown';
  
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
 * Get the highest resolution details for badge display
 * 
 * @param {Object} product - Product object
 * @returns {Object|null} - Resolution details object
 */
export function getHighestResolutionDetails(product) {
  const variants = getAvailableVariants(product);
  const highestKey = getHighestResolution(variants);
  
  if (!highestKey) return null;
  
  const config = RESOLUTION_CONFIG[highestKey];
  const asset = product?.assets?.[highestKey];
  
  return {
    key: highestKey,
    label: config?.label || highestKey.toUpperCase(),
    class: `res-${highestKey}`,
    dimensions: {
      width: asset?.width || config?.standardDimensions?.width,
      height: asset?.height || config?.standardDimensions?.height,
    },
  };
}

/**
 * Get CSS class for resolution badge
 * 
 * @param {string} key - Resolution key
 * @returns {string} - CSS class name
 */
export function getResolutionClass(key) {
  const classMap = {
    original: 'res-original',
    '4k': 'res-4k',
    '2k': 'res-2k',
    '1080p': 'res-1080p',
    '720p': 'res-720p',
    'mobile-portrait': 'res-mobile',
    'mobile-landscape': 'res-mobile',
  };
  return classMap[key] || 'res-1080p';
}