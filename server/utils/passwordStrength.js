/**
 * Password strength scoring utility.
 */

const getStrengthFromScore = (score, length) => {
  if (score <= 2) {
    return 'very_weak';
  }
  if (score === 3) {
    return 'weak';
  }
  if (score === 4) {
    // 6-char passwords are still too short in practice even when mixed.
    if (length <= 6) {
      return 'weak';
    }
    return 'good';
  }
  if (score === 5) {
    return 'strong';
  }
  // Very strong requires full complexity and enough length headroom.
  if (length < 9) {
    return 'strong';
  }
  return 'very_strong';
};

const checkPasswordStrength = (password = '') => {
  const value = String(password);

  let score = 0;

  if (value.length >= 6) score += 1;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  return {
    score,
    strength: getStrengthFromScore(score, value.length),
  };
};

module.exports = {
  checkPasswordStrength,
};
