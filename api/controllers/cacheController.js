/**
 * @fileoverview Abstraction layer for Redis-based caching mechanisms.
 * Provides utility functions to store, fetch, and clear data in Redis with support for
 * different data types: string, sets, hash, and JSON.
 */

const { STRING, SETS, HASH, JSON } = require('../config/config')
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
} = require('../services/redisCacheService')

/**
 * Stores data in Redis cache.
 *
 * @param {string} key - The key under which data is to be stored in Redis.
 * @param {*} data - The data to be stored in the cache.
 * @param {string} dataType - The type of data being stored ('string', 'sets', 'hash', 'json').
 * @param {number|null} ttl - Optional time-to-live in seconds. Defaults to null.
 * @throws Will throw an error if storing data fails.
 */
async function storeDataInCache(key, data, dataType, redisTransaction = null, ttl = null) {
  try {
    switch (dataType) {
      case STRING:
        await setStringInRedis(key, data, redisTransaction, !!ttl)
        break
      case SETS:
        await addToSetInRedis(key, data, redisTransaction, !!ttl)
        break
      case HASH:
        await setHashInRedis(key, data, redisTransaction, !!ttl)
        break
      case JSON:
        await setJsonInRedis(key, data, redisTransaction, !!ttl)
        break
      default:
        throw new Error(`Unsupported data type: ${dataType}`)
    }
  } catch (error) {
    logger.error(`Error storing data in cache for key: ${key}`, error)
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
 * Fetches data from Redis cache.
 *
 * @param {string} key - The key to check data for.
 * @param {string} dataType - The type of data to fetch ('string', 'sets', 'hash', 'json').
 * @returns {Promise<*>} True if data exists amongst other values in the key, or, false if either no data is found or value does not exists
 * @throws Will throw an error if fetching data fails.
 */
async function checkIfMemberExistsInCache(key, id, dataType, redisTransaction = null) {
  try {
    let result
    switch (dataType) {
      case SETS:
        result = await isMemberOfSet(key, id, redisTransaction)
        break
      default:
        logger.error(`Unsupported data type: ${dataType}`)
    }

    if (!result) {
      return false
    }

    return result
  } catch (error) {
    logger.error(`Error fetching data from cache for key: ${key}`, error)
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
  fetchIndividualFieldFromCache,
  checkIfMemberExistsInCache,
  clearKeyInCache,
}
