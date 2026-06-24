const { S3Client } = require('@aws-sdk/client-s3');
const logger = require('../utils/logger');

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

if (accountId && accessKeyId && secretAccessKey && bucketName) {
  logger.info('✓ Cloudflare R2 Connected');
} else {
  logger.warn('⚠ Cloudflare R2 Connection Failed: Missing credentials');
}

module.exports = {
  s3Client,
  bucketName,
  publicUrl,
};
