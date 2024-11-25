const winston = require('winston')
const path = require('path')
const { combine, timestamp, printf, label, align } = winston.format
const fs = require('fs')

// Define custom colors for log levels and metadata
const customColors = {
  info: 'green',
  debug: 'yellow',
  warn: 'orange',
  error: 'red',
  timestamp: 'cyan',
  module: 'blue',
  functionName: 'magenta',
  callerInfo: 'yellow',
}

// Map color names to ANSI codes
const colorMap = {
  bold: '1',
  green: '32',
  yellow: '33',
  orange: '38;5;208', // ANSI 256 color for orange
  red: '31',
  magenta: '35',
  cyan: '36',
  blue: '34',
  white: '37',
}

// Apply colors using ANSI escape sequences
// This function takes a text string and a color name, and
// returns the text wrapped in ANSI escape sequences to
// apply the specified color
const applyColor = (text, color) => {
  // Get the ANSI code for the specified color
  const ansiCode = colorMap[color]

  // If the color is not found, use the default color
  // (which is usually white)
  const code = ansiCode || '0'

  // Wrap the text in the ANSI escape sequences
  return `\x1b[${code}m${text}\x1b[0m`
}
// Determine log level based on environment
const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

/**
 * Function to get the true caller location (line and column only)
 * @returns {string} Caller location in the format "line:column"
 */
const getCallerInfo = () => {
  const originalStackTraceLimit = Error.stackTraceLimit
  Error.stackTraceLimit = 20 // Increase stack trace limit to capture deeper levels
  const error = new Error()
  const stack = error.stack.split('\n')
  Error.stackTraceLimit = originalStackTraceLimit // Reset stack trace limit

  // Skip `logger.js`, `node_modules`, and ensure we're looking at actual file paths
  const callerStack = stack.find(
    (line) => line.includes(path.sep) && !line.includes('logger.js') && !line.includes('node_modules')
  )

  if (callerStack) {
    const match = callerStack.match(/:(\d+):(\d+)/) // Extract line and column
    if (match) {
      const [, line, column] = match
      return `${line}:${column}` // Return only line and column
    }
  }
  return 'Unknown location'
}

/**
 * Custom format for logs, including timestamp, module, and function information.
 * @param {string} moduleName - The name of the module being logged.
 * @returns {Object} A combined format for logging using Winston.
 */
const customFormat = (moduleName) => {
  // Remove the base path from the module name
  const formattedModuleName = moduleName.replace('/usr/src/app/', '')

  return combine(
    // Add a label with the formatted module name
    label({ label: formattedModuleName }),

    // Add a timestamp with the specified format
    timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),

    // Align the log entries for better readability
    align(),

    // Include the stack trace for error logs
    winston.format.errors({ stack: true }),

    // Define a printf function to customize the log message
    printf((info) => {
      // Get the caller's line and column information
      const callerInfo = getCallerInfo()

      // Determine the color for the current log level
      const levelColor = customColors[info.level] || 'white'

      // Format and return the log message with color and information
      return (
        `${applyColor(`[${info.timestamp}]`, 'cyan')} ` +
        `${applyColor(`[${info.label} ${callerInfo}]`, 'blue')} ` +
        `${applyColor(`[Module: ${info.module || 'N/A'}]`, 'yellow')} ` +
        `${applyColor(`[Function: ${info.functionName || 'N/A'}]`, 'magenta')} ` +
        `${applyColor(info.level.toUpperCase() + ':', levelColor)} ` +
        `${applyColor(info.message, 'white')} ` +
        (info.stack ? `\n${applyColor(info.stack, 'red')}` : '') // Include stack trace if available
      )
    })
  )
}

/**
 * Creates a transport array for Winston.
 * @param {string} storeLocation - Location to store the log. Can be 'stdout', 'file', or 'both'.
 * @returns {Array} An array of transports.
 */
const createTransport = (storeLocation, moduleName) => {
  const transports = []

  // Console transport
  if (!storeLocation || storeLocation === 'stdout' || storeLocation === 'both') {
    // Add a console transport
    transports.push(new winston.transports.Console())
  }

  // File transport
  if (storeLocation === 'file' || storeLocation === 'both') {
    // Debug level logs go to app-debug.log
    transports.push(
      new winston.transports.File({
        filename: 'app-debug.log',
        level: 'debug',
        format: customFormat(moduleName),
      }).on('error', (err) => {
        console.error('Error writing to app-debug.log:', err)
      })
    )

    // Error level logs go to app-error.log
    transports.push(
      new winston.transports.File({
        filename: 'app-error.log',

        level: 'error',

        format: customFormat(moduleName),
      }).on('error', (err) => {
        console.error('Error writing to app-error.log:', err)
      })
    )

    // All logs go to combined.log when storeLocation is 'both'
    if (storeLocation === 'both') {
      transports.push(
        new winston.transports.File({
          /**
           * The filename to write the log to. This filename is relative to the
           * current working directory of the Node.js process.
           */
          filename: 'combined.log',
          /**
           * The format of the log messages. This format is used for both the
           * console and file transports.
           */
          format: customFormat(moduleName),
        }).on('error', (err) => {
          console.error('Error writing to combined.log:', err)
        })
      )
    }
  }

  return transports
}

/**
 * Creates a logger function that will log messages to the console and/or a file.
 * @param {string} moduleName - The name of the module being logged.
 * @returns {Object} An object with methods for each log level (info, debug, warn, error).
 */
const logger = (moduleName) => {
  /**
   * Creates a logging function for the specified level.
   * @param {string} level - The log level to log at.
   * @returns {Function} A function that takes a message and optional metadata (functionName, module, storeLocation).
   */
  const enhanceLogging = (level) => {
    return (message, { functionName, module, storeLocation = 'stdout' } = {}) => {
      /**
       * Creates a dynamic logger with the specified level, format, and transports.
       * @param {string} level - The log level to log at.
       * @param {string} moduleName - The name of the module being logged.
       * @param {Array} transports - An array of transports to log to.
       * @returns {Object} A Winston logger instance.
       */
      const dynamicLogger = winston.createLogger({
        level: logLevel,
        format: customFormat(moduleName),
        transports: createTransport(storeLocation, moduleName),
      })

      /**
       * Logs a message with the specified level and metadata.
       * @param {Object} info - An object with the log level, message, and metadata.
       */
      dynamicLogger.log({
        level,
        message,
        functionName,
        module,
      })
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
