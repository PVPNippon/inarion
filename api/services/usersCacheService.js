// TODO(m.okamoto): cacheService の関数を redisCacheService に置き換える
const cacheService = require('./cacheService.js')
const config = require('../config/config')
// TODO (m.okamoto): implement logger in Redis (#267)

/**
 * Retrieves an array of all unique user IDs stored in the cache.
 *
 * This function queries the cache to obtain all user IDs, removing any duplicates and negative cache entries.
 * If `requiresAllUsersListedBefore` is true, the function checks whether the cache contains all users previously listed.
 *
 * @param {boolean} [requiresAllUsersListedBefore=false] - Indicates whether to return null if not all users were listed before.
 * @returns {Promise<Array<string>|null>} A Promise object that resolves to:
 *   - An array of unique user IDs in the cache.
 *     It is empty ([]) if and only if all users were listed before and only negative cache entries are in the cache.
 *   - `null` if (A) the cache is empty,
 *     or (B) `requiresAllUsersListedBefore` is true and all users were not listed before,
 *     or (C) all users were not listed before and only negative cache entries are in the cache.
 * @see {@link cacheService.getHash|getHash}
 */
async function getAllIds(requiresAllUsersListedBefore = false) {
  // TODO(m.okamoto): Domain names will eventually stop being hard-coded
  const key = `${config.DOMAIN_TEST}:users:id`
  const emailsToIdsObj = await cacheService.getHash(key)

  // Return null if the cache is empty
  if (emailsToIdsObj === null) {
    return null
  }

  // The cached hash has a field 'ALL_USERS_LISTED' if and only if all groups were listed before by calling usersService.listUsers()
  const allUsersListedBefore = 'ALL_USERS_LISTED' in emailsToIdsObj

  // If `requiresAllUsersListedBefore` is true and all users were not listed before, return null
  if (allUsersListedBefore) {
    delete emailsToIdsObj['ALL_USERS_LISTED']
  } else if (requiresAllUsersListedBefore) {
    return null
  }

  // Remove duplicates
  const uniqueIdsSet = new Set(Object.values(emailsToIdsObj))

  // NEGATIVE_CACHE is not needed at this time, but it may be implemented in the future.
  uniqueIdsSet.delete('NEGATIVE_CACHE')

  // If all users were listed before and only negative cache entries are in the cache, it means there is no user in the organization, so return []
  // If all users were not listed before and only negative cache entries are in the cache, it means no actual cache exists, so return null
  if (uniqueIdsSet.size === 0) {
    return hasAllUsers ? [] : null
  }

  return [...uniqueIdsSet]
}

/**
 * Retrieves multiple {@link https://developers.google.com/admin-sdk/directory/reference/rest/v1/users#resource:-user|user instances} by their IDs from the cache.
 *
 * This function takes an array of user IDs and returns an array of corresponding users.
 * If a user which has an ID in the provided IDs array is not found in the cache, the corresponding element in the returned array is `null`.
 *
 * @param {Array<string>} userIds - The IDs of the users to retrieve.
 * @returns {Promise<Array<Object|null>>} A Promise object which resolves to an array of user instances (let's call it `users`).
 *   The length of `users` is the same as the length of `userIds`.
 *   So if `userIds` is an empty array ([]), the `users` is also empty.
 *   If `userIds` is not empty, for each `0 <= i < userIds.length`, `users[i]` is:
 *   - The user instance which has `userIds[i]` as its user ID if it is found in the cache
 *   - `null` if no user instance which has `userIds[i]` as its user ID is found in the cache
 * @see {@link cacheService.getJsons|getJsons}
 */
function getUsersByIds(userIds) {
  // TODO(m.okamoto): Domain names will eventually stop being hard-coded
  // TODO(m.okamoto): VALIDATION: userIds should be an array of non-empty strings.
  const keys = userIds.map((userId) => `${config.DOMAIN_TEST}:users:${userId}:info`)
  return cacheService.getJsons(keys)
}

/**
 * Overwrites the mapping of user email to user ID in the cache in the form of a hash.
 *
 * This function removes the key `<DOMAIN>:users:id` first (if it exists in the cache),
 * and then creates a new mapping with the key and sets a TTL to it.
 *
 * @param {Object.<string, string>} emailsToIdsObj - Mapping of user email to user ID.
 *   It is expected to be in the following format:
 *   ```
 *   {
 *     userEmail_1: 'userId_1',
 *     userEmail_2: 'userId_2',
 *     ...,
 *     userEmail_N: 'userId_N'
 *   }
 *   ```
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 3.
 *   - The first element of the array is `1` if the key existed and was removed, or `0` if the key did not exist.
 *   - The second element is a number of fields which were newly added to the hash (so it should be `N`).
 *   - The third element is `true` (the meaning of this value is that the TTL was set to the key).
 * @throws {Error} - The returned Promise object resolves to an error if `emailsToIdsObj` is not an object or is empty ({}).
 * @see {@link cacheService.overwriteHash|overwriteHash}
 */
function overwriteIds(emailsToIdsObj) {
  // TODO(m.okamoto): Domain names will eventually stop being hard-coded
  const key = `${config.DOMAIN_TEST}:users:id`
  const ttl = Number(config.TTL)
  return cacheService.overwriteHash(key, emailsToIdsObj, ttl)
}

/**
 * Stores multiple {@link https://developers.google.com/admin-sdk/directory/reference/rest/v1/users#resource:-user|user instances} in the cache.
 *
 * Each user instance is stored with a key of `<DOMAIN>:users:<id>:info` and a TTL where `<id>` is the user ID.
 * An old user instance with the same key and an old TTL set to it will be overwritten.
 *
 * @param {Array<Object>} users - The user instances to store in the cache.
 * @returns {Promise<Array<string|boolean>} A Promise object which resolves to an array whose length is `N+1`, where `N` is the length of `users`.
 *   - The first element of the array is a string 'OK'.
 *   - The `i+2`-th element (`0 <= i < N`) is `true` (the meaning of this value is that the TTL was set to the key of `users[i]`).
 * @see {@link cacheService.setJsons|setJsons}
 */
function setUsers(users) {
  const idsToUsersObj = {}

  users.forEach((user) => {
    const id = user.id
    // TODO(m.okamoto): Domain names will eventually stop being hard-coded
    const key = `${config.DOMAIN_TEST}:users:${id}:info`
    idsToUsersObj[key] = user
  })

  const ttl = Number(config.TTL)

  return cacheService.setJsons(idsToUsersObj, ttl)
}

module.exports = {
  getAllIds,
  getUsersByIds,
  overwriteIds,
  setUsers,
}
