const redisClient = require('../config/redis.js')
const logger = require('../logger/logger.js')(__filename)

/**
 * Retrieves the entire hash associated with `key` from Redis.
 *
 * @param {string} key - The key associated with the hash to retrieve.
 * @returns {Promise<Object.<string, string>|null>} A Promise object which resolves to the hash associated with `key`.
 *   The hash is an object in the following format:
 * 
 *   {
 *     field_1: 'value_1',
 *     field_2: 'value_2',
 *     ...,
 *     field_N: 'value_N'
 *   }
 * 
 *   If `key` does not exist, the returned Promise object resolves to null.
 * @throws {Error} - The returned Promise object resolves to an error if:
 *   - `key` is not a string.
 *   - `key` exists but the data associated with it is not a hash.
 * @see {@link https://redis.io/docs/latest/commands/hgetall/}
 */
function getHash(key) {
  // If `key` does not exist, hGetAll(key) returns a Promise object which resolves to an empty object ({}).
  // I prefer the returned Promise object to resolve to null in that case.
  return redisClient.hGetAll(key).then(hash => Object.keys(hash).length > 0 ? hash : null)
}

/**
 * Retrieves all fields in the hash associated with `key` from Redis.
 *
 * @param {string} key - The key associated with the hash to retrieve fields from.
 * @returns {Promise<Array<string>>} A Promise object which resolves to an array of all fields in the hash associated with `key`.
 *   If `key` does not exist, the returned Promise object resolves to an empty array ([]).
 * @throws {Error} - The returned Promise object resolves to an error if:
 *   - `key` is not a string.
 *   - `key` exists but the data associated with it is not a hash.
 * @see {@link https://redis.io/docs/latest/commands/hkeys/}
 */
function getAllHashFields(key) {
  return redisClient.hKeys(key)
}

// TODO (r.hidaka): Consider splitting this function into 3 (getSingleHashValue(key, field), getHashValues(key, fields), and getAllHashValues(key)).
/**
 * Retrieves values from a hash associated with `key` from Redis.
 *
 * @param {string} key - The key associated with the hash to retrieve values from.
 * @param {Array<string>|string} [fields] - An optional parameter specifying what values to retrieve from the hash.
 *   It should be one of (A) `undefined`, (B) an array of strings, or (C) a string.
 * @returns {Promise<Array<string|null>|string|null>} A Promise object which resolves to an array of strings, a single string, or null.
 *   (A) The returned Promise object resolves to:
 *       - An array consisting of all values in a hash associated with `key`.
 *       - An empty array ([]) if `key` does not exist.
 *
 *   (B) The returned Promise object resolves to:
 *       - An array (let's call it `values`) whose length is the same as that of `fields`.
 *         So if `fields` is empty ([]), `values` is also empty.
 *         If `fields` is not empty, for each 0 <= i < fields.length, values[i] is:
 *         -- A string which fields[i] holds in the hash associated with `key`.
 *         -- null if fields[i] is not present in the hash associated with `key`, or `key` does not exist.
 *
 *   (C) This function assumes that `fields` is a string if it is neither undefined nor an array, and returns a Promise object which resolves to:
 *       - A string which `fields` holds in the hash associated with `key`.
 *       - null if `fields` is not present in the hash associated with `key`, or `key` does not exist.
 *       
 * @throws {Error} - The returned Promise object resolves to an error if:
 *   - `key` is not a string
 *     (note that the returned Promise object resolves to an empty array if `fields` is an empty array, even if `key` is not a string).
 *   - `key` exists but the data associated with it is not a hash.
 * @see {@link https://redis.io/docs/latest/commands/hvals/},
 *      {@link https://redis.io/docs/latest/commands/hmget/},
 *      {@link https://redis.io/docs/latest/commands/hget/}
 */
function getHashValues(key, fields) {
  // (A)
  if (typeof fields === 'undefined') {
    return redisClient.hVals(key)
  }

  // (B)
  if (Array.isArray(fields)) {
    // If `fields` is an empty array, hmGet(key, fields) returns a Promise object which resolves to an error.
    // I prefer the returned Promise object to resolve to an empty array in that case.
    if (fields.length === 0) {
      return Promise.resolve([])
    }

    return redisClient.hmGet(key, fields)
  }

  // (C)
  // Note that `fields` is neither undefined nor an array here (it is supposed to be a string).
  return redisClient.hGet(key, fields)
}

/**
 * Sets a hash associated with `key` in Redis, and optionally sets a TTL to it.
 * 
 * If `key` does not exist, a new hash associated with `key` is created
 * and all fields in `hashObj` are added to the hash with their values.
 * If `key` already exists and is associated with a hash, for each field in `hashObj`:
 * (A) If the field does not exist in the hash, the field is newly added to the hash with its value.
 * (B) If the field already exists in the hash, the field is updated with its value.
 * 
 * @param {string} key - The key associated with the hash to set.
 * @param {Object.<string, string>} hashObj - An object containing the fields and values to set in the hash.
 *   It is expected to be in the following format:
 * 
 *   {
 *     field_1: 'value_1',
 *     field_2: 'value_2',
 *     ...,
 *     field_N: 'value_N'
 *   }
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
 *   - The first element of the array is a number of fields which were newly added to the hash.
 *   - The second element, if applicable, is `true` if a TTL represented by `ttl` was set to `key` with a mode represented by `ttlMode`,
 *     or `false` if the TTL was not set to `key` for some reason (e.g. `key` already had an existing TTL and `ttlMode` was `NX`).
 * @throws {Error} - The returned Promise object resolves to an error if:
 *   - `key` is not a string.
 *   - `key` exists but the data associated with `key` is not a hash.
 *   - `hashObj` is not an object or is empty ({}).
 * @see {@link https://redis.io/docs/latest/commands/multi/},
 *      {@link https://redis.io/docs/latest/commands/hset/},
 *      {@link https://redis.io/docs/latest/commands/expire/},
 *      {@link https://redis.io/docs/latest/commands/exec/}
 */
function setHash(key, hashObj, ttl, ttlMode) {
  const multi = redisClient.multi()

  multi.hSet(key, hashObj)

  if (Number.isInteger(ttl)) {
    multi.expire(key, ttl, formatTtlMode(ttlMode))
  }

  return multi.exec()
}

/**
 * Removes any data associated with `key` in Redis if it exists,
 * and then creates a new hash associated with `key` and adds all fields in `hashObj` with their values to the hash.
 * Optionally sets a TTL to `key`.
 * 
 * @param {string} key - The key associated with the hash to set.
 * @param {Object.<string, string>} hashObj - An object containing the fields and values to set in the hash.
 *   It is expected to be in the following format:
 * 
 *   {
 *     field_1: 'value_1',
 *     field_2: 'value_2',
 *     ...,
 *     field_N: 'value_N'
 *   }
 * 
 * @param {number} [ttl] - An optional integer specifying the TTL in seconds for the key.
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 2 if `ttl` is not an integer, or 3 if `ttl` is an integer.
 *   - The first element of the array is `1` if `key` existed and was removed, or `0` if `key` did not exist.
 *   - The second element is a number of fields which were newly added to the hash.
 *   - The third element, if applicable, is `true` if a TTL represented by `ttl` was set to `key`,
 *     or `false` if the TTL was not set to `key` for some reason.
 * @throws {Error} - The returned Promise object resolves to an error if:
 *   - `key` is not a string.
 *   - `hashObj` is not an object or is empty ({}).
 * @see {@link https://redis.io/docs/latest/commands/multi/},
 *      {@link https://redis.io/docs/latest/commands/del/},
 *      {@link https://redis.io/docs/latest/commands/hset/},
 *      {@link https://redis.io/docs/latest/commands/expire/},
 *      {@link https://redis.io/docs/latest/commands/exec/}
 */
function overwriteHash(key, hashObj, ttl) {
  const multi = redisClient.multi()

  multi.del(key)

  multi.hSet(key, hashObj)

  if (Number.isInteger(ttl)) {
    multi.expire(key, ttl)
  }

  return multi.exec()
}

// TODO (r.hidaka): Consider splitting this function into 2 (getJson(key) and getJsons(keys)).
/**
 * Retrieves JSON object(s) associated with `keys` from Redis.
 *
 * @param {Array<string>|string} keys - The key(s) associated with the hash to retrieve.
 *   It should be either (A) an array or (B) a string.
 * @returns {Promise<Array<Object|null>|Object|null>} A Promise object which resolves to the JSON object(s) associated with `keys`.
 *   (A) The returned Promise object resolves to an array (let's call it `values`) whose length is the same as that of `keys`.
 *       So if `keys` is empty ([]), `values` is also empty.
 *       If `keys` is not empty, for each 0 <= i < keys.length, values[i] is:
 *       - A JSON object associated with keys[i].
 *       - null if keys[i] does not exist, or it exists but the data associated with it is not a JSON.
 *       
 *   (B) This function assumes that `keys` is a string, and returns a Promise object which resolves to:
 *       - A JSON object associated with `keys`.
 *       - `null` if `keys` does not exist.
 * @throws {Error} - The returned Promise object resolves to an error if:
 *   - `keys` is an array which has a non-string element.
 *   - `keys` is a string and exists but the data associated with it is not a JSON.
 *   - `keys` is not an array or a string.
 * @see {@link https://redis.io/docs/latest/commands/json.mget/},
 *      {@link https://redis.io/docs/latest/commands/json.get/}
 */
function getJsons(keys) {
  // (A)
  if (Array.isArray(keys)) {
    if (keys.length === 0) {
      return Promise.resolve([])
    }

    return redisClient.json.mGet(keys, '$').then(rawJsons => rawJsons.flat())
  }

  // (B)
  return redisClient.json.get(keys)
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
 * @throws {Error} - The returned Promise object resolves to an error if:
 *   - `key` is not a string.
 *   - `key` exists but the data associated with `key` is not a JSON.
 * @see {@link https://redis.io/docs/latest/commands/multi/},
 *      {@link https://redis.io/docs/latest/commands/json/set/},
 *      {@link https://redis.io/docs/latest/commands/expire/},
 *      {@link https://redis.io/docs/latest/commands/exec/}
 */
function setJson(key, jsonObj, ttl, ttlMode) {
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
 * 
 *   {
 *     key_1: jsonObj_1,
 *     key_2: jsonObj_2,
 *     ...,
 *     key_N: jsonObj_N
 *   }
 * 
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
 *   - The i+1-th element (1 <= i <= N), if applicable, is `true` if a TTL represented by `ttl` was set to `key_i` with a mode represented by `ttlMode`,
 *     or `false` if the TTL was not set to `key_i` for some reason (e.g. `key_i` already had an existing TTL and `ttlMode` was `NX`).
 * @throws {Error} - The returned Promise object resolves to an error if:
 *   - some of the keys are not a string.
 *   - some of the keys exist but the data associated with them are not a JSON.
 * @see {@link https://redis.io/docs/latest/commands/multi/},
 *      {@link https://redis.io/docs/latest/commands/json.mset/},
 *      {@link https://redis.io/docs/latest/commands/expire/},
 *      {@link https://redis.io/docs/latest/commands/exec/}
 */
function setJsons(keysToJsonsObj, ttl, ttlMode) {
  const multi = redisClient.multi()

  const items = Object.entries(keysToJsonsObj).map(([key, value]) => ({
    key,
    value,
    path: '$'
  }))

  multi.json.mSet(items)

  if (Number.isInteger(ttl)) {
    const formattedTtlMode = formatTtlMode(ttlMode)
    Object.keys(keysToJsonsObj).forEach(key => multi.expire(key, ttl, formattedTtlMode))
  }

  return multi.exec()
}

/**
 * Deletes keys in Redis.
 * 
 * @param {string|Array<string>} keys - A string which represents a key to be deleted in Redis, or an array of strings which represent keys to be deleted in Redis.
 * @returns {Promise<number>} A Promise object which resolves to the number of keys deleted by this operation (non-existent keys are ignored).
 * @throws {Error} - The returned Promise object resolves to an error if `keys` is not a string or an array.
 * @see {@link https://redis.io/docs/latest/commands/del/}
 */
function deleteKeys(keys) {
  // If `keys` is an empty array, del(keys) returns a Promise object which resolves to an error.
  // I prefer the returned Promise object to resolve to `0` in that case.
  if (Array.isArray(keys) && keys.length === 0) {
    return Promise.resolve(0)
  }
  return redisClient.del(keys)
}

/**
 * Returns the remaining TTL (seconds) of `key`.
 * 
 * @param {string} key - The key whose TTL to retrieve.
 * @returns {Promise<number>} A Promise object which resolves to:
 *   - The remaining TTL (seconds) of `key` if it has one.
 *   - `-2` if `key` does not exist.
 *   - `-1` if `key` exists but does not have a TTL.
 * @throws {Error} - The returned Promise object resolves to an error if `key` is not a string.
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
 * @throws {Error} - The returned Promise object resolves to an error if `key` is not a string, or `ttl` is not an integer.
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

module.exports = {
  getHash,
  getAllHashFields,
  getHashValues,
  setHash,
  overwriteHash,

  getJsons,
  setJson,
  setJsons,

  deleteKeys,

  getTtl,
  setTtl,
}
