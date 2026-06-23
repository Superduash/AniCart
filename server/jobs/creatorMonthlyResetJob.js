/**
 * Monthly creator quota reset job.
 * Resets uploadsThisMonth to 0 at the beginning of each month.
 */

const User = require('../models/User');
const CONSTANTS = require('../utils/constants');
const logger = require('../utils/logger');

const getNextMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
};

const resetCreatorMonthlyUploads = async () => {
  try {
    const result = await User.updateMany(
      { role: CONSTANTS.ROLES.CREATOR },
      { $set: { 'creatorStats.uploadsThisMonth': 0 } }
    );

    const modified = result.modifiedCount || result.nModified || 0;
    logger.info('Creator monthly upload counters reset', { modified });
  } catch (error) {
    logger.error('Creator monthly upload reset failed', { error: error.message });
  }
};

const startCreatorMonthlyResetJob = () => {
  const nextRun = getNextMonthStart();
  const delay = Math.max(1000, nextRun.getTime() - Date.now());

  logger.info('Next creator monthly reset scheduled', { nextRun: nextRun.toISOString() });

  setTimeout(async () => {
    await resetCreatorMonthlyUploads();

    // Re-schedule every month after each run.
    startCreatorMonthlyResetJob();
  }, delay);
};

module.exports = {
  startCreatorMonthlyResetJob,
  resetCreatorMonthlyUploads,
};
