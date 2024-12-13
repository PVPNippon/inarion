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
    return async (message, options = {}) => {
      const { metadata = null, module, storeLocation = 'stdout', misc = null } = options
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
          // handleExceptions: true,
          // handleRejections: true,
          exitOnError: false,
          // transports: [new winston.transports.Console()],
          // Exception handlers must be an array of transports
          exceptionHandlers: [new winston.transports.File({ filename: './logs/exceptions.log' })],

          // Rejection handlers must be an array of transports
          rejectionHandlers: [new winston.transports.File({ filename: './logs/rejections.log' })],
        })

        const callerInfo = getCallerInfo()

        // Include metadata and misc as part of the log context
        const logContext = {}
        if (metadata) logContext.metadata = metadata
        if (misc) logContext.misc = misc

        const loggerWithContext = Object.keys(logContext).length ? dynamicLogger.child(logContext) : dynamicLogger

        // If the message is an instance of Error, ensure the stack trace is included
        if (message instanceof Error) {
          // If it's an error object, explicitly pass the stack trace
          loggerWithContext.log({
            level,
            message: message.message, // Only include message in the log
            stack: message.stack, // Include stack for error logs
            functionName: callerInfo.functionName,
            lineNumber: callerInfo.lineNumber,
            module,
          })
        } else {
          // For other log levels, we log normally without stack
          loggerWithContext.log({
            level,
            message,
            functionName: callerInfo.functionName,
            lineNumber: callerInfo.lineNumber,
            module,
          })
        }
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
