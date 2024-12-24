const redisClient = require('../config/redis.js')
const logger = require('../logger.js')(__filename)
const groupsUtilityFunctions = require('../utility/groupsUtilityFunctions.js')

// Returns a Promise object which resolves to:
// - The entire hash associated with `key`, an object in the following format:
//
// {
//   field1: 'value1',
//   field2: 'value2',
//   ...,
//   fieldN: 'valueN'
// }
//
// - null if `key` does not exist.
// - An error if:
//   - `key` is not a string.
//   - `key` exists but the data associated with it is not a hash.
//
// See: https://redis.io/docs/latest/commands/hgetall/
function getHash(key) {
  // If `key` does not exist, hGetAll(key) returns a Promise object which resolves to an empty object ({}).
  // I prefer the returned Promise object to resolve to null in that case.
  return redisClient.hGetAll(key).then(hash => Object.keys(hash).length > 0 ? hash : null)
}

// Returns a Promise object which resolves to:
// - An array consisting of all fields in the hash associated with `key`.
// - An empty array ([]) if the key does not exist.
// - An error if:
//   - `key` is not a string.
//   - `key` exists but the data associated with it is not a hash.
//
// See: https://redis.io/docs/latest/commands/hkeys/
function getAllHashFields(key) {
  return redisClient.hKeys(key)
}

// Returns a Promise object varying depending on `fields`:
//
// (A) undefined:
//       The returned Promise object resolves to:
//       - An array consisting of all values in a hash associated with `key`.
//       - An empty array ([]) if `key` does not exist.
//       - An error if:
//         - `key` is not a string.
//         - `key` exists but the data associated with it is not a hash.
//
// (B) array:
//       The returned Promise object resolves to:
//       - An array (let's call it `values`) whose length is the same as that of `fields`.
//         So if `fields` is empty ([]), `values` is also empty.
//         If `fields` is not empty, for each 0 <= i < fields.length, values[i] is:
//         - A string which fields[i] holds in the hash associated with `key`.
//         - null if fields[i] is not present in the hash associated with `key`, or `key` does not exist.
//       - An error if:
//         - `key` is not a string and `fields` is not empty.
//         - `key` exists but the data associated with it is not a hash.
//
// (C) Neither undefined nor array:
//       This function assumes that `fields` is a string, and returns a Promise object which resolves to:
//       - A string which `fields` holds in the hash associated with `key`.
//       - null if `fields` is not present in the hash associated with `key`, or `key` does not exist.
//       - An error if:
//         - `key` is not a string.
//         - `key` exists but the data associated with it is not a hash.
//
// See: https://redis.io/docs/latest/commands/hvals/,
//      https://redis.io/docs/latest/commands/hmget/,
//      https://redis.io/docs/latest/commands/hget/
function getHashValues(key, fields) {
  // (A)
  if (groupsUtilityFunctions.isUndefined(fields)) {
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

// DONE
// `fieldsToValuesObj` is expected to be in the following format:
//
// {
//   field1: 'value1',
//   field2: 'value2',
//   ...,
//   fieldN: 'valueN'
// }
//
// If `key` does not exist, a new hash associated with `key` is created
// and all fields in `fieldsToValuesObj` are added to the hash with their values.
// If `key` already exists and is associated with a hash, for each field in `fieldsToValuesObj`:
// (A) If the field does not exist in the hash, the field is newly added to the hash with its value.
// (B) If the field already exists in the hash, the field is updated with its value.
//
// If `keyTtl` is given as an integer, a TTL represented by it is set to `key` with a mode represented by `keyTtlMode`.
//
// Returns a Promise object which resolves to:
// - An array whose length is 1 if `keyTtl` is not an integer, or 2 if `keyTtl` is an integer.
//   - The first element of the array is a number of fields which were newly added to the hash.
//   - The second element, if applicable, is true if a TTL represented by `keyTtl` was set to `key` with a mode represented by `keyTtlMode`,
//     or false if the TTL was not set to `key` for some reason.
// - An error if:
//   - `key` is not a string.
//   - `key` exists but the data associated with `key` is not a hash.
//   - `fieldsToValuesObj` is not an object or is empty ({}).
//
// See: https://redis.io/docs/latest/commands/multi/,
//      https://redis.io/docs/latest/commands/hset/,
//      https://redis.io/docs/latest/commands/expire/,
//      https://redis.io/docs/latest/commands/exec/
//
function setHash(key, fieldsToValuesObj, keyTtl, keyTtlMode) {
  const multi = redisClient.multi()

  multi.hSet(key, fieldsToValuesObj)

  if (Number.isInteger(keyTtl)) {
    multi.expire(key, keyTtl, formatTtlMode(keyTtlMode))
  }

  return multi.exec()
}

// DONE
// `fieldsToValuesObj` is expected to be in the following format:
//
// {
//   field1: 'value1',
//   field2: 'value2',
//   ...,
//   fieldN: 'valueN'
// }
//
// Removes any cached data associated with `key` if it exists,
// and then creates a new hash associated with `key` and adds all fields in `fieldsToValuesObj` with their values to the hash.
//
// If `keyTtl` is given, a TTL represented by it is set to `key`.
//
// Returns a Promise object which resolves to:
// - An array whose length is 2 if `keyTtl` is not an integer, or 3 if `keyTtl` is an integer.
//   - The first element of the array is 1 if `key` existed and was removed, or 0 if `key` did not exist.
//   - The second element is a number of fields which were newly added to the hash.
//   - The third element, if applicable, is true if a TTL represented by `keyTtl` was set to `key`,
//     or false if the TTL was not set to `key` for some reason.
// - An error if:
//   - `key` is not a string.
//   - `fieldsToValuesObj` is not an object or is empty ({}).
//
// See: https://redis.io/docs/latest/commands/multi/,
//      https://redis.io/docs/latest/commands/hset/,
//      https://redis.io/docs/latest/commands/expire/,
//      https://redis.io/docs/latest/commands/exec/
//
function overwriteHash(key, fieldsToValuesObj, keyTtl) {
  const multi = redisClient.multi()

  multi.del(key)

  multi.hSet(key, fieldsToValuesObj)

  if (Number.isInteger(keyTtl)) {
    multi.expire(key, keyTtl)
  }

  return multi.exec()
}

// DONE
// Returns a Promise object varying depending on `keys`:
//
// (A) array:
//       The returned Promise object resolves to:
//       - An array (let's call it `values`) whose length is the same as that of `keys`.
//         So if `keys` is empty ([]), `values` is also empty.
//         If `keys` is not empty, for each 0 <= i < keys.length, values[i] is:
//         - A JSON object associated with keys[i].
//         - null if keys[i] does not exist, or it exists but the data associated with it is not a JSON.
//       - An error if `keys` has a non-string element.
//
// (B) not array:
//       This function assumes that `keys` is a string, and returns a Promise object which resolves to:
//       - A JSON object associated with `keys`.
//       - null if `keys` does not exist.
//       - An error if:
//         - `keys` is not a string.
//         - `keys` exists but the data associated with it is not a JSON.
//
// See: https://redis.io/docs/latest/commands/json.mget/,
//      https://redis.io/docs/latest/commands/json.get/
//
function getJSONs(keys) {
  // (A)
  if (Array.isArray(keys)) {
    if (keys.length === 0) {
      return Promise.resolve([])
    }

    return redisClient.json.mGet(keys, '$').then(rawJSONs => rawJSONs.flat())
  }

  // (B)
  return redisClient.json.get(keys)
}

// DONE
// If `key` does not exist, or it exists and the data associated with it is a JSON,
// `key` is associated with a new JSON represented by `jsonObj`.
//
// If `ttl` is given as an integer, a TTL represented by it is set to `key` with a mode represented by `ttlMode`.
// If `key` already has a TTL and `ttl` is not an integer, the TTL will not be changed.
//
// Returns a Promise object which resolves to:
// - An array whose length is 1 if `ttl` is not an integer, or 2 if `ttl` is an integer.
//   - The first element of the array is a string 'OK'.
//   - The second element, if applicable, is true if a TTL represented by `ttl` was set to `key` with a mode represented by `ttlMode`,
//     or false if the TTL was not set to `key` for some reason.
// - An error if:
//   - `key` is not a string.
//   - `key` exists but the data associated with `key` is not a JSON.
//
// See: https://redis.io/docs/latest/commands/multi/,
//      https://redis.io/docs/latest/commands/json.set/,
//      https://redis.io/docs/latest/commands/expire/,
//      https://redis.io/docs/latest/commands/exec/
//

// TODO: BUG FIX
// key に undefined とか渡すとエラー
// その後の全てのタイプの Redis コマンドがフリーズする
// フリーズ中にもう一度 Redis コマンドを発行するとフリーズ解除するが, コマンドがフリーズ発生時のものとあわせて２個同時に処理される
// multi 特有っぽい
// JSON の問題ではない（Hash でも発生）
// multi でコマンドを2個以上積んでいると発生する
// set の問題か？expire でエラーになってもこの現象は発生しなかった
// 順番の問題でもなさそうだが…
function setJSON(key, jsonObj, ttl, ttlMode) {
  const multi = redisClient.multi()

  multi.json.set(key, '$', jsonObj)

  if (Number.isInteger(ttl)) {
    multi.expire(key, ttl, formatTtlMode(ttlMode))
  }

  return multi.exec()
}

// function setJSONs(keysToJsonsObj, keyTtl, keyTtlMode) {
//   const multi = redisClient.multi()

//   const keys = Object.keys(keysToJsonsObj)
//   const items = keys.map(key => ({
//     key: key,
//     path: '$',
//     value: keysToJsonsObj[key]
//   }))

//   multi.json.mSet(items)

//   if (Number.isInteger(keyTtl)) {
//     const formattedTtlMode = formatTtlMode(keyTtlMode)
//     keys.forEach(key => multi.expire(key, keyTtl, formattedTtlMode))
//   }

//   return multi.exec()
// }

// DONE
// Delete keys in cache.
// Returns a Promise object which resolves to:
// - The number of keys deleted by this operation (non-existent keys are ignored).
// - An error if `keys` is neither a string nor an non-empty array.
// See: https://redis.io/docs/latest/commands/del/
//
function deleteKeys(keys) {
  return redisClient.del(keys)
}

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

// DONE
// Returns a Promise object which resolves to:
// - The remaining TTL (seconds) of `key` if it has one.
// - -2 if `key` does not exist.
// - -1 if `key` exists but does not have a TTL.
// - An error if `key` is not a string.
//
// The data type associated with `key` does not matter (e.g., it can be hash, JSON, etc.).
//
// See: https://redis.io/docs/latest/commands/ttl/
//
function getTTL(key) {
  return redisClient.ttl(key)
}

// TODO
// Returns a Promise object which resolves to a boolean value representing the result of the operation.
// If the key does not exist, the returned Promise object resolves to false.
// Which means we cannot set a TTL to a non-existent key.
//
// See: https://redis.io/docs/latest/commands/expire/
function setTTL(key, ttl, ttlMode) {
  return redisClient.expire(key, ttl, formatTtlMode(ttlMode))
}

// TODO
// Returns a Promise object which resolves to an array of TTLs of `fields`
// `fields` can be either a single field or an array of fields.
// TTL is -2 if the key does not exist, or it exists but the field does not.
// TTL is -1 if the key and the field exist but no TTL is set.
//
// See: https://redis.io/docs/latest/commands/httl/
function getHashTTLs(key, fields) {
  return redisClient.hTTL(key, fields)
}

// TODO
// Returns a Promise object which resolves to an array of an operation result of each field in `fields`.
// `fields` can be either a single field or an array of fields.
// TTL is -2 if the key does not exist, or it exists but the field does not.
// TTL is 1 if the key and the field exist, and TTL is set or updated.
//
// See: https://redis.io/docs/latest/commands/hexpire/
function setHashTTLs(key, fields, ttl) {
  return redisClient.hExpire(key, fields, ttl)
}

module.exports = {
  getHash,
  getAllHashFields,
  getHashValues,
  setHash,
  overwriteHash,

  getJSONs,
  setJSON,

  deleteKeys,

  getTTL,
  getHashTTLs,
  setTTL,
  setHashTTLs,
}



// Tips

// hSet(key, fieldsToValuesObj)
//
// If a hash is associated with `key` and has a TTL, this operation does not change the TTL.
// If a hash is associated with `key` and one of its fields has a TTL,
// this operation removes the TTL (more accurately, sets the TTL to -1) only if the field is included in `fieldsToValuesObj`.
//

// json.mGet(keys, '$') について:
// - keys:
//   - undefined -> エラー
//   - null -> エラー
//   - string -> string を構成する文字の配列が渡されたとみなされる. 例えば keys = 'test' は keys = ['t', 'e', 's', 't'] という指定と同義 (なので特に空文字を渡すとエラー).
//   - [] -> エラー
//   - non-empty array -> values (keys と同じ長さの配列). value = <key が存在しないかデータタイプが JSON でないと null, key が JSON に関連づけられている場合にはその JSON のみを要素とする配列>.
// - What if some of the keys do not exist? -> values corresponding to the keys are `null`
// - What if some of the keys exist and the data types of them are not JSON? -> values corresponding to the keys are `null` (エラーにならないのかよ！)

// redisClient.multi() について:
// multi は途中のオペレーションが失敗してもそれ以降のオペレーションを継続する.
// いずれかのオペレーションが失敗した場合は multi.exec() はエラーに解決する Promise オブジェクトを返す.
// error.replies -> 各オペレーションの結果を保持する配列 (エラーが起きたオペレーションについてはエラーメッセージ)
// error.errorIndexes -> エラーが発生したオペレーションの添字の配列
