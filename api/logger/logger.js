const winston = require('winston')
const getCallerInfo = require('./callerInfo')
const customFormat = require('./formatter')
const createTransport = require('./transporter')
const logToDatabaseWithBulk = require('./dbLogging')

// Determine log level based on environment
const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

/**
 * Creates a logger function that will log messages to the console and/or a file.
 * @param {string} fileName - The name of the module being logged.
 * @param {string} [moduleName='N/A'] - The name of the module being logged.
 * @returns {Object} An object with methods for each log level (info, debug, warn, error).
 */
const logger = (fileName, moduleName = 'N/A') => {
  /**
   * Creates a logging function for the specified level.
   * @param {string} level - The log level to log at.
   * @returns {Function} A function that takes a message and optional metadata (functionName, module, storeLocation).
   */
  const enhanceLogging = (level) => {
    /**
     * Logs a message with the specified level and metadata.
     * @param {string} message - The message to log.
     * @param {Object} [options] - An object with the following properties:
     *   - {string} module - The module that is logging the message.
     *   - {string} storeLocation - The location to store the log. Can be 'stdout', 'file', or 'both'.
     */
    return async (message, { module, storeLocation = 'stdout' } = {}) => {
      if (storeLocation === 'db') {
        // Log to the database using the bulk logic
        await logToDatabaseWithBulk(message)
      } else {
        /**
         * Creates a dynamic logger with the specified level, format, and transports.
         * @param {string} level - The log level to log at.
         * @param {string} fileName - The name of the module being logged.
         * @param {Array} transports - An array of transports to log to.
         * @returns {Object} A Winston logger instance.
         */
        const dynamicLogger = winston.createLogger({
          level: logLevel,
          format: customFormat(fileName, moduleName),
          transports: createTransport(storeLocation),
        })

        const callerInfo = getCallerInfo()

        /**
         * Logs a message with the specified level and metadata.
         * @param {Object} info - An object with the log level, message, and metadata.
         */
        dynamicLogger.log({
          level,
          message,
          functionName: callerInfo.functionName,
          module,
        })
      }
    }
  }

  /**
   * Returns an object with methods for each log level.
   * @returns {Object} An object with methods for each log level (info, debug, warn, error).
   */
  return {
    info: enhanceLogging('info'),
    debug: enhanceLogging('debug'),
    warn: enhanceLogging('warn'),
    error: enhanceLogging('error'),
  }
}

module.exports = logger
