/**
 * Common password blocklist.
 */

const commonPasswords = new Set([
  '123456',
  '12345678',
  'password',
  'password123',
  'qwerty',
  'qwerty123',
  '111111',
  '000000',
  'abc123',
  'iloveyou',
  'admin',
  'admin123',
]);

const isCommonPassword = (password = '') => commonPasswords.has(String(password).toLowerCase());

module.exports = {
  commonPasswords,
  isCommonPassword,
};
