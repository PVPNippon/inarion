const winston = require('winston')
const path = require('path')
const { combine, timestamp, printf, label, align } = winston.format

// Define custom colors for log levels and metadata
const customColors = {
  info: 'green',
  debug: 'yellow',
  warn: 'orange',
  error: 'red',
}

// Map color names to ANSI codes
const colorMap = {
  green: '32',
  yellow: '33',
  orange: '38;5;208', // ANSI 256 color for orange
  red: '31',
  magenta: '35',
  cyan: '36',
  blue: '34',
  white: '37',
}

/**
 * Applies a color to a given text using ANSI escape sequences.
 * @param {string} text The text to apply the color to
 * @param {string} color The color to apply, as a color name (e.g. 'green', 'yellow', etc.)
 * @returns {string} The text with the color applied
 */
function applyColor(text, color) {
  // Get the ANSI escape sequence for the color
  // If the color is not found, use the default (black)
  const ansiCode = colorMap[color] || '0'
  // Wrap the text in the ANSI escape sequences
  return `\x1b[${ansiCode}m${text}\x1b[0m`
}

// Determine log level based on environment
const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

/**
 * Function to get the caller's true location, including the file name and function name.
 * @returns {Object} An object containing the caller's file name and function name.
 */
function getCallerInfo() {
  // Create a new error to capture the stack trace
  const stack = new Error().stack.split('\n')

  // Find the line in the stack trace that corresponds to the caller
  const callerLine = stack.find((line) => !line.includes(__filename) && line.includes('at')) // Skip Logger's own calls

  // If no caller line is found, return unknown values
  if (!callerLine) {
    return { fileName: 'Unknown', functionName: 'Unknown' }
  }

  // Match and extract the function name and file path from the caller line
  const match = callerLine.match(/at (\S+) \((.*):\d+:\d+\)/) || callerLine.match(/at (.+):(\d+):\d+/)

  // Return the extracted information, or unknown values if matching fails
  return match
    ? {
        fileName: path.basename(match[2]),
        functionName: match[1] || 'anonymous',
      }
    : { fileName: 'Unknown', functionName: 'Unknown' }
}

/**
 * Custom format for logs, including timestamp, module, and function information.
 * @param {string} fileName - The name of the module being logged.
 * @param {string} moduleName - The name of the module being logged.
 * @returns {Object} A combined format for logging using Winston.
 */
const customFormat = (fileName, moduleName) => {
  // Remove the base path from the module name
  const formattedFileName = fileName.replace('/usr/src/app/', '')

  return combine(
    // Add a label with the formatted module name
    label({ label: formattedFileName }),

    // Add a timestamp with the specified format
    timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),

    // Align the log entries for better readability
    align(),

    // Include the stack trace for error logs
    winston.format.errors({ stack: true }),

    // Define a printf function to customize the log message
    printf((info) => {
      // Determine the color for the current log level
      const levelColor = customColors[info.level] || 'white'

      // Format and return the log message with color and information
      return (
        `${applyColor(`[${info.timestamp}]`, 'cyan')} ` +
        `${applyColor(`[${info.label}]`, 'blue')} ` +
        `${applyColor(`[Module: ${moduleName || 'N/A'}]`, 'yellow')} ` +
        `${applyColor(`[Function: ${info.functionName || 'N/A'}]`, 'magenta')} ` +
        `${applyColor(info.level.toUpperCase() + ':', levelColor)} ` +
        `${applyColor(info.message, 'white')} ` +
        (info.stack ? `\n${applyColor(info.stack, 'red')}` : '') // Include stack trace if available
      )
    })
  )
}

/**
 * Creates an array of Winston transports.
 * @param {string} storeLocation - The location to store logs (stdout, file, or both).
 * @param {string} fileName - The file name of the module.
 * @returns {Array} Array of transports.
 */
const createTransport = (storeLocation, fileName) => {
  const transports = []

  if (!storeLocation || storeLocation === 'stdout' || storeLocation === 'both') {
    transports.push(new winston.transports.Console())
  }

  if (storeLocation === 'file' || storeLocation === 'both') {
    transports.push(
      new winston.transports.File({
        filename: 'app-debug.log',
        level: 'debug',
      }),
      new winston.transports.File({
        filename: 'app-error.log',
        level: 'error',
      }),
      ...(storeLocation === 'both'
        ? [
            new winston.transports.File({
              filename: 'combined.log',
            }),
          ]
        : [])
    )
  }

  return transports
}

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
    return (message, { module, storeLocation = 'stdout' } = {}) => {
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
        transports: createTransport(storeLocation, fileName),
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
