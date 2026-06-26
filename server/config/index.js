/**
 * Configuration Module
 * 
 * Centralizes all environment variables and configuration settings.
 * Provides default values and validates required configurations.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const logger = require('../utils/logger');

const config = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  
  // Database configuration
  MONGODB_URI: process.env.MONGODB_URI,
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  SENTRY_DSN: process.env.SENTRY_DSN,

  // Cloudflare R2 configuration
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,

  // Stripe configuration
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLIC_KEY,

  // Upstash Redis configuration
  REDIS_URL: process.env.REDIS_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

  // Email configuration
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  CLIENT_URL: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',

  // Backward compatibility aliases
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Security configuration
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  
  // Helper properties
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Validate required configurations
if (!config.MONGODB_URI) {
  logger.error('FATAL ERROR: MONGODB_URI is not defined in environment variables');
  throw new Error('Missing required environment variable: MONGODB_URI');
}

if (!config.JWT_SECRET && !config.JWT_ACCESS_SECRET) {
  logger.error('FATAL ERROR: JWT_SECRET or JWT_ACCESS_SECRET must be defined in environment variables');
  throw new Error('Missing required environment variable: JWT_SECRET or JWT_ACCESS_SECRET');
}

// Soft-warn for R2 configurations so the app can start without them
const r2ConfigKeys = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
const missingR2Keys = r2ConfigKeys.filter((key) => !config[key]);
if (missingR2Keys.length > 0) {
  logger.warn(`⚠ Cloudflare R2 is partially or fully unconfigured (missing: ${missingR2Keys.join(', ')}). Image uploads will be disabled.`);
}

// Soft-warn for Redis configuration
if (!config.REDIS_URL) {
  logger.warn('⚠ REDIS_URL is not defined in environment variables. BullMQ and Redis background operations will run in local/in-memory fallback mode.');
}

// Soft-warn for Stripe config so app can start without it
if (!config.STRIPE_SECRET_KEY) {
  logger.warn('⚠ STRIPE_SECRET_KEY not set — payments disabled');
}
if (!config.STRIPE_WEBHOOK_SECRET) {
  logger.warn('⚠ STRIPE_WEBHOOK_SECRET not set — webhook verification disabled');
}

module.exports = config;
