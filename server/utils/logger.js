/**
 * Winston logger for structured server logs.
 */

const { createLogger, format, transports } = require('winston');

// Custom console format for clean developer logs
const consoleFormat = format.printf(({ level, message, stack }) => {
  let formattedMessage = message;

  // Format object messages cleanly
  if (typeof formattedMessage === 'object') {
    formattedMessage = JSON.stringify(formattedMessage);
  }

  // Apply colors and symbols for non-production environments
  if (process.env.NODE_ENV !== 'production') {
    if (typeof formattedMessage === 'string') {
      if (formattedMessage.startsWith('✓')) {
        // Green color
        formattedMessage = `\x1b[32m${formattedMessage}\x1b[0m`;
      } else if (formattedMessage.startsWith('⚠')) {
        // Yellow color
        formattedMessage = `\x1b[33m${formattedMessage}\x1b[0m`;
      } else if (formattedMessage.startsWith('✗')) {
        // Red color
        formattedMessage = `\x1b[31m${formattedMessage}\x1b[0m`;
      } else if (formattedMessage.startsWith('→')) {
        // Cyan/Blue color
        formattedMessage = `\x1b[36m${formattedMessage}\x1b[0m`;
      } else {
        // Fallback styling for standard log levels without indicators
        if (level === 'error') {
          formattedMessage = `\x1b[31m✗ [ERROR] ${formattedMessage}\x1b[0m`;
        } else if (level === 'warn') {
          formattedMessage = `\x1b[33m⚠ [WARN] ${formattedMessage}\x1b[0m`;
        } else if (level === 'debug') {
          formattedMessage = `\x1b[34m[DEBUG] ${formattedMessage}\x1b[0m`;
        }
      }
    }
  }

  // Include stack trace only if NODE_ENV is development
  const stackInfo = stack && process.env.NODE_ENV === 'development' ? `\n${stack}` : '';
  return `${formattedMessage}${stackInfo}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? format.json()
      : consoleFormat
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
