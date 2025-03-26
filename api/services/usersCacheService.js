const redisCacheService = require('../services/redisCacheService')
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
 */
async function getAllIds(requiresAllUsersListedBefore = false) {
  // TODO(m.okamoto): Domain names: ${config.DOMAIN_TEST} will eventually stop being hard-coded
  // Create a hash that links a user ID to all email addresses owned by that user
  const key = `${config.DOMAIN_TEST}:users:id`
  const emailsToIdsObj = await redisCacheService.getHashFromRedis(key)

  // Return null if the cache is empty
  if (emailsToIdsObj === null) {
    return null
  }

  // The cached hash has a field 'ALL_USERS_LISTED' if and only if all users were fetched before by calling usersService.listUsers()
  const allUsersListedBefore = 'ALL_USERS_LISTED' in emailsToIdsObj

  // If `requiresAllUsersListedBefore` is true and all users were not listed before, return null
  if (allUsersListedBefore) {
    delete emailsToIdsObj['ALL_USERS_LISTED']
  } else if (requiresAllUsersListedBefore) {
    return null
  }

  // Retrieve all users ids from the set which is created in saveUserIdsToSet function
  const userIdsKey = `${config.DOMAIN_TEST}:users:list`
  const userIds = await redisCacheService.getSetMembers(userIdsKey)

  // If the cache is empty,
  if (userIds.length === 0) {
    // 1. If all users were listed before, it means there is no user in the org, so return []
    // 2. If all users were not listed before, it means no actual cache exists, so return null
    return allUsersListedBefore ? [] : null
  }

  // If `requiresAllUsersListedBefore` is true and all users were not listed before, return null
  if (requiresAllUsersListedBefore && !allUsersListedBefore) {
    return null
  }

  return userIds
}

/**
 * Retrieves an array of user IDs that match the given filter from the cache.
 *
 * If the cache is empty, the function returns null.
 *
 * @param {string} filterName - The name of the filter.
 * @param {string} filterValue - The value of the filter.
 * @returns {Promise<Array<string>|null>} A Promise object that resolves to an array of user IDs that match the given filter.
 *   If the cache is empty, the Promise resolves to null.
 * @see {@link redisCacheService.getSetMembers|getSetMembers}
 */
async function getFilteredIds(filterName, filterValue) {
  const filterKey = `${config.DOMAIN_TEST}:users:${filterName}:${filterValue}`
  const filteredUserIds = await redisCacheService.getSetMembers(filterKey)

  // console.log('filterKey:', filterKey)
  // console.log('filteredUserIds:', filteredUserIds)

  // If the cache is empty, return null
  if (filteredUserIds.length === 0) {
    return null
  }

  return filteredUserIds
}

/**
 * Retrieves the ID of a user by its email address from the cache.
 *
 * @param {string} email - The email address of the user to retrieve the ID for.
 * @returns {Promise<string|null>} A Promise object which resolves to:
 *   - the user ID corresponding to `email` if it is found in the cache
 *   - `null` if the user ID corresponding to `email` is not found in the cache.
 * @see {@link redisCacheService.getHashFieldFromRedis|getHashFieldFromRedis}
 */
function getId(email) {
  // TODO (r.hidaka): VALIDATION: `email` should be a string in an email address format
  const key = `${config.DOMAIN_TEST}:users:id`
  return redisCacheService.getHashFieldFromRedis(key, email)
}

/**
 * Retrieves an array of user instances from the cache by their IDs.
 *
 * This function queries the cache to obtain the user instances for each ID in the provided array.
 * If a user ID does not have a corresponding user instance in the cache, the resulting array will contain null for that ID.
 *
 * @param {Array<string>} userIds - An array of user IDs to retrieve the user instances for.
 * @returns {Promise<Array<Object|null>>} A Promise object which resolves to an array of user instances (let's call it `users`).
 *   The length of `users` matches the length of `userIds`.
 *   So if `userIds` is an empty array ([]), `users` will also be empty.
 *   If `userIds` is not empty, for each `0 <= i < userIds.length`, `users[i]` is:
 *   - The user instance corresponding to `userIds[i]` if it is found in the cache.
 *   - `null` if the user instance corresponding to `userIds[i]` is not found in the cache.
 * @see {@link redisCacheService.getJsons|getJsons}
 */
function getUsersByIds(userIds) {
  // TODO(m.okamoto): VALIDATION: userIds should be an array of non-empty strings.
  const keys = userIds.map((userId) => `${config.DOMAIN_TEST}:users:${userId}:info`)
  return redisCacheService.getJsons(keys)
}

/**
 * Retrieves an array of user instances from the cache by their IDs which are filtered by a certain filter.
 *
 * This function queries the cache to obtain the user instances for each ID in the provided array.
 * If a user ID does not have a corresponding user instance in the cache, the resulting array will contain null for that ID.
 *
 * @param {Array<string>} filteredUserIds - An array of user IDs to retrieve the user instances for, which is filtered by a certain filter.
 * @returns {Promise<Array<Object|null>>} A Promise object which resolves to an array of user instances (let's call it `users`).
 *   The length of `users` matches the length of `filteredUserIds`.
 *   So if `filteredUserIds` is an empty array ([]), `users` will also be empty.
 *   If `filteredUserIds` is not empty, for each `0 <= i < filteredUserIds.length`, `users[i]` is:
 *   - The user instance corresponding to `filteredUserIds[i]` if it is found in the cache.
 *   - `null` if the user instance corresponding to `filteredUserIds[i]` is not found in the cache.
 * @see {@link redisCacheService.getJsons|getJsons}
 */
function getFilteredUsersByIds(filteredUserIds) {
  // console.log('filteredUserIds:', filteredUserIds)
  const keys = filteredUserIds.map((userId) => `${config.DOMAIN_TEST}:users:${userId}:info`)
  return redisCacheService.getJsons(keys)
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
 * @see {@link redisCacheService.overwriteHash|overwriteHash}
 */
function overwriteIds(emailsToIdsObj) {
  const key = `${config.DOMAIN_TEST}:users:id`
  const ttl = Number(config.TTL)
  return redisCacheService.overwriteHash(key, emailsToIdsObj, ttl)
}

/**
 * Stores multiple {@link https://developers.google.com/admin-sdk/directory/reference/rest/v1/users#resource:-user|user instances} in the cache.
 *
 * Each user instance is stored with a key of `<DOMAIN>:users:<id>:info` and a TTL where `<id>` is the user ID.
 * An old user instance with the same key and an old TTL set to it will be overwritten.
 *
 * @param {Array<Object>} users - An array of user instances to store in the cache.
 * @returns {Promise<Array<string|boolean>>} A Promise object which resolves to an array whose length is `N+1`, where `N` is the length of `users`.
 *   - The first element of the array is a string 'OK'.
 *   - The `i+2`-th element (`0 <= i < N`) is `true` (the meaning of this value is that the TTL was set to the key of `users[i]`).
 * @throws {Error} The returned Promise object resolves to an error if `users` is empty ([]).
 *   // TODO (r.hidaka): Consider changing the behavior in this case
 * @see {@link redisCacheService.setJsons|setJsons}
 */
async function setUsers(users) {
  const idsToUsersObj = {}

  users.forEach((user) => {
    const id = user.id
    const key = `${config.DOMAIN_TEST}:users:${id}:info`
    idsToUsersObj[key] = user
  })

  await saveUserIdsToSet(users)

  const ttl = Number(config.TTL)
  return redisCacheService.setJsonsWithTtlMode(idsToUsersObj, ttl)
}

/**
 * Saves an array of user IDs in a Redis set.
 *
 * @param {Array<Object>} users - An array of user objects.
 * @returns {Promise<void>} A Promise object which resolves to `undefined`.
 * @see {@link redisCacheService.addToSetInRedis|addToSetInRedis}
 */
function saveUserIdsToSet(users) {
  const userIdsKey = `${config.DOMAIN_TEST}:users:list`
  const userIds = users.map((user) => user.id)
  const ttl = 60 * 60 // 1 hour

  // Create a set of user IDs
  return redisCacheService.addToSetInRedis(userIdsKey, userIds) // , null, ttl
}

/**
 * Stores the user IDs that match the given filter in the cache.
 *
 * This function creates a set of user IDs in the cache with a key of `<DOMAIN>:users:<filterName>:<filterValue>`.
 * The set stores the user IDs that match the given filter.
 * An old set with the same key and an old TTL set to it will be overwritten.
 *
 * @param {string} filterName - The name of the filter.
 * @param {string} filterValue - The value of the filter.
 * @param {Array<Object>} users - An array of user instances that match the given filter.
 * @returns {Promise<void>} A Promise object which resolves to `undefined` when the set is successfully created in the cache.
 * @throws {Error} The returned Promise object resolves to an error if `users` is empty ([]).
 * @see {@link redisCacheService.addToSetInRedis|addToSetInRedis}
 */
async function saveFilteredUsersCache(filterName, filterValue, users) {
  // Replace spaces with other symbols.
  const formattedFilterValue = filterValue.replace(/ +/g, '-')

  const filterKey = `${config.DOMAIN_TEST}:users:${filterName}:${formattedFilterValue}`
  const filteredUserIds = users.map((user) => user.id)

  // console.log('filterKey:', filterKey)

  return redisCacheService.addToSetInRedis(filterKey, filteredUserIds)
}

/**
 * Retrieves the intersection of multiple sets from the cache.
 *
 * This function takes an array of Redis keys which identify the sets to intersect.
 * It returns a set containing the IDs that exist in all of the sets.
 *
 * @param {Array<string>} keys - An array of Redis keys representing the sets to intersect.
 * @returns {Promise<Set<string>>} A Promise object that resolves to a set of IDs that exist in all of the sets.
 * @throws {Error} The returned Promise object resolves to an error if any step in the process fails.
 * @see {@link redisCacheService.intersectionOfSets|intersectionOfSets}
 */
async function getIntersectionIdOfSets(keys) {
  // GWS allows OU and role names to contain spaces but Redis SINTER does not.
  // At the moment, I have adopted A) solution.

  // A) Replace spaces with other symbols.
  const formattedKeys = keys.map((key) => key.replace(/ +/g, '-'))

  // B) Enclose the keys with double quotes. (should be) no need to add anything to saveFilteredUsersCache but couldn't see it is working.
  // バックスラッシュを使ってみる
  // const formattedKeys = keys.map((key) => `\"${key}\"`)

  // C) Encode the keys with base64.

  // console.log('keys:', formattedKeys)
  const intersection = await redisCacheService.intersectionOfSets(formattedKeys)
  // console.log('intersection:', intersection)
  return intersection
}

/**
 * Retrieves the IDs stored in the cache with the given key.
 *
 * This function retrieves the IDs from the cache with the given key.
 * The IDs are stored in the cache as a set.
 *
 * @param {string} key - The key of the set in the cache.
 * @returns {Promise<Array<string>>} A Promise object which resolves to an array of IDs stored in the cache.
 * @see {@link redisCacheService.getSetMembers|getSetMembers}
 */
async function getIdsFromCache(key) {
  const ids = await redisCacheService.getSetMembers(key)
  return ids
}

/**
 * Retrieves the nested table of a user from the cache.
 *
 * @param {string} id - The ID of the user whose nested table is to be retrieved.
 * @returns {Promise<Object|null>} A Promise object which resolves to the nested table of the user if found in the cache,
 *   or null if not found.
 * @see {@link redisCacheService.getJsonFromRedis|getJsonFromRedis}
 */
function getNestedTableById(id) {
  const key = `${config.DOMAIN_TEST}:users:${id}:nestedTable`
  return redisCacheService.getJsonFromRedis(key)
}

/**
 * Stores the nested table of a user in the cache in the form of JSON.
 *
 * The key is `<DOMAIN>:users:<id>:nestedTable` where `<id>` is the user ID, and the value is the nested table of the user.
 *
 * @param {string} id - The ID of the user whose nested table is to be stored.
 * @param {Object} table - The nested table of the user.
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 2.
 *   - The first element of the array is a string 'OK'.
 *   - The second element is `true` if a TTL was set to the key, or `false` if the TTL was not set to the key for some reason.
 * @see {@link redisCacheService.setJsonWithTtlMode|setJsonWithTtlMode}
 */
function setNestedTableById(id, table) {
  const key = `${config.DOMAIN_TEST}:users:${id}:nestedTable`
  const ttl = Number(config.TTL)
  return redisCacheService.setJsonWithTtlMode(key, table, ttl)
}

module.exports = {
  getAllIds,
  getFilteredIds,
  getId,
  getUsersByIds,
  getFilteredUsersByIds,
  overwriteIds,
  setUsers,
  saveUserIdsToSet,
  saveFilteredUsersCache,
  getIntersectionIdOfSets,
  getIdsFromCache,
  getNestedTableById,
  setNestedTableById,
}
