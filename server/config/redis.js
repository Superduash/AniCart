/**
 * Redis Configuration Module
 *
 * Provides two Redis clients:
 * 1. redisConnection (IORedis) - For BullMQ queue/worker (TCP/TLS)
 * 2. upstashRedis (HTTP) - For caching using Upstash REST API
 */

const IORedis = require('ioredis');
const { Redis } = require('@upstash/redis');
const config = require('./index');
const logger = require('../utils/logger');

let redisConnection = null;
if (config.REDIS_URL) {
  const isTls = config.REDIS_URL.startsWith('rediss://');
  redisConnection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    tls: isTls ? {} : undefined,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  let redisConnectedLogged = false;
  redisConnection.on('connect', () => {
    if (!redisConnectedLogged) {
      logger.info('✓ Redis Connected');
      redisConnectedLogged = true;
    }
  });

  let redisWarningLogged = false;
  redisConnection.on('error', (err) => {
    if (!redisWarningLogged) {
      logger.warn(`⚠ Redis Connection Failed — using Memory/Map fallback: ${err.message}`);
      redisWarningLogged = true;
    }
  });
}

let upstashRedis = null;
if (config.UPSTASH_REDIS_REST_URL && config.UPSTASH_REDIS_REST_TOKEN) {
  upstashRedis = new Redis({
    url: config.UPSTASH_REDIS_REST_URL,
    token: config.UPSTASH_REDIS_REST_TOKEN,
  });
}

module.exports = {
  redisConnection,
  upstashRedis,
};
