const winston = require('winston')

/**
 * Creates an array of Winston transports.
 * @param {string} storeLocation - The location to store logs (stdout, file, or both).
 * @param {string} fileName - The file name of the module.
 * @returns {Array} Array of transports.
 */
const createTransport = (storeLocation) => {
  const transports = []

  if (!storeLocation || storeLocation === 'stdout' || storeLocation === 'both') {
    transports.push(new winston.transports.Console())
  }

  if (!['stdout', 'file', 'both'].includes(storeLocation)) {
    throw new Error('Invalid storeLocation. Expected "stdout", "file", or "both".')
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

module.exports = createTransport
