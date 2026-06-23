const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      maxPoolSize: 5,
      minPoolSize: 1,
    });
    logger.info('MongoDB connected', { host: conn.connection.host });
  } catch (error) {
    logger.error('MongoDB connection error', { error: error.message });
    process.exit(1);
  }
};

module.exports = connectDB;
