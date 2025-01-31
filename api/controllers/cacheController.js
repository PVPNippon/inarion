/**
 * @fileoverview Abstraction layer for Redis-based caching mechanisms.
 * Provides utility functions to store, fetch, and clear data in Redis with support for
 * different data types: string, sets, hash, and JSON.
 */

const { STRING, SETS, HASH, JSON, TTL } = require('../config/config')
const logger = require('../logger/logger')(__filename, 'Cache Abstraction Layer')
const {
  getStringFromRedis,
  setStringInRedis,
  addToSetInRedis,
  setHashInRedis,
  setJsonInRedis,
  getSetMembers,
  getHashFromRedis,
  getJsonFromRedis,
  getHashFieldFromRedis,
  deleteKeyInRedis,
  deleteJsonFromRedis,
  isMemberOfSet,
  intersectionOfSets,
  scanSpecificKeys,
} = require('../services/redisCacheService')

/**
 * Stores data in Redis cache based on the specified data type.
 *
 * Supports various data types such as STRING, SETS, HASH, and JSON. This function dynamically
 * selects the appropriate Redis operation based on the `dataType` parameter. If a Redis transaction
 * is provided, the operation is added to the transaction.
 *
 * @param {string} key - The Redis key under which the data will be stored.
 * @param {*} data - The data to be stored in the cache.
 * @param {string} dataType - The type of data (STRING, SETS, HASH, JSON).
 * @param {Object|null} redisTransaction - Optional Redis transaction for batch operations.
 * @param {number} ttl - Time-to-live for the cached data (defaults to a predefined TTL).
 * @throws {Error} - If an unsupported data type is provided or if the Redis operation fails.
 */
async function storeDataInCache({ key, data, dataType, redisTransaction = null, ttl = TTL }) {
  try {
    switch (dataType) {
      case STRING:
        await setStringInRedis(key, data, redisTransaction, ttl)
        break
      case SETS:
        await addToSetInRedis(key, data, redisTransaction, ttl)
        break
      case HASH:
        await setHashInRedis(key, data, redisTransaction, ttl)
        break
      case JSON:
        await setJsonInRedis(key, data, redisTransaction, ttl)
        break
      default:
        // Throw an error for unsupported data types
        throw new Error(`Unsupported data type: ${dataType}`)
    }
  } catch (error) {
    // Log the error and rethrow it with a more descriptive message
    console.error(`Error storing data in cache for key: ${key}`, error)
    throw new Error(`Failed to store data in cache: ${error.message}`)
  }
}

/**
 * Fetches data from Redis cache.
 *
 * @param {string} key - The key to fetch data for.
 * @param {string} dataType - The type of data to fetch ('string', 'sets', 'hash', 'json').
 * @returns {Promise<*>} The data retrieved from the cache, or false if no data is found.
 * @throws Will throw an error if fetching data fails.
 */
async function fetchDataFromCache(key, dataType) {
  try {
    let result
    switch (dataType) {
      case STRING:
        result = await getStringFromRedis(key)
        break
      case SETS:
        result = await getSetMembers(key)
        break
      case HASH:
        result = await getHashFromRedis(key)
        break
      case JSON:
        result = await getJsonFromRedis(key)
        break
      default:
        throw new Error(`Unsupported data type: ${dataType}`)
    }

    if (!result) {
      logger.debug(`Cache miss for key: ${key}.`)
      return false
    }

    return result
  } catch (error) {
    logger.error(`Error fetching data from cache for key: ${key}`, error)
    throw new Error(`Failed to fetch data from cache: ${error.message}`)
  }
}

/**
 * Fetches multiple keys from Redis based on the pattern and retrieves their data.
 *
 * @param {string} pattern - The Redis key pattern to match.
 * @param {number} count - The number of keys to fetch.
 * @param {string} dataType - The type of data to fetch ('hash', 'string', etc.).
 * @param {string} cursor - Redis scan cursor (default: '0' for starting point).
 * @returns {Promise<{items: Object, nextCursor: string}>} Fetched items and next cursor.
 */
async function fetchMultipleKeysFromCache(pattern, count, cursor = '0') {
  try {
    let fetchedKeys = []

    // Fetch keys matching the pattern until the count limit is reached
    while (fetchedKeys.length < count) {
      const result = await scanSpecificKeys(cursor, pattern, count)
      nextCursor = result.cursor // Update cursor
      const keys = result.keys // Keys fetched in this scan

      // console.log('Keys fetched: ', keys)
      // console.log('Next cursor: ', nextCursor)

      // Collect keys up to the count limit
      for (const key of keys) {
        fetchedKeys.push(key)
        if (fetchedKeys.length === count) break
      }

      if (cursor === '0') break // End of data
    }

    return { fetchedKeys, nextCursor }
  } catch (error) {
    console.error(`Error fetching multiple keys from cache: ${error.message}`)
    throw error
  }
}

/**
 * Fetches a specific field from a cached hash or JSON object.
 *
 * @param {string} key - The key to fetch the field for.
 * @param {string} dataType - The type of data ('hash', 'json').
 * @throws Will log an error if fetching the field fails or if the data type is unsupported.
 */
async function fetchIndividualFieldFromCache(key, dataType) {
  try {
    switch (dataType) {
      case HASH:
        await getHashFieldFromRedis(key)
        break
      case JSON:
        await getJsonFromRedis(key)
        break
      default:
        logger.debug(`${dataType} does not support individual fields.`)
    }
  } catch (error) {
    logger.error('Error fetching individual field from cache', error)
  }
}

/**
 * Checks if a specific member exists in a Redis data structure.
 *
 * @param {string} key - The Redis key to check.
 * @param {string} id - The member ID to check for.
 * @param {string} dataType - The type of data structure (e.g., SETS).
 * @param {Object|null} redisTransaction - Optional Redis transaction for batch operations.
 * @returns {Promise<boolean>} - Returns `true` if the member exists, otherwise `false`.
 * @throws {Error} - If an unsupported data type is provided or if the Redis operation fails.
 */
async function checkIfMemberExistsInCache(key, id, dataType, redisTransaction = null) {
  try {
    let result

    // Perform the membership check based on the data type
    switch (dataType) {
      case SETS:
        // Check if the ID is a member of the Redis set
        result = await isMemberOfSet(key, id, redisTransaction)
        break
      default:
        // Log an error for unsupported data types
        logger.error(`Unsupported data type: ${dataType}`)
    }

    // If the result is undefined or null, return false
    if (!result) {
      return false
    }

    // Return the result of the membership check
    return result
  } catch (error) {
    // Log the error and return undefined
    logger.error(`Error fetching data from cache for key: ${key}`, error)
  }
}

/**
 * Fetches the common items across multiple Redis sets.
 *
 * @param {Array<string>} keys - An array of Redis keys representing the sets to intersect.
 * @returns {Promise<Set<string>>} - A set containing the common items across all the sets.
 * @throws {Error} - If the intersection operation fails.
 */
async function fetchCommonItemsAcrossSets(keys) {
  try {
    // Find the intersection of items from the provided Redis set keys
    const commonItems = await intersectionOfSets(keys)

    // Return the intersected items
    return commonItems
  } catch (error) {
    // Log the error and rethrow it for handling upstream
    logger.error('Error fetching common items from Redis:', error.message)
    throw error
  }
}

/**
 * Clears a specific key from Redis cache.
 *
 * @param {string} key - The key to clear.
 * @param {string} dataType - The type of data ('json', or others).
 * @throws Will log an error if clearing the key fails.
 */
async function clearKeyInCache(key, dataType) {
  try {
    switch (dataType) {
      case JSON:
        await deleteJsonFromRedis(key)
        break
      default:
        await deleteKeyInRedis(key)
        break
    }
  } catch (error) {
    logger.error('Error clearing key in cache', error)
  }
}

module.exports = {
  storeDataInCache,
  fetchDataFromCache,
  fetchMultipleKeysFromCache,
  fetchIndividualFieldFromCache,
  checkIfMemberExistsInCache,
  fetchCommonItemsAcrossSets,
  clearKeyInCache,
}
