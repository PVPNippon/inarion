const logBuffer = [] // Buffer to store logs before inserting them into the database
const MAX_LOG_BUFFER_SIZE = 10 // Maximum number of logs before performing a bulk insert
const FLUSH_INTERVAL = 30000 // Time interval (in milliseconds) to flush logs (30 seconds)

let flushTimeout = null

// Function to flush logs to the database
const flushLogsToDatabase = async () => {
  if (logBuffer.length > 0) {
    try {
      // Get all the logs to be inserted
      const logsToInsert = [...logBuffer] // Clone the buffer to avoid mutation during insertion

      // Clear the buffer after getting logs
      logBuffer.length = 0

      // Insert the logs into the database in bulk
      await insertLogsInBulk(logsToInsert)
      console.log(`Successfully flushed ${logsToInsert.length} logs to the database.`)
    } catch (error) {
      console.error('Error flushing logs to the database:', error)
    }
  }
}

/**
 * Function to get the user's public IP address.
 */
const getPublicIp = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip // Return the public IP address
  } catch (error) {
    console.error('Error fetching public IP:', error)
    return null // Return null if there's an error
  }
}

// Function to insert logs in bulk into the database
const insertLogsInBulk = async (logsToInsert) => {
  try {
    // Dynamically require the Logs model only when needed
    const Logs = require('../models/Logs')

    // Insert the logs into the database in bulk
    await Logs.bulkCreate(logsToInsert)
    console.log('Logs successfully inserted in bulk to the database.')
  } catch (error) {
    console.error('Error inserting logs in bulk:', error)
  }
}

// Function to handle logging to the database with bulk insert
const logToDatabaseWithBulk = async (message) => {
  try {
    // Get the user's public IP
    const userIp = await getPublicIp()

    // Prepare the log entry with necessary metadata
    const logEntry = {
      userIp,
      message: typeof message === 'object' ? message : { text: message },
      timestamp: new Date().toISOString(),
    }

    // Add the log entry to the buffer for bulk logging
    logBuffer.push(logEntry)

    // If buffer size exceeds the limit, flush the logs to the database
    if (logBuffer.length >= MAX_LOG_BUFFER_SIZE) {
      await flushLogsToDatabase()
    }

    // Set a timeout to periodically flush logs if the buffer isn't full yet
    if (!flushTimeout) {
      flushTimeout = setTimeout(async () => {
        await flushLogsToDatabase()
        flushTimeout = null
      }, FLUSH_INTERVAL)
    }
  } catch (error) {
    console.error('Failed to log to database:', error)
  }
}

module.exports = logToDatabaseWithBulk
