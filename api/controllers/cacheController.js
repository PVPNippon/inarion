const redisClient = require('../config/redis.js')
const config = require('../config/config')
const logger = require('../logger/logger.js')(__filename, 'Redis')

// Generic function to set a value in Redis with optional TTL
const setValueInRedis = async (key, value, ttl) => {
  try {
    if (!key || !value) {
      throw new Error('Invalid parameters: Key and value are required.')
    }

    const jsonString = typeof value === 'object' ? JSON.stringify(value) : value
    if (ttl) {
      await redisClient.setEx(key, ttl, jsonString)
    } else {
      await redisClient.set(key, jsonString)
    }
    logger.info(`Value set in Redis for key: "${key}"${ttl ? ` with TTL: ${ttl} seconds` : ''}`)
    const storedData = await getDataFromRedis(key)
    logger.info(JSON.stringify(storedData, null, 2), { storeLocation: 'file' })
  } catch (err) {
    logger.error(`Error setting value in Redis for key "${key}":${err}`)
    throw err
  }
}

const getDataFromRedis = async (key) => {
  try {
    const data = await redisClient.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    logger.error(`Error retrieving data from Redis:${error}`)
  }
}

const storeDataInRedis = async (key, data) => {
  try {
    await redisClient.set(key, JSON.stringify(data))
    logger.info('Data stored successfully in Redis')
    const storedData = await getDataFromRedis(key)
    logger.info(storedData)
  } catch (error) {
    logger.error(`Error storing data in Redis:${error}`)
  }
}

// Generic function to get a value from Redis
const getValueFromRedis = async (key) => {
  logger.info(key)
  logger.info(`this is the key:${key}`)
  try {
    if (!key) {
      throw new Error('Key is required to fetch data.')
    }

    const jsonString = await redisClient.get(key)
    if (!jsonString) {
      logger.info(`No data found in Redis for key: "${key}".`)
      return null
    }

    // Parse JSON if possible
    try {
      return JSON.parse(jsonString)
    } catch {
      return jsonString // If it's not JSON, return the raw string
    }
  } catch (err) {
    logger.error(`Error fetching data from Redis for key "${key}": ${err}`)
    throw err
  }
}

// Route handler to set a value in Redis
const setCache = async (req, res) => {
  try {
    const { key, value, ttl } = req.body
    await setValueInRedis(key, value, ttl)
    res.status(200).send(`Value set in Redis for key: "${key}".`)
  } catch (err) {
    res.status(500).send('Error setting value in Redis.')
  }
}

// Route handler to get a value from Redis
const getCache = async (req, res) => {
  try {
    logger.info(req.query)
    const { key } = req.query
    const value = await getValueFromRedis(key)

    if (value === null) {
      return res.status(404).send('Key not found in Redis.')
    }

    res.status(200).send(`Value retrieved from Redis: ${value}`)
  } catch (err) {
    res.status(500).send('Error retrieving value from Redis.', err)
  }
}

// Function to scan all keys with enhanced error handling
const scanKeys = async (req, res) => {
  try {
    // Perform SCAN operation
    const result = await redisClient.scan('0')

    res.status(200).json(result.keys.length !== 0 ? result.keys : `No key exists`)
  } catch (err) {
    logger.error(`Failed to complete the scan operation:${err}`)
    return res.status(500).json({ error: 'Failed to complete the scan operation.' })
  }
}

// Store JSON data in Redis using the generic set function
const storeJsonData = async (jsonData) => {
  try {
    if (!jsonData || typeof jsonData !== 'object' || !jsonData.driveName) {
      throw new Error('Invalid JSON data passed to storeJsonData.')
    }

    await setValueInRedis(jsonData.driveName, jsonData, config.TTL)
  } catch (err) {
    logger.error(`Error storing JSON in Redis:${err}`)
    throw err
  }
}

// Fetch JSON data from Redis using the generic get function
const fetchJsonData = async (req, res) => {
  try {
    const { driveName } = req.query
    if (!driveName) {
      return res.status(400).send('Drive name is required as a query parameter.')
    }

    const jsonData = await getValueFromRedis(driveName)
    if (!jsonData) {
      return res.status(404).send(`No data found in Redis for drive "${driveName}".`)
    }

    res.status(200).json(jsonData)
  } catch (err) {
    res.status(500).send('Error fetching JSON from Redis.')
  }
}

// Store a list of drives (shared or personal) in Redis
const storeDriveList = async (key, driveList) => {
  try {
    if (!key || !Array.isArray(driveList)) {
      throw new Error('Invalid parameters: A valid key and a drive list array are required.')
    }

    await setValueInRedis(key, driveList, config.TTL)
  } catch (err) {
    logger.error(`Error storing drive list for key "${key}":${err}`)
    throw err
  }
}

// Store individual drive data in Redis
const storeDriveData = async (key, driveData) => {
  try {
    if (!key || typeof driveData !== 'object') {
      throw new Error('Invalid parameters: A valid key and a drive data object are required.')
    }

    await setValueInRedis(key, driveData, config.TTL)
  } catch (err) {
    logger.error(`Error storing drive data for key "${key}":${err}`)
    throw err
  }
}

// Route handler to fetch a list of drives from Redis
const fetchDriveList = async (req, res) => {
  try {
    const { key } = req.query
    if (!key) {
      return res.status(400).send('Key is required as a query parameter.')
    }

    const driveList = await getValueFromRedis(key)
    if (!driveList) {
      return res.status(404).send(`No drive list found in Redis for key: "${key}".`)
    }

    res.status(200).json(driveList)
  } catch (err) {
    res.status(500).send('Error fetching drive list.')
  }
}

// Route handler to fetch individual drive data from Redis
const fetchDriveData = async (req, res) => {
  try {
    const { key } = req.query
    if (!key) {
      return res.status(400).send('Key is required as a query parameter.')
    }

    const driveData = await getValueFromRedis(key)
    if (!driveData) {
      return res.status(404).send(`No drive data found in Redis for key: "${key}".`)
    }

    res.status(200).json(driveData)
  } catch (err) {
    res.status(500).send('Error fetching drive data.')
  }
}

// Generic function to delete a value from Redis
const deleteCacheInRedis = async (key) => {
  try {
    if (!key) {
      throw new Error('Key is required to delete data.')
    }

    const result = await redisClient.del(key)
    if (result === 1) {
      logger.info(`Key "${key}" successfully deleted from Redis.`)
    } else {
      logger.info(`Key "${key}" not found in Redis.`)
    }

    return result
  } catch (err) {
    logger.error(`Error deleting key "${key}" from Redis:${err}`)
    throw err
  }
}

// Route handler to delete a value from Redis
const deleteCache = async (req, res) => {
  try {
    const { key } = req.query
    if (!key) {
      return res.status(400).send('Key is required as a query parameter.')
    }

    const result = await deleteCacheInRedis(key)
    if (result === 1) {
      res.status(200).send(`Key "${key}" successfully deleted from Redis.`)
    } else {
      res.status(404).send(`Key "${key}" not found in Redis.`)
    }
  } catch (err) {
    res.status(500).send('Error deleting key from Redis.')
  }
}

module.exports = {
  scanKeys,
  setCache,
  getCache,
  deleteCache,
  storeJsonData,
  fetchJsonData,
  storeDriveList,
  storeDriveData,
  fetchDriveList,
  fetchDriveData,
  getValueFromRedis,
  storeDataInRedis,
}
