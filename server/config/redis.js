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

if (!config.REDIS_URL) {
  throw new Error('REDIS_URL is missing. Check your .env file');
}

const redisConnection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {},
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redisConnection.on('connect', () => {
  console.log('[REDIS] BullMQ Redis connected');
});

redisConnection.on('error', (err) => {
  console.error('[REDIS] Error:', err.message);
});

const upstashRedis = new Redis({
  url: config.UPSTASH_REDIS_REST_URL,
  token: config.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = {
  redisConnection,
  upstashRedis,
};
