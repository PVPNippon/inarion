const logBuffer = [] // Buffer to hold log entries
const MAX_LOG_BUFFER_SIZE = 50 // Increase buffer size for large-scale testing
const FLUSH_INTERVAL = 100 // Shorten flush interval for rapid flush testing
let flushTimeout = null

/**
 * Flush logs by printing them to the console.
 */
const flushLogsToConsole = async () => {
  if (logBuffer.length === 0) {
    console.log('No logs to flush.')
    return
  }

  try {
    // Simulate flushing logs to the console
    console.log('Flushing logs to console:', [...logBuffer])

    // Clear the buffer after flushing
    logBuffer.length = 0

    // Clear the flush timeout
    clearTimeout(flushTimeout)
    flushTimeout = null
  } catch (error) {
    console.error('Error during simulated console flush:', error)
  }
}

/**
 * Mock logging to console with bulk insert simulation.
 * @param {string|object} message - The log message to simulate.
 */
const logToConsoleWithBulk = async (message) => {
  try {
    // Mock log entry with necessary metadata
    const logEntry = {
      message: typeof message === 'object' ? message : { text: message },
      timestamp: new Date().toISOString(),
    }

    // Add the log entry to the buffer
    logBuffer.push(logEntry)

    // Flush the logs if buffer size exceeds the limit
    if (logBuffer.length >= MAX_LOG_BUFFER_SIZE) {
      await flushLogsToConsole()
    }

    // Set a timeout to periodically flush logs if the buffer isn't full yet
    if (!flushTimeout) {
      flushTimeout = setTimeout(async () => {
        await flushLogsToConsole()
      }, FLUSH_INTERVAL)
    }
  } catch (error) {
    console.error('Error in simulated logging to console:', error)
  }
}

module.exports = { logToConsoleWithBulk, flushLogsToConsole }
