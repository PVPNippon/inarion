const winston = require('winston')
const path = require('path')

const getDailyLogFileName = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0') // Months are 0-indexed
  const dd = String(now.getDate()).padStart(2, '0')
  return path.join('./logs', `${yyyy}-${mm}-${dd}.log`)
}

/**
 * Creates an array of Winston transports.
 * @param {string} storeLocation - The location to store logs. Valid values are:
 *  - 'stdout': logs will be printed to the console
 *  - 'file': logs will create a new file each day with logs for that day
 *  - 'both': logs will be written to both the console and a daily file
 * @returns {Array} Array of transports
 */
const createTransport = (storeLocation) => {
  const transports = []

  // Log to console
  if (['stdout', 'both'].includes(storeLocation)) {
    transports.push(new winston.transports.Console())
  }

  // Log to a daily file
  if (['file', 'both'].includes(storeLocation)) {
    transports.push(
      new winston.transports.File({
        filename: getDailyLogFileName(),
      })
    )
  }

  return transports
}

module.exports = { createTransport, getDailyLogFileName }
