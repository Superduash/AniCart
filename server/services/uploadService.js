const crypto = require('crypto');
const path = require('path');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, bucketName, publicUrl } = require('../config/r2');

function buildPublicUrl(key) {
  const base = (publicUrl || '').replace(/\/$/, '');
  return `${base}/${key}`;
}

function generateKey(productId, originalName) {
  const uuid = crypto.randomUUID();
  const extension = path.extname(originalName || '').replace(/^\./, '').toLowerCase() || 'bin';

  return `originals/${productId}/${uuid}.${extension}`;
}

function generateAssetKey(productId, assetName, extension, visibility = 'private') {
  const normalizedAssetName = String(assetName || 'asset').replace(/[^a-zA-Z0-9_-]/g, '_');
  const normalizedExtension = String(extension || 'bin').replace(/^\./, '').toLowerCase() || 'bin';
  const normalizedProductId = String(productId).trim();

  if (normalizedAssetName === 'original') {
    return `originals/${normalizedProductId}/original.${normalizedExtension}`;
  }

  if (normalizedAssetName === 'preview') {
    return `previews/${normalizedProductId}/preview.jpg`;
  }

  if (normalizedAssetName === 'thumbnail') {
    return `thumbnails/${normalizedProductId}/thumb.webp`;
  }

  if (['4k', '2k', '1080p'].includes(normalizedAssetName)) {
    return `variants/${normalizedProductId}/${normalizedAssetName}.webp`;
  }

  return `variants/${normalizedProductId}/${normalizedAssetName}.${normalizedExtension}`;
}

async function uploadToR2(buffer, key, contentType, options = {}) {
  const { isPublic = true } = options;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  if (isPublic) {
    return {
      url: buildPublicUrl(key),
      key,
    };
  }

  return { key };
}

async function uploadPublicToR2(buffer, key, contentType) {
  return uploadToR2(buffer, key, contentType, { isPublic: true });
}

async function uploadPrivateToR2(buffer, key, contentType) {
  return uploadToR2(buffer, key, contentType, { isPublic: false });
}

async function deleteFromR2(key) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

function getPublicUrl(key) {
  return buildPublicUrl(key);
}

module.exports = {
  generateKey,
  generateAssetKey,
  uploadToR2,
  uploadPublicToR2,
  uploadPrivateToR2,
  deleteFromR2,
  getPublicUrl,
};
