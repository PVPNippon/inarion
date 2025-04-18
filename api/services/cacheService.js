/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const redisClient = require('../config/redis.js')
//Important! This file will be deprecated.
//Please use api/services/redisCacheService.js instead.
//Some overlapping functions from here were replaced with functions from api/services/redisCacheService.js.
//However, most functions from here were migrated as-is, but some function names changed.
//Please see explanations in module.exports statement at the bottom of api/services/redisCacheService.js.

/**
 * Retrieves the entire hash associated with `key` from Redis.
 *
 * @param {string} key - The key associated with the hash to retrieve.
 * @returns {Promise<Object.<string, string>|null>} A Promise object which resolves to:
 *   - A hash associated with `key`.
 *   - `null` if `key` does not exist.
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - `key` is not a string.
 *   - `key` exists but the data associated with it is not a hash.
 * @see {@link https://redis.io/docs/latest/commands/hgetall/}
 */
function getHash(key) {
  // If `key` does not exist, hGetAll(key) returns a Promise object which resolves to an empty object ({}).
  // I prefer the returned Promise object to resolve to null in that case.
  return redisClient.hGetAll(key).then((hash) => (Object.keys(hash).length > 0 ? hash : null))
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
  return redisClient.hKeys(key)
}

/**
 * Retrieves a value `field` holds in the hash associated with `key` from Redis.
 *
 * @param {string} key - The key associated with the hash to retrieve a value from.
 * @param {string} field - The field whose value to retrieve.
 * @returns {Promise<string|null>} A Promise object which resolves to:
 *   - A string which `field` holds in the hash associated with `key`.
 *   - `null` if `field` is not present in the hash associated with `key`, or `key` does not exist.
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - `key` is not a string.
 *   - `field` is not a string.
 *   - `key` exists but the data associated with it is not a hash.
 * @see {@link https://redis.io/docs/latest/commands/hget/}
 */
function getHashValue(key, field) {
  return redisClient.hGet(key, field)
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
  return redisClient.hVals(key)
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
  if (keys.length === 0) {
    return Promise.resolve([])
  }

  const multi = redisClient.multi()

  keys.forEach((key) => multi.hGetAll(key))

  return multi.exec().then((hashes) => hashes.map((hash) => (Object.keys(hash).length > 0 ? hash : null)))
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
function setHash(key, hashObj, ttl, ttlMode) {
  const multi = redisClient.multi()

  multi.hSet(key, hashObj)

  if (Number.isInteger(ttl)) {
    multi.expire(key, ttl, formatTtlMode(ttlMode))
  }

  return multi.exec()
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
  const multi = redisClient.multi()

  multi.del(key)

  multi.hSet(key, hashObj)

  if (Number.isInteger(ttl)) {
    multi.expire(key, ttl)
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
function setHashes(keysToHashesObj, ttl, ttlMode) {
  const multi = redisClient.multi()

  Object.entries(keysToHashesObj).forEach(([key, hash]) => multi.hSet(key, hash))

  if (Number.isInteger(ttl)) {
    const formattedTtlMode = formatTtlMode(ttlMode)
    Object.keys(keysToHashesObj).forEach((key) => multi.expire(key, ttl, formattedTtlMode))
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

/**
 * Retrieves a JSON object associated with `key` from Redis.
 *
 * @param {string} key - The key associated with the JSON object to retrieve.
 * @returns {Promise<Object|null>} A Promise object which resolves to:
 *   - A JSON object associated with `key`.
 *   - `null` if `key` does not exist.
 * @throws {Error} The returned Promise object resolves to an error if:
 *   - `key` is not a string.
 *   - `key` exists but the data associated with it is not a JSON.
 * @see {@link https://redis.io/docs/latest/commands/json.get/}
 */
function getJson(key) {
  return redisClient.json.get(key)
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
  if (keys.length === 0) {
    return Promise.resolve([])
  }
  return redisClient.json.mGet(keys, '$').then((rawJsons) => rawJsons.flat())
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
 *   ```
 *   {
 *     key_1: jsonObj_1,
 *     key_2: jsonObj_2,
 *     ...,
 *     key_N: jsonObj_N
 *   }
 *   ```
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
function setJsons(keysToJsonsObj, ttl, ttlMode) {
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

module.exports = {
  getHash,
  getAllHashFields,
  getHashValue,
  getHashValues,
  getAllHashValues,
  getHashes,
  setHash,
  overwriteHash,
  setHashes,
  overwriteHashes,

  getJson,
  getJsons,
  setJson,
  setJsons,

  deleteKeys,

  getTtl,
  setTtl,
}
