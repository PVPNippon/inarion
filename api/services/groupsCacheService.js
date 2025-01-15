const cacheService = require('./cacheService.js')

/**
 * Retrieves the ID of a group by its email address from the cache.
 * 
 * @param {string} email - The email address of the group to retrieve the ID for.
 * @returns {Promise<string|null>} A Promise object which resolves to:
 *   - the group ID corresponding to `email` if it is found in the cache
 *   - `null` if the group ID corresponding to `email` is not found in the cache.
 * @see {@link cacheService.getHashValues|getHashValues}
 */
function getId(email) {
  // TODO (r.hidaka): VALIDATION: `email` should be a string in an email address format

  const key = `${process.env.DOMAIN}:groups:id`
  return cacheService.getHashValues(key, email)
}

/**
 * Retrieves an array of the IDs of groups by their email addresses from the cache.
 *
 * This function queries the cache to obtain the group IDs for each email address in the provided array.
 * If a group email does not have a corresponding ID in the cache, the resulting array will contain null for that email.
 *
 * @param {Array<string>} emails - An array of group email addresses to retrieve the IDs for.
 * @returns {Promise<Array<string|null>>} A Promise object which resolves to an array of group IDs (let's call it `ids`).
 *   The length of `ids` matches the length of `emails`.
 *   So if `emails` is an empty array ([]), `ids` will also be empty.
 *   If `emails` is not empty, for each `0 <= i < emails.length`, `ids[i]` is:
 *   - The group ID corresponding to `emails[i]` if it is found in the cache.
 *   - `null` if the group ID corresponding to `emails[i]` is not found in the cache.
 *   
 * @see {@link cacheService.getHashValues|getHashValues}
 */
function getIds(emails) {
  // TODO (r.hidaka): VALIDATION: `emails` should be an array of strings in an email address format

  const key = `${process.env.DOMAIN}:groups:id`
  return cacheService.getHashValues(key, emails)
}

/**
 * Retrieves an array of all unique group IDs stored in the cache.
 *
 * This function queries the cache to obtain all group IDs, removing any duplicates and negative cache entries.
 * If `requiresAllGroupsListedBefore` is true, the function checks whether the cache contains all groups previously listed.
 * 
 * @param {boolean} [requiresAllGroupsListedBefore=false] - Indicates whether to return null if not all groups were listed before.
 *   // TODO (r.hidaka): Come up with a better name for this parameter
 * @returns {Promise<Array<string>|null>} A Promise object that resolves to:
 *   - An array of unique group IDs in the cache.
 *     It is empty ([]) if and only if all groups were listed before and only negative cache entries are in the cache.
 *   - `null` if (A) the cache is empty,
 *     or (B) `requiresAllGroupsListedBefore` is true and all groups were not listed before,
 *     or (C) all groups were not listed before and only negative cache entries are in the cache.
 * @see {@link cacheService.getHash|getHash}
 */
async function getAllIds(requiresAllGroupsListedBefore = false) {
  const key = `${process.env.DOMAIN}:groups:id`
  const emailsToIdsObj = await cacheService.getHash(key)

  // Return null if the cache is empty
  if (emailsToIdsObj === null) {
    return null
  }

  // The cached hash has a field 'ALL_GROUPS_LISTED' if and only if all groups were listed before by calling groupsService.listGroups()
  // The name 'ALL_GROUPS_LISTED' is temporary and may be changed
  const allGroupsListedBefore = 'ALL_GROUPS_LISTED' in emailsToIdsObj

  // If `requiresAllGroupsListedBefore` is true and all groups were not listed before, return null
  if (allGroupsListedBefore) {
    delete emailsToIdsObj['ALL_GROUPS_LISTED']
  } else if (requiresAllGroupsListedBefore) {
    return null
  }

  // Remove duplicates
  const uniqueIdsSet = new Set(Object.values(emailsToIdsObj))

  // Remove negative cache entries
  // The name 'NEGATIVE_CACHE' is temporary and may be changed
  uniqueIdsSet.delete('NEGATIVE_CACHE')

  // If all groups were listed before and only negative cache entries are in the cache, it means there is no group in the organization, so return []
  // If all groups were not listed before and only negative cache entries are in the cache, it means no actual cache exists, so return null
  if (uniqueIdsSet.size === 0) {
    return hasAllGroups ? [] : null
  }

  return [...uniqueIdsSet]
}

/**
 * Stores the mapping of group email to group ID in the cache in the form of a hash.
 * 
 * If the hash with the key `<DOMAIN>:groups:id` does not exist, it is newly created and a TTL is set to it.
 * If the hash with the key already exists, it is updated, but the existing TTL of the key remains the same.
 * 
 * @param {Object.<string, string>} emailsToIdsObj - Mapping of group email to group ID.
 *   It is expected to be in the following format:
 *   ```
 *   {
 *     groupEmail_1: 'groupId_1',
 *     groupEmail_2: 'groupId_2',
 *     ...,
 *     groupEmail_N: 'groupId_N'
 *   }
 *   ```
 *   If the hash with the key `<DOMAIN>:groups:id` does not exist, a new hash of this object is associated with the key.
 *   If the hash with the key already exists, the entry `groupEmail_i: 'groupId_i'` (i = 1, 2, ..., N) is added to the hash
 *   (if the hash has `groupEmail_i` as a field, the value of it is changed to `groupId_i`).
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 2.
 *   - The first element of the array is a number of fields which were newly added to the hash (so the range is from 0 to N inclusive).
 *   - The second element is `true` if the key does not exist, or `false` if the key already exists.
 * @throws {Error} - The returned Promise object resolves to an error if `emailsToIdsObj` is not an object or is empty ({}).
 * @see {@link cacheService.setHash|setHash}
 */
function setIds(emailsToIdsObj) {
  const key = `${process.env.DOMAIN}:groups:id`
  const ttl = Number(process.env.TTL)
  return cacheService.setHash(key, emailsToIdsObj, ttl, 'NX')
}

/**
 * Overwrites the mapping of group email to group ID in the cache in the form of a hash.
 * 
 * This function removes the key `<DOMAIN>:groups:id` first (if it exists in the cache),
 * and then creates a new mapping with the key and sets a TTL to it.
 * 
 * @param {Object.<string, string>} emailsToIdsObj - Mapping of group email to group ID.
 *   It is expected to be in the following format:
 *   ```
 *   {
 *     groupEmail_1: 'groupId_1',
 *     groupEmail_2: 'groupId_2',
 *     ...,
 *     groupEmail_N: 'groupId_N'
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
  const key = `${process.env.DOMAIN}:groups:id`
  const ttl = Number(process.env.TTL)
  return cacheService.overwriteHash(key, emailsToIdsObj, ttl)
}

/**
 * Retrieves a {@link https://developers.google.com/admin-sdk/directory/reference/rest/v1/groups#resource:-group|group instance} by its ID from the cache.
 * 
 * @param {string} groupId - The ID of the group to retrieve.
 * @returns {Promise<Object|null>} A Promise object which resolves to the group instance if found, or null if not found.
 * @see {@link cacheService.getJsons|getJsons}
 */
function getGroupById(groupId) {
  // TODO (r.hidaka): VALIDATION: `groupId` should be a non-empty string.
  const key = `${process.env.DOMAIN}:groups:${groupId}:info`
  return cacheService.getJsons(key)
}

/**
 * Retrieves multiple {@link https://developers.google.com/admin-sdk/directory/reference/rest/v1/groups#resource:-group|group instances} by their IDs from the cache.
 *
 * This function takes an array of group IDs and returns an array of corresponding groups.
 * If a group which has an ID in the provided IDs array is not found in the cache, the corresponding element in the returned array is `null`.
 *
 * @param {Array<string>} groupIds - The IDs of the groups to retrieve.
 * @returns {Promise<Array<Object|null>>} A Promise object which resolves to an array of group instances (let's call it `groups`).
 *   The length of `groups` is the same as the length of `groupIds`.
 *   So if `groupIds` is an empty array ([]), the `groups` is also empty.
 *   If `groupIds` is not empty, for each `0 <= i < groupIds.length`, `groups[i]` is:
 *   - The group instance which has `groupIds[i]` as its group ID if it is found in the cache
 *   - `null` if no group instance which has `groupIds[i]` as its group ID is found in the cache
 * @see {@link cacheService.getJsons|getJsons}
 */
function getGroupsByIds(groupIds) {
  // TODO (r.hidaka): VALIDATION: groupIds should be an array of non-empty strings.
  const keys = groupIds.map(groupId => `${process.env.DOMAIN}:groups:${groupId}:info`)
  return cacheService.getJsons(keys)
}

/**
 * Retrieves a {@link https://developers.google.com/admin-sdk/directory/reference/rest/v1/groups#resource:-group|group instance} by its email address from the cache.
 * 
 * @param {string} email - The email address of the group to retrieve.
 * @returns {Promise<Object|null>} A Promise object which resolves to:
 *   - The group instance if the ID corresponding to `email` is found in the cache and it is not 'NEGATIVE_CACHE', 
 *     and the instance of the group which has the ID is found in cache.
 *   - `null` if the ID corresponding to `email` is not found in the cache,
 *     or the ID is found in the cache but the instance of the group which has the ID is not found in cache.
 *   - An empty object ({}) if the ID corresponding to `email` is found in the cache, but it is 'NEGATIVE_CACHE'.
 *     // TODO (r.hidaka): Consider throwing an error instead in this case
 * @see {@link getId}, {@link getGroupById}
 */
async function getGroup(email) {
  // TODO (r.hidaka): VALIDATION: `email` should be a string in an email address format

  // Fetch the group ID using the group email
  const id = await getId(email)

  // Return null if the group ID is not found in the cache
  if (id === null) {
    return null
  }

  // Return an empty object if the ID corresponding to `email` is found in the cache, but it is 'NEGATIVE_CACHE'
  // The name 'NEGATIVE_CACHE' is temporary and may be changed
  // TODO (r.hidaka): Consider throwing an error instead
  if (id === 'NEGATIVE_CACHE') {
    return {}
  }

  // Fetch and return the group instance using the group ID
  const group = await getGroupById(id)

  return group
}

/**
 * Retrieves an array of {@link https://developers.google.com/admin-sdk/directory/reference/rest/v1/groups#resource:-group|group instances}
 * by their email addresses from the cache.
 * 
 * @param {Array<string>} emails - An array of email addresses of the groups to retrieve.
 * @returns {Promise<Array<Object|null>>} A Promise object which resolves to an array (let's call it `groups`) whose length is the same as that of `emails`.
 *   So if `emails` is empty ([]), `groups` is also empty.
 *   If `emails` is not empty, for each `0 <= i < emails.length`, `groups[i]` is:
 *   - The group instance if the ID corresponding to `emails[i]` is found in the cache and it is not 'NEGATIVE_CACHE', 
 *     and the instance of the group which has the ID is also found in cache.
 *   - `null` if the ID corresponding to `emails[i]` is not found in the cache,
 *     or the ID is found in the cache but the instance of the group which has the ID is not found in cache.
 *   - An empty object ({}) if the ID corresponding to `emails[i]` is found in the cache, but it is 'NEGATIVE_CACHE'.
 *     // TODO (r.hidaka): Consider throwing an error instead in this case
 * @see {@link getIds}, {@link getGroupsByIds}
 */
async function getGroups(emails) {
  // TODO (r.hidaka): VALIDATION: `emails` should be an array of strings in an email address format

  const rawIds = await getIds(emails)

  // `rawIds` may contain `null` or 'NEGATIVE_CACHE', so remove them before retrieving group instances from the cache
  // The name 'NEGATIVE_CACHE' is temporary and may be changed
  const ids = rawIds.filter(rawId => rawId !== null && rawId !== 'NEGATIVE_CACHE')

  // This array may contain `null` if a group ID in `ids` does not have a corresponding group instance in the cache
  // But that case should not happen because a group ID is stored in the cache along with its corresponding group instance
  const rawGroups = await getGroupsByIds(ids)

  let idx = 0
  const groups = rawIds.map(rawId => {
    if (rawId ===  null) {
      return null
    }

    // TODO (r.hidaka): Consider throwing an error instead
    if (rawId === 'NEGATIVE_CACHE') {
      return {}
    }

    return rawGroups[idx++]
  })

  return groups
}

/**
 * Retrieves an array of all {@link https://developers.google.com/admin-sdk/directory/reference/rest/v1/groups#resource:-group|group instances} stored in the cache.
 *
 * If `requiresAllGroupsListedBefore` is true, the function checks whether the cache contains all groups previously listed.
 * 
 * @param {boolean} [requiresAllGroupsListedBefore=false] - Indicates whether to return null if not all groups were listed before.
 *   // TODO (r.hidaka): Come up with a better name for this parameter
 * @returns {Promise<Array<string>|null>} A Promise object that resolves to:
 *   - An array of all group instances in the cache.
 *     It is empty ([]) if all groups were listed before and only negative cache entries are in the cache,
 *     or all group IDs in the cache do not have corresponding group instances in the cache.
 *     // The latter case should not happen because a group ID is stored in the cache along with its corresponding group instance
 *   - `null` if and only if `getAllGroupIds(requiresAllGroupsListedBefore)` resolves to null, that is,
 *     if (A) no group IDs are in the cache,
 *     or (B) `requiresAllGroupsListedBefore` is true and all groups were not listed before,
 *     or (C) all groups were not listed before and only negative cache entries are in the cache.
 * @see {@link getAllIds}, {@link getGroupsByIds}
 */
async function getAllGroups(requiresAllGroupsListedBefore = false) {
  const ids = await getAllIds(requiresAllGroupsListedBefore)

  if (ids === null) {
    return null
  }

  const rawGroups = await getGroupsByIds(ids)

  // If ids[i] (0 <= i < ids.length) does not have a corresponding group instance in the cache, rawGroups[i] will be null
  // But that case should not happen because a group ID is stored in the cache along with its corresponding group instance
  // Remove nulls from rawGroups just in case anyway
  const groups = rawGroups.filter(rawGroup => rawGroup !== null)

  return groups
}

/**
 * Stores a {@link https://developers.google.com/admin-sdk/directory/reference/rest/v1/groups#resource:-group|group instance} in the cache.
 * 
 * The group instance is stored with a key of `<DOMAIN>:groups:<id>:info` and a TTL where `<id>` is the group ID.
 * An old group instance with the same key and an old TTL set to it will be overwritten.
 * 
 * @param {Object} group - A group instance to store in the cache.
 * @returns {Promise<Array<string|boolean>} A Promise object which resolves to an array whose length is 2.
 *   - The first element of the array is a string 'OK'.
 *   - The second element is `true` (the meaning of this value is that the TTL was set to the key).
 * @see {@link cacheService.setJson|setJson}
 */
function setGroup(group) {
  const id = group.id
  const key = `${process.env.DOMAIN}:groups:${id}:info`
  const ttl = Number(process.env.TTL)
  return cacheService.setJson(key, group, ttl)
}

/**
 * Stores multiple {@link https://developers.google.com/admin-sdk/directory/reference/rest/v1/groups#resource:-group|group instances} in the cache.
 * 
 * Each group instance is stored with a key of `<DOMAIN>:groups:<id>:info` and a TTL where `<id>` is the group ID.
 * An old group instance with the same key and an old TTL set to it will be overwritten.
 * 
 * @param {Object} groups - An array of group instances to store in the cache.
 * @returns {Promise<Array<string|boolean>} A Promise object which resolves to an array whose length is `N+1`, where `N` is the length of `groups`.
 *   - The first element of the array is a string 'OK'.
 *   - The `i+2`-th element (`0 <= i < N`) is `true` (the meaning of this value is that the TTL was set to the key of `groups[i]`).
 * @throws {Error} The returned Promise object resolves to an error if `groups` is empty ([]).
 *   // TODO (r.hidaka): Consider changing the behavior in this case
 * @see {@link cacheService.setJsons|setJsons}
 */
function setGroups(groups) {
  const idsToGroupsObj = {}

  groups.forEach(group => {
    const id = group.id
    const key = `${process.env.DOMAIN}:groups:${id}:info`
    idsToGroupsObj[key] = group
  })

  const ttl = Number(process.env.TTL)

  return cacheService.setJsons(idsToGroupsObj, ttl)
}

/**
 * Retrieves an array of members of the group with the given group ID from the cache.
 * 
 * @param {string} id - The ID of the group to retrieve the members of.
 * @returns {Promise<Array<Object>|null>} A Promise object which resolves to an array of members of the group if found in the cache,
 *   or null if not found.
 * @see {@link cacheService.getHash|getHash}
 */
async function getMembersById(id) {
  const key = `${process.env.DOMAIN}:groups:${id}:members`

  const rawMembersObj = await cacheService.getHash(key)

  if (rawMembersObj === null) {
    return null
  }

  delete rawMembersObj['membersCount']

  const members = Object.values(rawMembersObj).map(rawMember => JSON.parse(rawMember))

  return members
}

/**
 * Retrieves an array of members of the group with the given email address from the cache.
 * 
 * @param {string} email - The email address of the group to retrieve the members of.
 * @returns {Promise<Array<Object>|null>} A Promise object which resolves to:
 *   - An array of members of the group if found in the cache.
 *     It is empty ([]) if either the group has no members or the group ID corresponding to `email` is 'NEGATIVE_CACHE'.
 *   - `null` if (A) the group ID corresponding to `email` is not found in the cache,
 *     or (B) the group ID is found in the cache but the members of the group which has the ID is not found in cache.
 * @see {@link getId}, {@link getMembersById}
 */
async function getMembers(email) {
  // TODO (r.hidaka): VALIDATION: `email` should be a string in an email address format

  const id = await getId(email)

  if (id === null) {
    return null
  }

  if (id === 'NEGATIVE_CACHE') {
    return []
  }

  const members = await getMembersById(id)

  return members
}

// Will not use this. Will use overwriteMembersById
/**
 * Stores the members of a group in the cache in the form of a hash.
 * 
 * The key is `<DOMAIN>:groups:<id>:members` where `<id>` is the group ID, and the value is an object whose fields (properties) are the IDs of the members
 * and the values are the corresponding group member instances serialized as a JSON string.
 * 
 * If the hash with the key `<DOMAIN>:groups:<id>:members` does not exist, it is newly created and a TTL is set to it.
 * If the hash with the key already exists, it is updated, but the existing TTL of the key remains the same.
 * 
 * @param {string} id - The ID of the group whose members are to be stored.
 * @param {Array<Object>} members - The members of the group.
 *   If the hash with the key `<DOMAIN>:groups:<id>:members` does not exist,
 *   a new hash of the following object is associated with the key (`N = members.length`):
 *   ```
 *   {
 *     membersCount: `${members.length}`,
 *     members[0].id: JSON.stringify(members[0]),
 *     members[1].id: JSON.stringify(members[1]),
 *     ...,
 *     members[N-1].id: JSON.stringify(members[N-1])
 *   }
 *   ```
 *   If the hash with the key already exists, the entry `members[i].id: JSON.stringify(members[i])` (i = 0, 1, ..., N-1) is added to the hash
 *   (if the hash has `members[i].id` as a field, the value of it is changed to `JSON.stringify(members[i])`).
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 2.
 *   - The first element of the array is a number of fields which were newly added to the hash (so the range is from `0` to `members.length+1` inclusive).
 *   - The second element is `true` if the TTL was set to the key, or `false` if the TTL was not set to the key for some reason (e.g. the key already existed and had a TTL).
 * @see {@link cacheService.setHash|setHash}
 */
function setMembersById(id, members) {
  const key = `${process.env.DOMAIN}:groups:${id}:members`

  // Without the `membersCount` field, the member information of a group with 0 members cannot be stored in the cache
  // as an empty object cannot be stored in the cache in the form of a hash
  // There may be a better solution to deal with a group with 0 members
  const idsToMembersObj = {
    'membersCount': `${members.length}`
  }
  members.forEach(member => idsToMembersObj[member.id] = JSON.stringify(member))

  const ttl = Number(process.env.TTL)

  return cacheService.setHash(key, idsToMembersObj, ttl, 'NX')
}

/**
 * Overwrites the members of a group in the cache in the form of a hash.
 * 
 * The key is `<DOMAIN>:groups:<id>:members` where `<id>` is the group ID, and the value is an object whose fields (properties) are the IDs of the members
 * and the values are the corresponding group member instances serialized as a JSON string.
 * 
 * This function removes the key `<DOMAIN>:groups:<id>:members` first (if it exists in the cache),
 * and then creates a new hash with the key and sets a TTL to it.
 * 
 * @param {string} id - The ID of the group whose members are to be stored.
 * @param {Array<Object>} members - The members of the group.
 *   The hash to be associated with the key `<DOMAIN>:groups:<id>:members` is the following object (`N = members.length`):
 *   ```
 *   {
 *     membersCount: `${members.length}`,
 *     members[0].id: JSON.stringify(members[0]),
 *     members[1].id: JSON.stringify(members[1]),
 *     ...,
 *     members[N-1].id: JSON.stringify(members[N-1])
 *   }
 *   ```
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 3.
 *   - The first element of the array is `1` if the key existed and was removed, or `0` if the key did not exist.
 *   - The second element is a number of fields which were newly added to the hash (so it should be `N+1`).
 *   - The third element is `true` (the meaning of this value is that the TTL was set to the key).
 * @see {@link cacheService.overwriteHash|overwriteHash}
 */
function overwriteMembersById(id, members) {
  const key = `${process.env.DOMAIN}:groups:${id}:members`

  // Without the `membersCount` field, the member information of a group with 0 members cannot be stored in the cache
  // as an empty object cannot be stored in the cache in the form of a hash
  // There may be a better solution to deal with a group with 0 members
  const idsToMembersObj = {
    'membersCount': `${members.length}`
  }
  members.forEach(member => idsToMembersObj[member.id] = JSON.stringify(member))

  const ttl = Number(process.env.TTL)

  return cacheService.overwriteHash(key, idsToMembersObj, ttl)
}

function setMembers(email, members) {}

function overwriteMembers(email, members) {}

/**
 * Retrieves an array of descendants (all direct and indirect members) of the group with the given group ID from the cache.
 * 
 * @param {string} id - The ID of the group to retrieve the descendants of.
 * @returns {Promise<Array<Object>|null>} A Promise object which resolves to an array of descendants of the group if found in the cache,
 *   or null if not found.
 * @see {@link cacheService.getHash|getHash}
 */
async function getDescendantsById(id) {
  const key = `${process.env.DOMAIN}:groups:${id}:descendants`

  const rawDescendantsObj = await cacheService.getHash(key)

  if (rawDescendantsObj === null) {
    return null
  }

  delete rawDescendantsObj['descendantsCount']

  const descendants = Object.values(rawDescendantsObj).map(rawDescendant => JSON.parse(rawDescendant))

  return descendants
}

/**
 * Retrieves an array of descendants (all direct and indirect members) of the group with the given email address from the cache.
 * 
 * @param {string} email - The email address of the group to retrieve the descendants of.
 * @returns {Promise<Array<Object>|null>} A Promise object which resolves to:
 *   - An array of descendants of the group if found in the cache.
 *     It is empty ([]) if either the group has no descendants or the group ID corresponding to `email` is 'NEGATIVE_CACHE'.
 *   - `null` if (A) the group ID corresponding to `email` is not found in the cache,
 *     or (B) the group ID is found in the cache but the descendants of the group which has the ID is not found in cache.
 * @see {@link getId}, {@link getDescendantsById}
 */
async function getDescendants(email) {
  // TODO (r.hidaka): VALIDATION: `email` should be a string in an email address format

  const id = await getId(email)

  if (id === null) {
    return null
  }

  if (id === 'NEGATIVE_CACHE') {
    return []
  }

  const descendants = await getDescendantsById(id)

  return descendants
}

// Will not use this. Will use overwriteDescendantsById
/**
 * Stores the descendants (all direct and indirect members) of a group in the cache in the form of a hash.
 * 
 * The key is `<DOMAIN>:groups:<id>:descendants` where `<id>` is the group ID, and the value is an object whose fields (properties) are the IDs of the descendants
 * and the values are the corresponding group descendant instances serialized as a JSON string.
 * 
 * If the hash with the key `<DOMAIN>:groups:<id>:descendants` does not exist, it is newly created and a TTL is set to it.
 * If the hash with the key already exists, it is updated, but the existing TTL of the key remains the same.
 * 
 * @param {string} id - The ID of the group whose descendants are to be stored.
 * @param {Array<Object>} descendants - The descendants of the group.
 *   If the hash with the key `<DOMAIN>:groups:<id>:descendants` does not exist,
 *   a new hash of the following object is associated with the key (`N = descendants.length`):
 *   ```
 *   {
 *     descendantsCount: `${descendants.length}`,
 *     descendants[0].id: JSON.stringify(descendants[0]),
 *     descendants[1].id: JSON.stringify(descendants[1]),
 *     ...,
 *     descendants[N-1].id: JSON.stringify(descendants[N-1])
 *   }
 *   ```
 *   If the hash with the key already exists, the entry `descendants[i].id: JSON.stringify(descendants[i])` (i = 0, 1, ..., N-1) is added to the hash
 *   (if the hash has `descendants[i].id` as a field, the value of it is changed to `JSON.stringify(descendants[i])`).
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 2.
 *   - The first element of the array is a number of fields which were newly added to the hash (so the range is from `0` to `descendants.length+1` inclusive).
 *   - The second element is `true` if the TTL was set to the key, or `false` if the TTL was not set to the key for some reason (e.g. the key already existed and had a TTL).
 * @see {@link cacheService.setHash|setHash}
 */
function setDescendantsById(id, descendants) {
  const key = `${process.env.DOMAIN}:groups:${id}:descendants`

  const idsToDescendantsObj = {
    'descendantsCount': `${descendants.length}`
  }
  descendants.forEach(descendant => idsToDescendantsObj[descendant.id] = JSON.stringify(descendant))

  const ttl = Number(process.env.TTL)

  return cacheService.setHash(key, idsToDescendantsObj, ttl, 'NX')
}

/**
 * Overwrites the descendants (all direct and indirect members) of a group in the cache in the form of a hash.
 * 
 * The key is `<DOMAIN>:groups:<id>:descendants` where `<id>` is the group ID, and the value is an object whose fields (properties) are the IDs of the descendants
 * and the values are the corresponding group descendant instances serialized as a JSON string.
 * 
 * This function removes the key `<DOMAIN>:groups:<id>:descendants` first (if it exists in the cache),
 * and then creates a new hash with the key and sets a TTL to it.
 * 
 * @param {string} id - The ID of the group whose descendants are to be stored.
 * @param {Array<Object>} descendants - The descendants of the group.
 *   If the hash with the key `<DOMAIN>:groups:<id>:descendants` does not exist,
 *   The hash to be associated with the key `<DOMAIN>:groups:<id>:descendants` is the following object (`N = descendants.length`):
 *   ```
 *   {
 *     descendantsCount: `${descendants.length}`,
 *     descendants[0].id: JSON.stringify(descendants[0]),
 *     descendants[1].id: JSON.stringify(descendants[1]),
 *     ...,
 *     descendants[N-1].id: JSON.stringify(descendants[N-1])
 *   }
 *   ```
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 3.
 *   - The first element of the array is `1` if the key existed and was removed, or `0` if the key did not exist.
 *   - The second element is a number of fields which were newly added to the hash (so it should be `N+1`).
 *   - The third element is `true` (the meaning of this value is that the TTL was set to the key).
 * @see {@link cacheService.overwriteHash|overwriteHash}
 */
function overwriteDescendantsById(id, descendants) {
  const key = `${process.env.DOMAIN}:groups:${id}:descendants`

  const idsToDescendantsObj = {
    'descendantsCount': `${descendants.length}`
  }
  descendants.forEach(descendant => idsToDescendantsObj[descendant.id] = JSON.stringify(descendant))

  const ttl = Number(process.env.TTL)

  return cacheService.overwriteHash(key, idsToDescendantsObj, ttl)
}

function setDescendants(email, descendants) {}

function overwriteDescendants(email, descendants) {}


function getParentsById(id) {

}

function getParents(email) {

}
function setParentsById(id, parents) {

}

function overwriteParentsById(id, parents) {

}

function setParents(email, parents) {}

function overwriteParents(email, parents) {}

/**
 * Retrieves the settings of the group with the given group ID from the cache.
 * 
 * @param {string} id - The ID of the group to retrieve the settings of.
 * @returns {Promise<Object|null>} A Promise object which resolves to the settings of the group if found in the cache,
 *   or null if not found.
 * @see {@link cacheService.getHash|getHash}
 */
function getSettingsById(id) {
  const key = `${process.env.DOMAIN}:groups:${id}:settings`
  return cacheService.getHash(key)
}

/**
 * Retrieves the settings of a group by its email address from the cache.
 * 
 * @param {string} email - The email address of the group to retrieve the settings for.
 * @returns {Promise<Object|null>} A Promise object which resolves to:
 *   - The settings of the group if the ID corresponding to `email` is found in the cache, and it is not 'NEGATIVE_CACHE',
 *     and the settings of the group which has the ID are also found in the cache.
 *     It is empty ({}) if and only if the ID corresponding to `email` is 'NEGATIVE_CACHE'.
 *   - `null` if (A) the group ID corresponding to `email` is not found in the cache,
 *     or (B) the group ID is found in the cache and it is not 'NEGATIVE_CACHE', but the settings of the group which has the ID is not found in cache.
 * @see {@link getId}, {@link getSettingsById}
 */
async function getSettings(email) {
  // TODO (r.hidaka): VALIDATION: `email` should be a string in an email address format

  const id = await getId(email)

  if (id === null) {
    return null
  }

  if (id === 'NEGATIVE_CACHE') {
    return {}
  }

  const settings = await getSettingsById(id)

  return settings
}

/**
 * Stores the settings of a group in the cache in the form of a hash.
 * 
 * The key is `<DOMAIN>:groups:<id>:settings` where `<id>` is the group ID, and the value is
 * the {@link https://developers.google.com/admin-sdk/groups-settings/v1/reference/groups#resource-representations|settings object}.
 * 
 * If the hash with the key `<DOMAIN>:groups:<id>:settings` does not exist, it is newly created.
 * If the hash with the key already exists, it is updated.
 * In both cases, a new TTL is set to the key.
 * 
 * @param {string} id - The ID of the group whose settings are to be stored.
 * @param {Object} settings - The settings of the group.
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 2.
 *   - The first element of the array is a number of fields which were newly added to the hash
 *     (so the range is from `0` to `N` inclusive, where `N` is the number of fields in the settings).
 *   - The second element is `true` (the meaning of this value is that the TTL was set to the key).
 * @throws {Error} The returned Promise object resolves to an error if `settings` is not an object or is empty ({}).
 *   // TODO (r.hidaka): Consider adding a validation for `settings`, or changing the behavior in this case
 * @see {@link cacheService.setHash|setHash}
 */
function setSettingsById(id, settings) {
  const key = `${process.env.DOMAIN}:groups:${id}:settings`
  const ttl = Number(process.env.TTL)
  return cacheService.setHash(key, settings, ttl)
}

// Will not use this. Will use setSettingsById instead.
/**
 * Overwrites the settings of a group in the cache in the form of a hash.
 * 
 * The key is `<DOMAIN>:groups:<id>:settings` where `<id>` is the group ID, and the value is
 * the {@link https://developers.google.com/admin-sdk/groups-settings/v1/reference/groups#resource-representations|settings object}.
 * 
 * This function removes the key `<DOMAIN>:groups:<id>:settings` first (if it exists in the cache),
 * and then creates a new hash with the key and sets a TTL to it.
 * 
 * @param {string} id - The ID of the group whose settings are to be stored.
 * @param {Object} settings - The settings of the group.
 * @returns {Promise<Array<number|boolean>>} A Promise object which resolves to an array whose length is 3.
 *   - The first element of the array is `1` if the key existed and was removed, or `0` if the key did not exist.
 *   - The second element is a number of fields which were newly added to the hash (so it should be the number of fields in `settings`).
 *   - The third element is `true` (the meaning of this value is that the TTL was set to the key).
 * @throws {Error} The returned Promise object resolves to an error if `settings` is not an object or is empty ({}).
 *   // TODO (r.hidaka): Consider adding a validation for `settings`, or changing the behavior in this case
 * @see {@link cacheService.overwriteHash|overwriteHash}
 */
function overwriteSettingsById(id, settings) {
  const key = `${process.env.DOMAIN}:groups:${id}:settings`
  const ttl = Number(process.env.TTL)
  return cacheService.overwriteHash(key, settings, ttl)
}

function setSettings(email, settings) {}

function overwriteSettings(email, settings) {}

module.exports = {
  /* Group IDs */
  getId,
  getIds,
  getAllIds,
  setIds,
  overwriteIds,
  
  /* Group Instances */
  getGroupById,
  getGroupsByIds,
  // getGroup,
  // getGroups,
  // getAllGroups,
  setGroup,
  setGroups,

  /* Group Members */
  getMembersById,
  // getMembers,
  overwriteMembersById,

  /* Group Descendants */
  getDescendantsById,
  getDescendants,
  overwriteDescendantsById,
  
  /* Group Settings */
  getSettingsById,
  // getSettings,
  setSettingsById,
}
