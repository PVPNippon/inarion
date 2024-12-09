const winston = require('winston')

/**
 * Creates an array of Winston transports.
 * @param {string} storeLocation - The location to store logs. Valid values are
 *  - 'stdout': logs will be printed to the console
 *  - 'file': logs will be written to files in the current working directory
 *  - 'both': logs will be written to both the console and files
 * @returns {Array} Array of transports
 */
const createTransport = (storeLocation) => {
  const transports = []

  // Log to console
  if (['stdout', 'both'].includes(storeLocation)) {
    transports.push(new winston.transports.Console())
  }

  // Log to files
  if (['file', 'both'].includes(storeLocation)) {
    transports.push(
      new winston.transports.File({ filename: './logs/app-debug.log', level: 'debug' }),
      new winston.transports.File({ filename: './logs/app-error.log', level: 'error' })
    )
  }

  // Log to combined file if storeLocation is 'both'
  if (storeLocation === 'both') {
    transports.push(new winston.transports.File({ filename: './logs/combined.log' }))
  }

  return transports
}

module.exports = createTransport
