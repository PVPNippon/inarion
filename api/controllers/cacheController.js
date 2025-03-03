/**
 * @fileoverview Abstraction layer for Redis-based caching mechanisms.
 * Provides utility functions to store, fetch, and clear data in Redis with support for
 * different data types: string, sets, hash, and JSON.
 */

const { STRING, SETS, HASH, JSON, TTL, SORTED_SETS } = require('../config/config')
const logger = require('../logger/logger')(__filename, 'Cache Abstraction Layer')
const {
  getSortedSetSize,
  getStringFromRedis,
  setStringInRedis,
  addToSetInRedis,
  addToSortedSetInRedis,
  setHashInRedis,
  setJsonInRedis,
  getSetMembers,
  getSortedSetMembers,
  getHashFromRedis,
  getJsonFromRedis,
  getHashFieldFromRedis,
  deleteKeyInRedis,
  isMemberOfSet,
  intersectionOfSets,
  scanSpecificKeys,
  updateSetInRedis,
  updateStringInRedis,
  updateSortedSetInRedis,
  updateHashInRedis,
  updateJsonInRedis,
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
    // console.log('Storing data in cache:')
    // console.log('Key:', key)
    // console.log('Data:', data)
    // console.log('Data type:', dataType)

    switch (dataType) {
      case STRING:
        await setStringInRedis(key, data, redisTransaction, ttl)
        break
      case SETS:
        await addToSetInRedis(key, data, redisTransaction, ttl)
        break
      case SORTED_SETS:
        await addToSortedSetInRedis(key, data, redisTransaction, ttl)
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
 * Updates cached data in Redis based on the provided data type.
 *
 * This function centralizes caching operations by delegating updates to specific Redis methods
 * according to the data type (e.g., STRING, SETS, SORTED_SETS, HASH, JSON). It supports optional
 * transaction handling and TTL management to meet enterprise-level caching requirements.
 *
 * @param {Object} params - An object containing the parameters.
 * @param {string} params.key - The unique key used to store the data in the cache.
 * @param {*} params.data - The data to be cached.
 * @param {string} params.dataType - The type of data being cached. Expected values include STRING, SETS, SORTED_SETS, HASH, and JSON.
 * @param {Object|null} [params.redisTransaction=null] - Optional Redis transaction object for atomic operations.
 * @param {number} [params.ttl=TTL] - Time-to-live for the cached data; defaults to a globally defined TTL.
 * @returns {Promise<void>} A promise that resolves when the cache update operation is complete.
 * @throws {Error} If the data type is unsupported or if an error occurs during the update process.
 */
async function updateDataInCache({ key, data, dataType, redisTransaction = null, ttl = TTL }) {
  try {
    switch (dataType) {
      case STRING:
        await updateStringInRedis(key, data, redisTransaction, ttl)
        break
      case SETS:
        await updateSetInRedis(key, data, redisTransaction, ttl)
        break
      case SORTED_SETS:
        await updateSortedSetInRedis(key, data, redisTransaction, ttl)
        break
      case HASH:
        await updateHashInRedis(key, data, redisTransaction, ttl)
        break
      case JSON:
        await updateJsonInRedis(key, data, redisTransaction, ttl)
        break
      default:
        /* For unsupported data types, an error is thrown to ensure that only valid caching operations occur.
         * This strict type handling prevents potential data integrity issues.
         */
        throw new Error(`Unsupported data type: ${dataType}`)
    }
  } catch (error) {
    /* The error is logged with contextual information about the key.
     * A new error with an enhanced message is then thrown to aid debugging in a production environment.
     */
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
      case SORTED_SETS:
        result = await getSortedSetMembers(key)
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
 * Retrieves a set of files from the cache based on the provided key and range.
 *
 * This function is intended to fetch elements from a sorted set stored in Redis. While the
 * SORTED_SETS type is implemented, placeholders exist for additional data types to allow for
 * future expansion. It gracefully handles cache misses and logs appropriate debugging information.
 *
 * @param {string} key - The unique key associated with the cached data.
 * @param {number} startCount - The starting index for retrieving elements from the sorted set.
 * @param {number} endCount - The ending index for retrieving elements from the sorted set.
 * @param {string} dataType - The type of data expected. Currently, only SORTED_SETS is fully supported.
 * @returns {Promise<*|boolean>} Returns the fetched data if available, or false if a cache miss occurs.
 * @throws {Error} If an unsupported data type is provided or if an error occurs during retrieval.
 */
async function fetchSetOfFilesFromCache(key, startCount, endCount, dataType) {
  try {
    let result
    switch (dataType) {
      case STRING:
        // Placeholder for future STRING type implementation.
        break
      case SETS:
        // Placeholder for future SETS type implementation.
        break
      case SORTED_SETS:
        // Retrieve a range of members from a sorted set using the specified indices.
        result = await getSortedSetMembers(key, startCount, endCount)
        break
      case HASH:
        // Placeholder for future HASH type implementation.
        break
      case JSON:
        // Placeholder for future JSON type implementation.
        break
      default:
        // Enforce strict type handling by throwing an error for unsupported data types.
        throw new Error(`Unsupported data type: ${dataType}`)
    }

    if (!result) {
      // Log a debug message for cache misses to assist in monitoring cache performance.
      logger.debug(`Cache miss for key: ${key}.`)
      return false
    }

    return result
  } catch (error) {
    // Log the error with contextual details, then throw a new error to surface the issue.
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
 * Checks for the existence of a specific key in the cache based on the provided data type.
 *
 * This function determines key existence by using the appropriate method for the given data type.
 * Currently, only the SORTED_SETS type is implemented (by checking the size of the sorted set).
 * The function is designed to support future expansion to other data types while providing
 * detailed logging for any errors encountered during the check.
 *
 * @param {string} key - The cache key to be checked for existence.
 * @param {string} dataType - The type of data stored at the key.
 * @param {Object|null} [redisTransaction=null] - Optional Redis transaction object for batch operations.
 * @returns {Promise<boolean|undefined>} Returns true if the key exists, false if it does not, or undefined if an error occurs.
 */
async function checkIfKeyExistsInCache(key, dataType, redisTransaction = null) {
  try {
    let result

    switch (dataType) {
      case STRING:
        // Placeholder for future STRING type existence check.
        break
      case SETS:
        // Placeholder for future SETS type existence check.
        break
      case SORTED_SETS:
        // Check the size of the sorted set; a non-zero size implies that the key exists.
        result = await getSortedSetSize(key)
        break
      case HASH:
        // Placeholder for future HASH type existence check.
        break
      case JSON:
        // Placeholder for future JSON type existence check.
        break
      default:
        /* For unsupported data types, an error is thrown to prevent silent failures
         * and maintain strict data integrity.
         */
        throw new Error(`Unsupported data type: ${dataType}`)
    }

    // If the result is falsy (e.g., undefined, null, or zero), the key does not exist.
    if (!result) {
      return false
    }

    // A truthy result indicates that the key exists in the cache.
    return true
  } catch (error) {
    // Log the error with detailed context; the function does not rethrow the error to avoid interrupting execution flow.
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
async function clearKeyInCache(key) {
  try {
    await deleteKeyInRedis(key)
  } catch (error) {
    logger.error('Error clearing key in cache', error)
  }
}

module.exports = {
  storeDataInCache,
  updateDataInCache,
  fetchDataFromCache,
  fetchSetOfFilesFromCache,
  fetchMultipleKeysFromCache,
  fetchIndividualFieldFromCache,
  checkIfMemberExistsInCache,
  checkIfKeyExistsInCache,
  fetchCommonItemsAcrossSets,
  clearKeyInCache,
}
