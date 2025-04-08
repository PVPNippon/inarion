/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const config = require('../config/config.js')
const redisClient = require('../config/redis.js')
const logger = require('../logger/logger.js')(__filename, 'Redis Cache Service')

/**
 * Returns the remaining TTL (seconds) of `key`.
 *
 * @param {string} key - The key whose TTL to retrieve.
 * @returns {Promise<number>} A Promise object which resolves to:
 *   - The remaining TTL (seconds) of `key` if it has one.
 *   - `-2` if `key` does not exist.
 *   - `-1` if `key` exists but does not have a TTL.
 * @throws {Error} The returned Promise object resolves to an error if `key` is not a string.
 * @see {@link https://redis.io/docs/latest/commands/ttl/}
 */
function getTtl(key) {
  return redisClient.ttl(key)
}

/**
 * Sets a TTL (seconds) to `key`.
 *
 * @param {string} key - The key whose TTL to set.
 * @param {number} ttl - The TTL in seconds to set.
 * @param {string} [ttlMode] - An optional string specifying the mode for the TTL.
 *   If `ttl` is not specified as an integer, `ttlMode` is ignored.
 *   If specified, `ttlMode` is expected to be one of the following (case-insensitive):
 *   - `NX` (only set the TTL if the key has no existing TTL)
 *   - `XX` (only set the TTL if the key already has an existing TTL)
 *   - `GT` (only set the TTL if the new TTL is greater than the existing TTL)
 *   - `LT` (only set the TTL if the new TTL is less than the existing TTL)
 *
 *   If `ttlMode` is not one of the above, it is treated as `undefined`.
 *   If `ttlMode` is (treated as) `undefined`, the TTL is set to `key` without any condition.
 *   See {@link formatTtlMode}.
 * @returns {Promise<boolean>} A Promise object which resolves to `true` if the TTL is set to `key`,
 *   or `false` if the TTL is not set to `key` for some reason (e.g. `key` does not exist).
 * @throws {Error} The returned Promise object resolves to an error if `key` is not a string, or `ttl` is not an integer.
 * @see {@link https://redis.io/docs/latest/commands/expire/}
 */
function setTtl(key, ttl, ttlMode) {
  return redisClient.expire(key, ttl, formatTtlMode(ttlMode))
}

/**
 * Returns a string representing a Redis TTL mode.
 *
 * The TTL mode is one of the following:
 * - NX (only set the TTL if the key has no existing TTL)
 * - XX (only set the TTL if the key already has an existing TTL)
 * - GT (only set the TTL if the new TTL is greater than the existing TTL)
 * - LT (only set the TTL if the new TTL is less than the existing TTL)
 *
 * @param {string} ttlMode - The TTL mode to format.
 * @returns {string|undefined} The formatted TTL mode, or undefined if `ttlMode` is not a string,
 *   or it is not one of the following (case-insensitive): `NX`, `XX`, `GT`, `LT`.
 */
function formatTtlMode(ttlMode) {
  if (typeof ttlMode !== 'string') {
    return undefined
  }

  ttlMode = ttlMode.toUpperCase()

  // NX -- Set expiry only when the key has no expiry
  // XX -- Set expiry only when the key has an existing expiry
  // GT -- Set expiry only when the new expiry is greater than current one
  // LT -- Set expiry only when the new expiry is less than current one
  const ttlModes = ['NX', 'XX', 'GT', 'LT']

  return ttlModes.includes(ttlMode) ? ttlMode : undefined
}

// Optimize round-trip times by combining Redis commands
// Function to create a Redis Transaction - Ordered way
// this guarantees atomicity
// It's important to note that even when a command fails, all the other commands in the queue are processed
// Redis will not stop the processing of commands.
const generateTransaction = () => {
  return redisClient.multi() // Creates and returns a new transaction
}

// Runs the transaction contaning a list of commands
const executeTransaction = (redisTransaction) => {
  return redisTransaction.exec()
}

const getClient = (redisTransaction) => (redisTransaction ? redisTransaction : redisClient)

// // Function to scan all keys in Redis
// const scanKeys = async (redisTransaction = null, matchPattern = '*', count = 100) => {
//   try {
//     const client = getClient(redisTransaction)

//     let cursor = '0'
//     let keys = []

//     do {
//       // Perform SCAN operation
//       const result = await client.scan(cursor, { MATCH: matchPattern, COUNT: count })
//       cursor = result[0]
//       keys = keys.concat(result[1])
//     } while (cursor !== '0') // Continue until the cursor is 0

//     if (keys.length === 0) {
//       // console.log(`No keys match the pattern: ${matchPattern}`)
//       return []
//     }

//     // console.log(`Fetched ${keys.length} keys matching the pattern: ${matchPattern}`)
//     return keys
//   } catch (error) {
//     logger.error('Failed to complete the SCAN operation:', error)
//     throw error
//   }
// }

// Function to scan all keys with enhanced error handling
const scanKeys = async (redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    // Perform SCAN operation
    const result = await client.scan('0', { COUNT: 100 })

    if (result.keys.length == 0) {
      logger.debug('no key')
      return
    }
    logger.debug('result.keys.length = ', result.keys.length)
    return result.keys
  } catch (error) {
    logger.error('Failed to complete the scan operation:', error)
  }
}

// Function to scan specific keys
const scanSpecificKeys = async (pattern, count = 1000, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    // Perform SCAN operation
    const result = await client.scan('0', { MATCH: pattern, COUNT: count })

    if (result.keys.length == 0) {
      // console.log(`No key exists`)
      return
    }
    console.log('result.keys:', result.keys)
    return result.keys
  } catch (error) {
    logger.error('Failed to complete the scan operation:', error)
  }
}

// Generic function to delete a key-value pair from Redis
const deleteKeyInRedis = async (key, redisTransaction = null) => {
  try {
    if (!key) {
      throw new Error('Key is required to delete data.')
    }
    const client = getClient(redisTransaction)

    const result = await client.del(key)
    if (result === 1) {
      // console.log(`Key "${key}" successfully deleted from Redis.`)
    } else {
      // console.log(`Key "${key}" not found in Redis.`)
    }

    return result
  } catch (err) {
    logger.error(`Error deleting key "${key}" from Redis:`, err)
    throw err
  }
}

// TODO (r.hidaka): Consider splitting this function into two functions: deleteKey(key) and deleteKeys(keys).
/**
 * Deletes keys in Redis.
 *
 * @param {string|Array<string>} keys - A string which represents a key to be deleted in Redis, or an array of strings which represent keys to be deleted in Redis.
 * @returns {Promise<number>} A Promise object which resolves to the number of keys deleted by this operation (non-existent keys are ignored).
 * @throws {Error} The returned Promise object resolves to an error if `keys` is not a string or an array.
 * @see {@link https://redis.io/docs/latest/commands/del/}
 */
function deleteKeys(keys) {
  // If `keys` is an empty array, del(keys) returns a Promise object which resolves to an error.
  // I prefer the returned Promise object to resolve to 0 in that case.
  if (Array.isArray(keys) && keys.length === 0) {
    return Promise.resolve(0)
  }

  return redisClient.del(keys)
}

// String

// Generic function to set a value in Redis with optional TTL
const setStringInRedis = async (key, value, redisTransaction = null, ttl) => {
  try {
    const client = getClient(redisTransaction)

    if (!key || !value) {
      throw new Error('Invalid parameters: Key and value are required.')
    }

    if (ttl) {
      // remove the set ex and try using the following
      await client.setEx(key, config.TTL, value)
    } else {
      await client.set(key, value)
    }
    // console.log(`Value set in Redis for key: "${key}"${ttl ? ` with TTL: ${config.TTL} seconds` : ''}`)
  } catch (err) {
    logger.error(`Error setting value in Redis for key "${key}":`, err)
    throw err
  }
}

// Update string in redis
const updateStringInRedis = async (key, value, redisTransaction = null, ttl) => {
  try {
    const client = getClient(redisTransaction)
    if (!key || !value) {
      throw new Error('Invalid parameters: Key and value are required.')
    }
    // Delete the existing key
    await client.del(key)

    // Set the new value with optional TTL
    if (ttl) {
      await client.setEx(key, ttl, value)
    } else {
      await client.set(key, value)
    }
  } catch (err) {
    logger.error(`Error updating string in Redis for key "${key}":`, err)
    throw err
  }
}

// Function to get a value from Redis
const getStringFromRedis = async (key, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!key) {
      // console.log('Key is required to fetch data.')
      return null
    } // Fetch data from Redis

    const fetchedString = await client.get(key)
    if (!fetchedString) {
      // console.log(`No data found in Redis for key: "${key}".`)
      return null
    } // Attempt to parse JSON, or return raw string

    // console.log(fetchedString)
    return fetchedString
  } catch (err) {
    logger.error(`Error fetching data from Redis for key "${key}":`, err)
    return null
  }
}

// JSON

// Function to set a JSON object in Redis
const setJsonInRedis = async (key, jsonObject, redisTransaction = null, ttl) => {
  try {
    const client = getClient(redisTransaction)

    if (!key || !jsonObject) {
      throw new Error('Invalid parameters: Key and JSON object are required.')
    } // Store the JSON object using RedisJSON's JSON.SET

    await client.json.set(key, '$', jsonObject) // Optionally set TTL for the key

    if (ttl) {
      await client.expire(key, config.TTL)
    } // console.log(`JSON object set in Redis for key: "${key}"${ttl ? ` with TTL: ${config.TTL} seconds` : ''}`)
  } catch (err) {
    logger.error(`Error setting JSON in Redis for key "${key}":`, err)
    throw err
  }
}

// Function to update JSON
const updateJsonInRedis = async (key, jsonObject, redisTransaction = null, ttl) => {
  try {
    const client = getClient(redisTransaction)
    if (!key || !jsonObject) {
      throw new Error('Invalid parameters: Key and JSON object are required.')
    }
    // Delete the existing key
    await client.del(key)

    // Store the JSON object using RedisJSON's JSON.SET
    await client.json.set(key, '$', jsonObject)

    // Optionally set TTL for the key
    if (ttl) {
      await client.expire(key, ttl)
    }
  } catch (err) {
    logger.error(`Error updating JSON in Redis for key "${key}":`, err)
    throw err
  }
}

/**
 * Sets a JSON object associated with `key` in Redis, and optionally sets a TTL to it.
 *
 * If `key` does not exist, or it exists and the data associated with it is a JSON,
 * `key` is associated with a new JSON object represented by `jsonObj`.
 *
 * If `ttl` is given as an integer, a TTL represented by it is set to `key` with a mode represented by `ttlMode`.
 * If `key` already has a TTL and `ttl` is not an integer, the existing TTL is not changed.
 *
 * @param {string} key - The key associated with the JSON object to set.
 * @param {Object} jsonObj - An object to set with `key`.
 *
 * // TODO (r.hidaka): Technically, even if `jsonObj` is an empty object, null, a string, a number or an array, this function can store it in Redis with no errors.
 * //                  Consider throwing an error if `jsonObj` is not a non-empty object to be consistent with {@link setHash} and {@link overwriteHash}.
 *
 * @param {number} [ttl] - An optional integer specifying the TTL in seconds for the key.
 * @param {string} [ttlMode] - An optional string specifying the mode for the TTL.
 *   If `ttl` is not specified as an integer, `ttlMode` is ignored.
 *   If specified, `ttlMode` is expected to be one of the following (case-insensitive):
 *   - `NX` (only set the TTL if the key has no existing TTL)
 *   - `XX` (only set the TTL if the key already has an existing TTL)
 *   - `GT` (only set the TTL if the new TTL is greater than the existing TTL)
 *   - `LT` (only set the TTL if the new TTL is less than the existing TTL)
 *
 *   If `ttlMode` is not one of the above, it is treated as `undefined`.
 *   If `ttlMode` is (treated as) `undefined`, the TTL is set to `key` without any condition.
 *   See {@link formatTtlMode}.
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 1 if `ttl` is not an integer, or 2 if `ttl` is an integer.
 *   - The first element of the array is a string 'OK'.
 *   - The second element, if applicable, is `true` if a TTL represented by `ttl` was set to `key` with a mode represented by `ttlMode`,
 *     or `false` if the TTL was not set to `key` for some reason (e.g. `key` already had an existing TTL and `ttlMode` was `NX`).
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - `key` is not a string.
 *   - `key` exists but the data associated with `key` is not a JSON.
 * @see {@link https://redis.io/docs/latest/commands/multi/},
 *      {@link https://redis.io/docs/latest/commands/json/set/},
 *      {@link https://redis.io/docs/latest/commands/expire/},
 *      {@link https://redis.io/docs/latest/commands/exec/}
 */
function setJsonWithTtlMode(key, jsonObj, ttl, ttlMode) {
  // TODO (r.hidaka): VALIDATION: `key` should be a non-empty string

  const multi = redisClient.multi()

  multi.json.set(key, '$', jsonObj)

  if (Number.isInteger(ttl)) {
    multi.expire(key, ttl, formatTtlMode(ttlMode))
  }

  return multi.exec()
}

/**
 * Sets multiple JSON objects associated with keys in Redis, and optionally sets a TTL to them.
 *
 * If some of the keys do not exist, or they exist and the data associated with them are a JSON,
 * the keys are associated with new JSON objects in `keysToJsonsObj`.
 *
 * If `ttl` is given as an integer, a TTL represented by it is set to the keys with a mode represented by `ttlMode`.
 * If some of the keys already have TTLs and `ttl` is not an integer, the existing TTLs are not changed.
 *
 * @param {Object.<string, Object>} keysToJsonsObj - An object containing the keys and JSON objects to set in Redis.
 *   It is expected to be in the following format:
 *   ```
 *   {
 *     key_1: jsonObj_1,
 *     key_2: jsonObj_2,
 *     ...,
 *     key_N: jsonObj_N
 *   }
 *   ```
 * // TODO (r.hidaka): Technically, even if `jsonObj_i` (i = 1, ..., N) is an empty object, null, a string, a number or an array, this function can store it in Redis with no errors.
 * //                  Consider throwing an error if they are not a non-empty object to be consistent with {@link setHash} and {@link overwriteHash}.
 *
 * @param {number} [ttl] - An optional integer specifying the TTL in seconds for all the keys.
 * @param {string} [ttlMode] - An optional string specifying the mode for the TTL.
 *   If `ttl` is not specified as an integer, `ttlMode` is ignored.
 *   If specified, `ttlMode` is expected to be one of the following (case-insensitive):
 *   - `NX` (only set the TTL if the key has no existing TTL)
 *   - `XX` (only set the TTL if the key already has an existing TTL)
 *   - `GT` (only set the TTL if the new TTL is greater than the existing TTL)
 *   - `LT` (only set the TTL if the new TTL is less than the existing TTL)
 *
 *   If `ttlMode` is not one of the above, it is treated as `undefined`.
 *   If `ttlMode` is (treated as) `undefined`, the TTL is set to all the keys without any condition.
 *   See {@link formatTtlMode}.
 * @returns {Promise<Array<string|boolean>>} A Promise object which resolves to an array whose length is 1 if `ttl` is not an integer,
 *   or N+1 if `ttl` is an integer, where N is the number of the keys.
 *   - The first element of the array is a string 'OK'.
 *   - The i+1-th element (`1 <= i <= N`), if applicable, is `true` if a TTL represented by `ttl` was set to `key_i` with a mode represented by `ttlMode`,
 *     or `false` if the TTL was not set to `key_i` for some reason (e.g. `key_i` already had an existing TTL and `ttlMode` was `NX`).
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - Some of the keys are not a string.
 *   - Some of the keys exist but the data associated with them are not a JSON.
 *   - `keysToJsonsObj` is not an object or is empty (`{}`).
 * @see {@link https://redis.io/docs/latest/commands/multi/},
 *      {@link https://redis.io/docs/latest/commands/json.mset/},
 *      {@link https://redis.io/docs/latest/commands/expire/},
 *      {@link https://redis.io/docs/latest/commands/exec/}
 */
function setJsonsWithTtlMode(keysToJsonsObj, ttl, ttlMode) {
  const multi = redisClient.multi()

  const items = Object.entries(keysToJsonsObj).map(([key, value]) => ({
    key,
    value,
    path: '$',
  }))

  multi.json.mSet(items)

  if (Number.isInteger(ttl)) {
    const formattedTtlMode = formatTtlMode(ttlMode)
    Object.keys(keysToJsonsObj).forEach((key) => multi.expire(key, ttl, formattedTtlMode))
  }

  return multi.exec()
}

// Function to get a JSON object from Redis
const getJsonFromRedis = async (key, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const jsonObject = await client.json.get(key, '$') // Retrieve entire JSON object

    if (!jsonObject) {
      // console.log(`No JSON object found in Redis for key: "${key}".`)
      return null
    }

    return jsonObject
  } catch (err) {
    logger.error(`Error retrieving JSON object from Redis for key "${key}":`, err)
    throw err
  }
}

/**
 * Retrieves JSON objects associated with `keys` from Redis.
 *
 * @param {Array<string>} keys - The keys associated with the JSON objects to retrieve.
 * @returns {Promise<Array<Object|null>|null>} A Promise object which resolves to an array (let's call it `values`) whose length is the same as that of `keys`.
 *   So if `keys` is empty (`[]`), `values` is also empty.
 *   If `keys` is not empty, for each `0 <= i < keys.length`, `values[i]` is:
 *   - A JSON object associated with `keys[i]`.
 *   - `null` if `keys[i]` does not exist, or it exists but the data associated with it is not a JSON.
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - `keys` is not an array.
 *   - `keys` is an array which has a non-string element.
 * @see {@link https://redis.io/docs/latest/commands/json.mget/}
 */
function getJsons(keys) {
  // TODO (r.hidaka): VALIDATION: `keys` should be an array of non-empty strings

  if (keys.length === 0) {
    return Promise.resolve([])
  }
  return redisClient.json.mGet(keys, '$').then((rawJsons) => rawJsons.flat())
}

// Function to retrieve a specific field from a JSON object
const getJsonFieldFromRedis = async (key, path, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const value = await client.json.get(key, path) // Retrieve value at a specific path
    if (value === null) {
      // console.log(`No data found at path "${path}" for key "${key}".`)
      return null
    } // console.log(`Retrieved value from JSON object for key "${key}" at path "${path}":`, value)

    return value
  } catch (err) {
    logger.error(`Error retrieving JSON field for key "${key}" at path "${path}":`, err)
    throw err
  }
}

// Function to update a specific field in a JSON object
const updateJsonFieldInRedis = async (key, path, value, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!key || !path) {
      throw new Error('Invalid parameters: Key and JSON path are required.')
    } // Use JSON.SET with a path to update a specific field

    await client.json.set(key, path, value)
    // console.log(`Updated field "${path}" in JSON object for key "${key}" with value:`, value)
  } catch (err) {
    logger.error(`Error updating JSON field for key "${key}" at path "${path}":`, err)
    throw err
  }
}

// HASHES

/**
 * Function to set a hash in Redis using the object syntax.
 *
 * @param {string} key - The Redis key for the hash.
 * @param {Object} hashObject - An object containing the fields and values to set in the hash.
 * @returns {Promise<void>}
 */
const setHashInRedis = async (key, hashObject, redisTransaction = null, ttl) => {
  try {
    const client = getClient(redisTransaction)

    if (!key || !hashObject || typeof hashObject !== 'object') {
      throw new Error('Invalid parameters: Key and hash object are required.')
    } // Handle potential invalid values

    const sanitizedObject = Object.fromEntries(
      Object.entries(hashObject).map(([field, value]) => [
        field,
        value === undefined || value === null
          ? '' // Replace undefined or null with an empty string
          : Array.isArray(value)
          ? JSON.stringify(value) // Convert arrays to JSON strings
          : value, // Use the value as is for other types
      ])
    )

    await client.hSet(key, sanitizedObject)
    // console.log(`Hash set in Redis for key "${key}" with fields:`, sanitizedObject)
  } catch (err) {
    logger.error(`Error setting hash in Redis for key "${key}":`, err)
    throw err
  }
}

// Function to update Hash
const updateHashInRedis = async (key, hashObject, redisTransaction = null, ttl) => {
  try {
    const client = getClient(redisTransaction)
    if (!key || !hashObject || typeof hashObject !== 'object') {
      throw new Error('Invalid parameters: Key and hash object are required.')
    }
    // Delete the existing hash
    await client.del(key)

    // Sanitize the hash: replace undefined/null with an empty string, and stringify arrays.
    const sanitizedObject = Object.fromEntries(
      Object.entries(hashObject).map(([field, value]) => [
        field,
        value === undefined || value === null ? '' : Array.isArray(value) ? JSON.stringify(value) : value,
      ])
    )

    // Set the new hash
    await client.hSet(key, sanitizedObject)

    // Optionally set TTL on the key
    if (ttl) {
      await client.expire(key, ttl)
    }
  } catch (err) {
    logger.error(`Error updating hash in Redis for key "${key}":`, err)
    throw err
  }
}

/**
 * Sets a hash associated with `key` in Redis, and optionally sets a TTL to it.
 *
 * If `key` does not exist, a new hash associated with `key` is created.
 * If `key` already exists and is associated with a hash, for each field in `hashObj`:
 * - If the field does not exist in the hash, the field is newly added to the hash with its value.
 * - If the field already exists in the hash, the field is updated with its value.
 *
 * @param {string} key - The key associated with the hash to set.
 * @param {Object.<string, string>} hashObj - An object containing the fields and values to set in the hash.
 *   It is expected to be in the following format:
 *   ```
 *   {
 *     field_1: 'value_1',
 *     field_2: 'value_2',
 *     ...,
 *     field_N: 'value_N'
 *   }
 *   ```
 * @param {number} [ttl] - An optional integer specifying the TTL in seconds for the key.
 * @param {string} [ttlMode] - An optional string specifying the mode for the TTL.
 *   If `ttl` is not specified as an integer, `ttlMode` is ignored.
 *   If specified, `ttlMode` is expected to be one of the following (case-insensitive):
 *   - `NX` (only set the TTL if the key has no existing TTL)
 *   - `XX` (only set the TTL if the key already has an existing TTL)
 *   - `GT` (only set the TTL if the new TTL is greater than the existing TTL)
 *   - `LT` (only set the TTL if the new TTL is less than the existing TTL)
 *
 *   If `ttlMode` is not one of the above, it is treated as `undefined`.
 *   If `ttlMode` is (treated as) `undefined`, the TTL is set to `key` without any condition.
 *   See {@link formatTtlMode}.
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 1 if `ttl` is not an integer, or 2 if `ttl` is an integer.
 *   - The first element of the array is a number of fields which were newly added to the hash.
 *   - The second element, if applicable, is `true` if a TTL represented by `ttl` was set to `key` with a mode represented by `ttlMode`,
 *     or `false` if the TTL was not set to `key` for some reason (e.g. `key` already had an existing TTL and `ttlMode` was `NX`).
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - `key` is not a string.
 *   - `key` exists but the data associated with `key` is not a hash.
 *   - `hashObj` is not an object or is empty ({}).
 * @see {@link https://redis.io/docs/latest/commands/multi/},
 *      {@link https://redis.io/docs/latest/commands/hset/},
 *      {@link https://redis.io/docs/latest/commands/expire/},
 *      {@link https://redis.io/docs/latest/commands/exec/}
 */
function setHashWithTtlMode(key, hashObj, ttl, ttlMode) {
  // TODO (r.hidaka): VALIDATION: `key` should be a non-empty string
  // TODO (r.hidaka): VALIDATION: `hashObj` should be a non-empty object whose values are strings

  const multi = redisClient.multi()

  multi.hSet(key, hashObj)

  if (Number.isInteger(ttl)) {
    multi.expire(key, ttl, formatTtlMode(ttlMode))
  }

  return multi.exec()
}

/**
 * Sets multiple hashes in Redis, each associated with a key, and optionally sets a TTL for each key.
 *
 * @param {Object.<string, Object.<string, string>>} keysToHashesObj - An object containing keys and corresponding hash objects to set in Redis.
 *   It is expected to be in the following format:
 *   ```
 *   {
 *     key_1: hashObj_1,
 *     key_2: hashObj_2,
 *     ...,
 *     key_N: hashObj_N
 *   }
 *   ```
 *   For each `1 <= i <= N`, if `key_i` does not exist in Redis, a new hash associated with the key is created
 *   and all fields in `hashObj_i` are added to the hash with their values.
 *   If `key_i` already exists and is associated with a hash, for each field in `hashObj_i`,:
 *   - If the field does not exist in the hash, the field is newly added to the hash with its value.
 *   - If the field already exists in the hash, the field is updated with its value.
 * @param {number} [ttl] - An optional integer specifying the TTL in seconds for the keys.
 * @param {string} [ttlMode] - An optional string specifying the mode for the TTL.
 *   If `ttl` is not specified as an integer, `ttlMode` is ignored.
 *   If specified, `ttlMode` is expected to be one of the following (case-insensitive):
 *   - `NX` (only set the TTL if the key has no existing TTL)
 *   - `XX` (only set the TTL if the key already has an existing TTL)
 *   - `GT` (only set the TTL if the new TTL is greater than the existing TTL)
 *   - `LT` (only set the TTL if the new TTL is less than the existing TTL)
 *
 *   If `ttlMode` is not one of the above, it is treated as `undefined`.
 *   If `ttlMode` is (treated as) `undefined`, the TTL is set to all the keys without any condition.
 *   See {@link formatTtlMode}.
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 0, or `N` where `N` is the size of `keysToHashesObj` if `ttl` is not an integer,
 *   or `2N` if `ttl` is an integer.
 *   - The length of the array is 0 if and only if `keysToHashesObj` is empty (`{}`).
 *   - The i-th element (`1 <= i <= N`) of the array is a number of fields which were newly added to the hash associated with `key_i`.
 *   - The i+N-th element (`1 <= i <= N`), if applicable, is `true` if a TTL represented by `ttl` was set to `key_i` with a mode represented by `ttlMode`,
 *     or `false` if the TTL was not set to `key_i` for some reason (e.g. `key_i` already had an existing TTL and `ttlMode` was `NX`).
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - Some of the keys in `keysToHashesObj` are not strings.
 *   - Some of the keys in `keysToHashesObj` exist but the data associated with them are not hashes.
 *   - Some of the values in `keysToHashesObj` are not objects or are empty (`{}`).
 * @see {@link https://redis.io/docs/latest/commands/multi/},
 *      {@link https://redis.io/docs/latest/commands/hset/},
 *      {@link https://redis.io/docs/latest/commands/expire/},
 *      {@link https://redis.io/docs/latest/commands/exec/}
 */
function setHashesWithTtlMode(keysToHashesObj, ttl, ttlMode) {
  // TODO (r.hidaka): VALIDATION: Check the format of `keysToHashesObj`

  const multi = redisClient.multi()

  Object.entries(keysToHashesObj).forEach(([key, hash]) => multi.hSet(key, hash))

  if (Number.isInteger(ttl)) {
    const formattedTtlMode = formatTtlMode(ttlMode)
    Object.keys(keysToHashesObj).forEach((key) => multi.expire(key, ttl, formattedTtlMode))
  }

  return multi.exec()
}

// Function to get an entire hash from Redis
const getHashFromRedis = async (key, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const hash = await client.hGetAll(key) // Retrieve all fields in the hash
    if (Object.keys(hash).length === 0) {
      // console.log(`No hash found in Redis for key "${key}".`)
      return null
    }

    //console.log(`Retrieved hash for key "${key}" -> `, hash)
    return hash
  } catch (err) {
    logger.error(`Error retrieving hash from Redis for key "${key}":`, err)
    throw err
  }
}

// Function to get a specific field from a hash
const getHashFieldFromRedis = async (key, field, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const value = await client.hGet(key, field) // Retrieve a specific field
    if (value === null) {
      // console.log(`Field "${field}" not found in hash for key "${key}".`)
      return null
    }

    // console.log(`Retrieved value for field "${field}" in hash for key "${key}":`, value)
    return value
  } catch (err) {
    logger.error(`Error retrieving field "${field}" from hash for key "${key}":`, err)
    throw err
  }
}

/**
 * Retrieves values elements of `fields` hold in the hash associated with `key` from Redis.
 *
 * @param {string} key - The key associated with the hash to retrieve values from.
 * @param {Array<string>} fields - An array of the fields whose values to retrieve.
 * @returns {Promise<Array<string|null>>} A Promise object which resolves to an array (let's call it `values`) whose length is the same as that of `fields`.
 *   So if `fields` is empty (`[]`), `values` is also empty.
 *   If `fields` is not empty, for each `0 <= i < fields.length`, `values[i]` is:
 *   - A string `fields[i]` holds in the hash associated with `key`.
 *   - `null` if `fields[i]` is not present in the hash associated with `key`, or `key` does not exist.
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - `fields` is not empty and `key` is not a string.
 *   - `fields` is not empty, and `key` exists but the data associated with it is not a hash.
 * @see {@link https://redis.io/docs/latest/commands/hmget/}
 */
function getHashValues(key, fields) {
  // TODO (r.hidaka): VALIDATION: `key` should be a non-empty string
  // TODO (r.hidaka): VALIDATION: `fields` should be an array of non-empty strings

  // If `fields` is an empty array, hmGet(key, fields) returns a Promise object which resolves to an error.
  // I prefer the returned Promise object to resolve to an empty array in that case.
  if (fields.length === 0) {
    return Promise.resolve([])
  }
  return redisClient.hmGet(key, fields)
}

/**
 * Retrieves all values in the hash associated with `key` from Redis.
 *
 * @param {string} key - The key associated with the hash to retrieve values from.
 * @returns {Promise<Array<string>>} A Promise object which resolves to:
 *   - An array consisting of all values in the hash associated with `key`.
 *   - An empty array (`[]`) if `key` does not exist.
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - `key` is not a string.
 *   - `key` exists but the data associated with it is not a hash.
 * @see {@link https://redis.io/docs/latest/commands/hvals/}
 */
function getAllHashValues(key) {
  // TODO (r.hidaka): VALIDATION: `key` should be a non-empty string

  return redisClient.hVals(key)
}

/**
 * Retrieves all fields in the hash associated with `key` from Redis.
 *
 * @param {string} key - The key associated with the hash to retrieve fields from.
 * @returns {Promise<Array<string>>} A Promise object which resolves to an array of all fields in the hash associated with `key`.
 *   If `key` does not exist, the returned Promise object resolves to an empty array (`[]`).
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - `key` is not a string.
 *   - `key` exists but the data associated with it is not a hash.
 * @see {@link https://redis.io/docs/latest/commands/hkeys/}
 */
function getAllHashFields(key) {
  // TODO (r.hidaka): VALIDATION: `key` should be a non-empty string

  return redisClient.hKeys(key)
}

/**
 * Retrieves the entire hashes associated with each key in `keys` from Redis.
 *
 * @param {Array<string>} keys - An array of keys associated with the hashes to retrieve.
 * @returns {Promise<Array<Object.<string, string>|null>>} A Promise object which resolves to an array (let's call it `hashes`) whose length is the same as that of `keys`.
 *   So if `keys` is empty (`[]`), `hashes` is also empty.
 *   If `keys` is not empty, for each `0 <= i < keys.length`, `hashes[i]` is:
 *   - A hash associated with `keys[i]`.
 *   - `null` if `keys[i]` does not exist.
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - `keys` is not an array.
 *   - `keys` is an array which has a non-string element.
 *   - A key in `keys` exists but the data associated with it is not a hash.
 * @see {@link https://redis.io/docs/latest/commands/multi/},
 *      {@link https://redis.io/docs/latest/commands/hgetall/},
 *      {@link https://redis.io/docs/latest/commands/exec/}
 */
function getHashes(keys) {
  // TODO (r.hidaka): VALIDATION: `keys` should be an array of non-empty strings

  if (keys.length === 0) {
    return Promise.resolve([])
  }

  const multi = redisClient.multi()

  keys.forEach((key) => multi.hGetAll(key))

  return multi.exec().then((hashes) => hashes.map((hash) => (Object.keys(hash).length > 0 ? hash : null)))
}

// Function to check if a field exists in a hash
const hashFieldExists = async (key, field, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const exists = await client.hExists(key, field) // Check if a field exists
    // console.log(`Field "${field}" ${exists ? 'exists' : 'does not exist'} in hash for key "${key}".`)
    return exists
  } catch (err) {
    logger.error(`Error checking existence of field "${field}" in hash for key "${key}":`, err)
    throw err
  }
}

// Function to delete fields from a hash
const deleteHashFieldsFromRedis = async (key, fields, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error('Fields must be an array with at least one element.')
    } // Use HDEL to delete specified fields

    const deletedCount = await client.hDel(key, fields)

    // console.log(`Deleted ${deletedCount} field(s) from hash for key "${key}". Fields: ${fields}`)
    return deletedCount
  } catch (err) {
    logger.error(`Error deleting fields from hash for key "${key}":`, err)
    throw err
  }
}

/**
 * Removes any data associated with `key` from Redis if it exists, and then creates a new hash associated with `key`.
 * Optionally sets a TTL to `key`.
 *
 * @param {string} key - The key associated with the hash to set.
 * @param {Object.<string, string>} hashObj - An object containing the fields and values to set in the hash.
 *   It is expected to be in the following format:
 *   ```
 *   {
 *     field_1: 'value_1',
 *     field_2: 'value_2',
 *     ...,
 *     field_N: 'value_N'
 *   }
 *   ```
 * @param {number} [ttl] - An optional integer specifying the TTL in seconds for the key.
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 2 if `ttl` is not an integer, or 3 if `ttl` is an integer.
 *   - The first element of the array is `1` if `key` existed and was removed, or `0` if `key` did not exist.
 *   - The second element is a number of fields which were newly added to the hash.
 *   - The third element, if applicable, is `true` if a TTL represented by `ttl` was set to `key`,
 *     or `false` if the TTL was not set to `key` for some reason.
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - `key` is not a string.
 *   - `hashObj` is not an object or is empty (`{}`).
 * @see {@link https://redis.io/docs/latest/commands/multi/},
 *      {@link https://redis.io/docs/latest/commands/del/},
 *      {@link https://redis.io/docs/latest/commands/hset/},
 *      {@link https://redis.io/docs/latest/commands/expire/},
 *      {@link https://redis.io/docs/latest/commands/exec/}
 */
function overwriteHash(key, hashObj, ttl) {
  // TODO (r.hidaka): VALIDATION: `key` should be a non-empty string
  // TODO (r.hidaka): VALIDATION: `hashObj` should be a non-empty object whose values are non-empty strings

  const multi = redisClient.multi()

  multi.del(key)

  multi.hSet(key, hashObj)

  if (Number.isInteger(ttl)) {
    multi.expire(key, ttl)
  }

  return multi.exec()
}

/**
 * Removes any data associated with the given keys from Redis if they exist,
 * and then creates new hashes associated with the keys.
 * Optionally sets a TTL to each key.
 *
 * @param {Object.<string, Object.<string, string>>} keysToHashesObj - An object containing keys and corresponding hash objects to set in Redis.
 *   It is expected to be in the following format:
 *   ```
 *   {
 *     key_1: hashObj_1,
 *     key_2: hashObj_2,
 *     ...,
 *     key_N: hashObj_N
 *   }
 *   ```
 * @param {number} [ttl] - An optional integer specifying the TTL in seconds for the keys.
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 0, or `N+1` where `N` is the size of `keysToHashesObj` if `ttl` is not an integer,
 *   or `2N+1` if `ttl` is an integer.
 *   - The length of the array is 0 if and only if `keysToHashesObj` is empty (`{}`).
 *   - The first element of the array is the number of the keys that were removed from Redis.
 *   - The i+1-th element (`1 <= i <= N`) of the array is a number of fields which were newly added to the hash associated with `key_i`.
 *   - The i+N+1-th element (`1 <= i <= N`), if applicable, is `true` if a TTL represented by `ttl` was set to `key_i`,
 *     or `false` if the TTL was not set to `key_i` for some reason.
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - Some of the keys in `keysToHashesObj` are not strings.
 *   - Some of the values in `keysToHashesObj` are not objects or are empty.
 * @see {@link https://redis.io/docs/latest/commands/multi/},
 *      {@link https://redis.io/docs/latest/commands/del/},
 *      {@link https://redis.io/docs/latest/commands/hset/},
 *      {@link https://redis.io/docs/latest/commands/expire/},
 *      {@link https://redis.io/docs/latest/commands/exec/}
 */
function overwriteHashes(keysToHashesObj, ttl) {
  // TODO (r.hidaka): VALIDATION: Check the format of `keysToHashesObj`

  const multi = redisClient.multi()

  const keys = Object.keys(keysToHashesObj)

  if (keys.length > 0) {
    multi.del(keys)
  }

  Object.entries(keysToHashesObj).forEach(([key, hash]) => multi.hSet(key, hash))

  if (Number.isInteger(ttl)) {
    keys.forEach((key) => multi.expire(key, ttl))
  }

  return multi.exec()
}

// SETS

// Function to add members to a Redis set
const addToSetInRedis = async (key, member, redisTransaction = null, ttl) => {
  try {
    const client = getClient(redisTransaction)

    const addedCount = await client.sAdd(key, member)
    // console.log(`Added ${addedCount} member(s) to set "${key}":`, members)
    return addedCount
  } catch (err) {
    logger.error(`Error adding members to set "${key}":`, err)
    throw err
  }
}

const updateSetInRedis = async (key, member, redisTransaction = null, ttl) => {
  try {
    const client = getClient(redisTransaction)

    // Delete the existing set
    client.del(key)

    // Add new members to the set
    if (member.length > 0) {
      client.sAdd(key, member)
    }

    // Optionally, set a TTL on the key
    if (ttl) {
      client.expire(key, ttl)
    }
  } catch (err) {
    logger.error(`Error updating set "${key}" in Redis:`, err)
    throw err
  }
}

// Function to retrieve all members of a Redis set
const getSetMembers = async (key, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const members = await client.sMembers(key) // Retrieve all members of the set
    if (members.length === 0) {
      // console.log(`No members found in set "${key}".`)
      return []
    }

    return members
  } catch (err) {
    logger.error(`Error retrieving members of set "${key}":`, err)
    throw err
  }
}

// Function to check if a value is a member of a Redis set
const isMemberOfSet = async (key, member, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const isMember = await client.sIsMember(key, member) // Check if the value is a member
    return isMember
  } catch (err) {
    logger.error(`Error checking membership of value "${member}" in set "${key}":`, err)
    throw err
  }
}

// Function to remove members from a Redis set
const removeFromSet = async (key, members, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!Array.isArray(members) || members.length === 0) {
      throw new Error('Members must be an array with at least one element.')
    } // Use SREM to remove members from the set

    const removedCount = await client.sRem(key, members)
    // console.log(`Removed ${removedCount} member(s) from set "${key}":`, members)
    return removedCount
  } catch (err) {
    logger.error(`Error removing members from set "${key}":`, err)
    throw err
  }
}

// Function to get the union of multiple sets
const unionOfSets = async (keys, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!Array.isArray(keys) || keys.length < 2) {
      throw new Error('At least two set keys are required for union operation.')
    }

    const union = await client.sUnion(keys)
    // console.log(`Union of sets ${keys}:`, union)
    return union
  } catch (err) {
    logger.error(`Error performing union operation on sets ${keys}:`, err)
    throw err
  }
}

// Function to get the intersection of multiple sets
const intersectionOfSets = async (keys, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!Array.isArray(keys) || keys.length < 2) {
      throw new Error('At least two set keys are required for intersection operation.')
    }

    const intersection = await client.sInter(keys)
    // console.log(`Intersection of sets ${keys}:`, intersection)
    return intersection
  } catch (err) {
    logger.error(`Error performing intersection operation on sets ${keys}:`, err)
    throw err
  }
}

// Function to get the cardinality (size) of a Redis set
const getSetSize = async (key, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const size = await client.sCard(key) // Get the number of members in the set
    // console.log(`Set "${key}" contains ${size} member(s).`)
    return size
  } catch (err) {
    logger.error(`Error getting size of set "${key}":`, err)
    throw err
  }
}

// SORTED SETS

// Adds multiple members to a Redis sorted set.
const addToSortedSetInRedis = async (
  key,
  members,
  redisTransaction = null,
  ttl,
  scoreGenerator = (currentIndex) => currentIndex + 1
) => {
  try {
    const client = getClient(redisTransaction)

    // Convert members to an array if it's a Set.
    const memberArray = members instanceof Set ? Array.from(members) : members

    // Get the current size to determine the base score.
    const currentSize = await client.zCard(key)

    // Build the elements with scores and values.
    const elements = memberArray.map((member, index) => ({
      score: scoreGenerator(currentSize + index),
      value: member,
    }))

    // Add the elements to the sorted set.
    const addedCount = await client.zAdd(key, elements)

    // Set TTL on the key if provided.
    if (ttl) {
      await client.expire(key, ttl)
    }

    return addedCount
  } catch (err) {
    logger.error(`Error adding file IDs to sorted set "${key}":`, err)
    throw err
  }
}

// Function to update a sorted set
const updateSortedSetInRedis = async (
  key,
  members,
  redisTransaction = null,
  ttl,
  scoreGenerator = (currentIndex) => currentIndex + 1
) => {
  try {
    const client = getClient(redisTransaction)
    // Delete the existing sorted set
    await client.del(key)

    // Convert members to an array if it's a Set.
    const memberArray = members instanceof Set ? Array.from(members) : members

    // Build the elements with scores and values.
    // For update, we start scores from 1 (or adjust scoreGenerator as needed).
    const elements = memberArray.map((member, index) => ({
      score: scoreGenerator(index),
      value: member,
    }))

    // Add the new elements to the sorted set.
    const addedCount = await client.zAdd(key, elements)

    // Set TTL on the key if provided.
    if (ttl) {
      await client.expire(key, ttl)
    }

    return addedCount
  } catch (err) {
    logger.error(`Error updating sorted set in Redis for key "${key}":`, err)
    throw err
  }
}

// Function to retrieve members of a Redis sorted set
const getSortedSetMembers = async (key, startCount = 1, endCount = -1, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const members = await client.zRange(key, startCount, endCount, { BY: 'SCORE' })
    if (members.length === 0) {
      return []
    }
    // console.log('members = ', members)
    return members
  } catch (err) {
    logger.error(`Error retrieving members of sorted set "${key}":`, err)
    throw err
  }
}

// Function to check if a value is a member of a Redis sorted set
const isMemberOfSortedSet = async (key, member, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const score = await client.zScore(key, member)
    return score !== null
  } catch (err) {
    logger.error(`Error checking membership of value "${member}" in sorted set "${key}":`, err)
    throw err
  }
}

// Function to remove members from a Redis sorted set
const removeFromSortedSet = async (key, members, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!Array.isArray(members) || members.length === 0) {
      throw new Error('Members must be an array with at least one element.')
    }

    const removedCount = await client.zRem(key, members)
    return removedCount
  } catch (err) {
    logger.error(`Error removing members from sorted set "${key}":`, err)
    throw err
  }
}

// Function to get the union of multiple sorted sets
// destinationKey: The key where the union result will be stored.
const unionOfSortedSets = async (keys, destinationKey, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!Array.isArray(keys) || keys.length < 2) {
      throw new Error('At least two sorted set keys are required for union operation.')
    }

    // ZUNIONSTORE stores the union of the given sorted sets into destinationKey.
    await client.zUnionStore(destinationKey, keys.length, keys)

    // Retrieve the union result.
    const unionMembers = await client.zRange(destinationKey, 0, -1)

    // (Optional) If you don’t want to keep the temporary destination key,
    // you can delete it afterwards:
    // await client.del(destinationKey);

    return unionMembers
  } catch (err) {
    logger.error(`Error performing union operation on sorted sets ${keys}:`, err)
    throw err
  }
}

// Function to get the intersection of multiple sorted sets
// destinationKey: The key where the intersection result will be stored.
const intersectionOfSortedSets = async (keys, destinationKey, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!Array.isArray(keys) || keys.length < 2) {
      throw new Error('At least two sorted set keys are required for intersection operation.')
    }

    // ZINTERSTORE stores the intersection of the given sorted sets into destinationKey.
    await client.zInterStore(destinationKey, keys.length, keys)

    // Retrieve the intersection result.
    const intersectionMembers = await client.zRange(destinationKey, 0, -1)

    // (Optional) Clean up the temporary key if desired:
    // await client.del(destinationKey);

    return intersectionMembers
  } catch (err) {
    logger.error(`Error performing intersection operation on sorted sets ${keys}:`, err)
    throw err
  }
}

// Function to get the cardinality (size) of a Redis sorted set
const getSortedSetSize = async (key, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)
    // zCard returns the number of elements in the sorted set.
    const size = await client.zCard(key)
    return size
  } catch (err) {
    logger.error(`Error getting size of sorted set "${key}":`, err)
    throw err
  }
}

//---------------------------------------------------------------------------------------------------------------

module.exports = {
  scanKeys,
  scanSpecificKeys,
  deleteKeyInRedis,
  deleteKeys, //migrated from cacheService
  generateTransaction,
  executeTransaction,
  getTtl, //migrated from cacheService
  setTtl, //migrated from cacheService

  //String
  getStringFromRedis,
  setStringInRedis,
  updateStringInRedis,

  //JSON
  setJsonInRedis,
  getJsonFromRedis, //replaced getJson from cacheService
  getJsonFieldFromRedis,
  updateJsonFieldInRedis,
  updateJsonInRedis,
  getJsons, //migrated from cacheService
  setJsonWithTtlMode, //migrated from cacheService(formerly setJson)
  setJsonsWithTtlMode, //migrated from cacheService(formerly setJsons)

  //Hashes
  setHashInRedis,
  getHashFromRedis, //replaced getHash from cacheService
  getHashFieldFromRedis, //replaced getHashValue from cacheService
  updateHashInRedis,
  hashFieldExists,
  deleteHashFieldsFromRedis,
  getHashValues, //migrated from cacheService
  setHashWithTtlMode, //migrated from cacheService(formerly setHash)
  setHashesWithTtlMode, //migrated from cacheService(formerly setHashes)
  overwriteHash, //migrated from cacheService
  overwriteHashes, //migrated from cacheService
  getAllHashFields, //migrated from cacheService
  getAllHashValues, //migrated from cacheService
  getHashes, //migrated from cacheService

  //Set
  addToSetInRedis,
  updateSetInRedis,
  getSetMembers,
  isMemberOfSet,
  removeFromSet,
  unionOfSets,
  intersectionOfSets,
  getSetSize,

  // Sorted Set
  addToSortedSetInRedis,
  updateSortedSetInRedis,
  getSortedSetMembers,
  isMemberOfSortedSet,
  removeFromSortedSet,
  unionOfSortedSets,
  intersectionOfSortedSets,
  getSortedSetSize,
}
