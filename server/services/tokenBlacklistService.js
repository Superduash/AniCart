/**
 * Token blacklist service backed by Upstash Redis.
 */

const { Redis } = require('@upstash/redis');
const config = require('../config');

let redisClient;
const fallbackBlacklist = new Map();

const nowInSeconds = () => Math.floor(Date.now() / 1000);

const hasUpstashConfig = () =>
  Boolean(config.UPSTASH_REDIS_REST_URL && config.UPSTASH_REDIS_REST_TOKEN);

const getRedisClient = () => {
  if (!hasUpstashConfig()) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: config.UPSTASH_REDIS_REST_URL,
      token: config.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redisClient;
};

const getBlacklistKey = (jti) => 'blacklist:' + jti;

const setFallbackBlacklist = (jti, expiresInSeconds) => {
  fallbackBlacklist.set(jti, nowInSeconds() + Math.floor(expiresInSeconds));
};

const isFallbackBlacklisted = (jti) => {
  const expiresAt = fallbackBlacklist.get(jti);
  if (!expiresAt) {
    return false;
  }

  if (expiresAt <= nowInSeconds()) {
    fallbackBlacklist.delete(jti);
    return false;
  }

  return true;
};

const blacklistToken = async (jti, expiresInSeconds) => {
  if (!jti || !Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    return;
  }

  const client = getRedisClient();
  if (!client) {
    setFallbackBlacklist(jti, expiresInSeconds);
    return;
  }

  await client.set(getBlacklistKey(jti), true, { ex: Math.floor(expiresInSeconds) });
};

const isBlacklisted = async (jti) => {
  if (!jti) {
    return false;
  }

  const client = getRedisClient();
  if (!client) {
    return isFallbackBlacklisted(jti);
  }

  const value = await client.get(getBlacklistKey(jti));
  return Boolean(value);
};

module.exports = {
  blacklistToken,
  isBlacklisted,
};
