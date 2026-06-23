/**
 * Login protection service backed by Upstash Redis.
 * Tracks failed login attempts per email and applies a temporary lock.
 */

const { Redis } = require('@upstash/redis');
const config = require('../config');

const LOCK_SECONDS = 10 * 60;
const MAX_FAILED_ATTEMPTS = 5;

let redisClient;
const fallbackAttempts = new Map();
const fallbackLocks = new Map();

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const hasRedisConfig = () =>
  Boolean(config.UPSTASH_REDIS_REST_URL && config.UPSTASH_REDIS_REST_TOKEN);

const nowInSeconds = () => Math.floor(Date.now() / 1000);

const getRedisClient = () => {
  if (!hasRedisConfig()) {
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

const attemptsKey = (email) => `login:attempts:${normalizeEmail(email)}`;
const lockKey = (email) => `login:lock:${normalizeEmail(email)}`;

const cleanupFallback = (email) => {
  const normalized = normalizeEmail(email);
  const lockExpires = fallbackLocks.get(normalized);
  if (lockExpires && lockExpires <= nowInSeconds()) {
    fallbackLocks.delete(normalized);
    fallbackAttempts.delete(normalized);
  }

  const attemptsEntry = fallbackAttempts.get(normalized);
  if (attemptsEntry && attemptsEntry.expiresAt <= nowInSeconds()) {
    fallbackAttempts.delete(normalized);
  }
};

const isLoginLocked = async (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const client = getRedisClient();
  if (!client) {
    cleanupFallback(normalized);
    return fallbackLocks.has(normalized);
  }

  const lockValue = await client.get(lockKey(normalized));
  return Boolean(lockValue);
};

const recordFailedLogin = async (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { locked: false, attempts: 0 };
  }

  const client = getRedisClient();
  if (!client) {
    cleanupFallback(normalized);

    const existing = fallbackAttempts.get(normalized);
    const nextAttempts = (existing?.count || 0) + 1;
    fallbackAttempts.set(normalized, {
      count: nextAttempts,
      expiresAt: nowInSeconds() + LOCK_SECONDS,
    });

    const locked = nextAttempts >= MAX_FAILED_ATTEMPTS;
    if (locked) {
      fallbackLocks.set(normalized, nowInSeconds() + LOCK_SECONDS);
    }

    return { locked, attempts: nextAttempts, backend: 'memory' };
  }

  const key = attemptsKey(normalized);
  const count = await client.incr(key);
  if (count === 1) {
    await client.expire(key, LOCK_SECONDS);
  }

  const locked = count >= MAX_FAILED_ATTEMPTS;
  if (locked) {
    await client.set(lockKey(normalized), true, { ex: LOCK_SECONDS });
  }

  return { locked, attempts: count, backend: 'redis' };
};

const clearLoginProtection = async (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  const client = getRedisClient();
  if (!client) {
    fallbackAttempts.delete(normalized);
    fallbackLocks.delete(normalized);
    return;
  }

  await client.del(attemptsKey(normalized));
  await client.del(lockKey(normalized));
};

const getLoginProtectionStateForTesting = async (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { attempts: 0, locked: false, backend: 'none' };
  }

  const client = getRedisClient();
  if (!client) {
    cleanupFallback(normalized);
    return {
      attempts: fallbackAttempts.get(normalized)?.count || 0,
      locked: fallbackLocks.has(normalized),
      backend: 'memory',
    };
  }

  const [attemptsRaw, lockedRaw] = await Promise.all([
    client.get(attemptsKey(normalized)),
    client.get(lockKey(normalized)),
  ]);

  return {
    attempts: Number(attemptsRaw || 0),
    locked: Boolean(lockedRaw),
    backend: 'redis',
  };
};

module.exports = {
  LOCK_SECONDS,
  MAX_FAILED_ATTEMPTS,
  isLoginLocked,
  recordFailedLogin,
  clearLoginProtection,
  getLoginProtectionStateForTesting,
};
