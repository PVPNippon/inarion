/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const logBuffer = [] // Buffer to store logs before inserting them into the database
const MAX_LOG_BUFFER_SIZE = 10 // Maximum number of logs before performing a bulk insert
const FLUSH_INTERVAL = 30000 // Time interval (in milliseconds) to flush logs (30 seconds)
const MAX_RETRIES = 3 // Maximum number of retries for database insert
const BASE_RETRY_DELAY = 1000 // Base delay in milliseconds for retries (1 second)

let flushTimeout = null

//TODO: Add the code to get the userIp (client IP address) from the request   console.log(req.connection.remoteAddress)

// Function to flush logs to the database
const flushLogsToDatabase = async () => {
  if (logBuffer.length > 0) {
    try {
      const logsToInsert = [...logBuffer] // Clone the buffer to avoid mutation during insertion
      logBuffer.length = 0 // Clear the buffer after getting logs

      // Insert logs into the database with retries
      await insertLogsInBulkWithRetry(logsToInsert)
      console.log(`Successfully flushed ${logsToInsert.length} logs to the database.`)
    } catch (error) {
      console.error('Error flushing logs to the database:', error)
    }
  }
}

// Function to insert logs in bulk into the database with retries
const insertLogsInBulkWithRetry = async (logsToInsert) => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await insertLogsInBulk(logsToInsert) // Try inserting logs
      return // Exit the function if successful
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error)

      if (attempt === MAX_RETRIES) {
        console.error('Max retries reached. Failed to insert logs in bulk.')
        throw error
      }

      // Calculate exponential backoff delay
      const retryDelay = BASE_RETRY_DELAY * 2 ** (attempt - 1)

      console.log(`Retrying in ${retryDelay / 1000} seconds...`)
      await new Promise((resolve) => setTimeout(resolve, retryDelay)) // Wait before retrying
    }
  }
}

// Function to insert logs in bulk into the database
const insertLogsInBulk = async (logsToInsert) => {
  try {
    const Logs = require('../models/Logs') // Dynamically require the Logs model only when needed
    await Logs.bulkCreate(logsToInsert)
    console.log('Logs successfully inserted in bulk to the database.')
  } catch (error) {
    console.error('Error inserting logs in bulk:', error)
    throw error // Re-throw the error for retry logic
  }
}

// Function to handle logging to the database with bulk insert
const logToDatabaseWithBulk = async (message) => {
  try {
    const logEntry = {
      userIp,
      message: typeof message === 'object' ? message : { text: message },
      timestamp: new Date().toISOString(),
    }

    logBuffer.push(logEntry) // Add the log entry to the buffer for bulk logging

    if (logBuffer.length >= MAX_LOG_BUFFER_SIZE) {
      await flushLogsToDatabase() // Flush logs if buffer size exceeds the limit
    }

    if (!flushTimeout) {
      flushTimeout = setTimeout(async () => {
        await flushLogsToDatabase() // Flush logs periodically
        flushTimeout = null
      }, FLUSH_INTERVAL)
    }
  } catch (error) {
    console.error('Failed to log to database:', error)
  }
}

module.exports = logToDatabaseWithBulk
