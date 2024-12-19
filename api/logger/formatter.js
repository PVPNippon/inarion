const { stack } = require('sequelize/lib/utils')
const winston = require('winston')
const { combine, timestamp, printf, label, align, errors } = winston.format

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
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),

    // Align the log entries for better readability
    align(),

    // Include the stack trace for error logs
    errors({ stack: true }),

    // Define a printf function to customize the log message
    printf((info) => {
      // Determine the color for the current log level
      const levelColor = customColors[info.level] || 'white'

      // Format metadata if it exists
      const metadataString = info.metadata ? ` | ${JSON.stringify(info.metadata)}` : ''
      const miscString = info.misc ? ` | ${JSON.stringify(info.misc)}` : ''
      const stackString = info.stack
        ? info.stack
            .split('\n') // Split stack trace into lines
            .map((line) => applyColor(line, 'red')) // Apply color to each line
            .join('\n') // Join the lines back together with newlines
        : ''

      // Format and return the log message with color and information
      return (
        `${applyColor(`[${info.timestamp}]`, 'cyan')} ` +
        `${applyColor(`[${info.label} ${info.lineNumber}]`, 'blue')} ` +
        `${applyColor(`[Module: ${moduleName || 'N/A'}]`, 'yellow')} ` +
        `${applyColor(`[Function: ${info.functionName || 'N/A'}]`, 'magenta')} ` +
        `${applyColor(info.level.toUpperCase() + ':', levelColor)} ` +
        `${applyColor(info.message, 'white')} ` +
        stackString +
        metadataString + // Append metadata string if it exists
        miscString // Append misc string if it exists
      )
    })
  )
}

module.exports = customFormat
