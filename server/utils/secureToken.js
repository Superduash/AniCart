/**
 * Secure token helpers for email verification and password reset flows.
 */

const crypto = require('crypto');

const hashToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

const createSecureToken = (expiresInMs) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + expiresInMs);

  return {
    rawToken,
    hashedToken,
    expiresAt,
  };
};

module.exports = {
  hashToken,
  createSecureToken,
};
