const groupsCacheService = require('../services/groupsCacheService.js')
const usersCacheService = require('../services/usersCacheService.js')
const groupsUtilityFunctions = require('../utility/groupsUtilityFunctions.js')
const groupsService = require('../services/groupsService.js')

/**
 * Middleware to retrieve all group instances from the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function retrieveAllGroups(req, res, next) {
  try {
    const allGroupIds = await groupsCacheService.getAllIds(true)

    // Either all groups have not been listed before or no group IDs are in the cache
    if (allGroupIds === null) {
      return next()
    }

    const rawGroups = await groupsCacheService.getGroupsByIds(allGroupIds)

    // There are no groups in the org
    if (rawGroups.length === 0) {
      res.locals.data = []
      res.locals.cached = true
      return next()
    }

    const groups = rawGroups.filter(group => group !== null)

    // No group instances are in the cache
    if (groups.length === 0) {
      return next()
    }

    groupsUtilityFunctions.sortGroupsByEmail(groups)
    res.locals.data = groups
    res.locals.cached = true
  } catch (error) {
    console.log('Error retrieving all group instances from the cache:', error)
  }
  next()
}

/**
 * Middleware to store all group instances in the cache.
 * 
 * Note that this function removes all negative caches.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function storeAllGroups(req, res, next) {
  next()

  if (res.locals.cached) {
    return
  }

  if (res.locals.statusCode === 500) {
    return
  }

  try {
    const groups = res.locals.data

    const emailsToIdsObj = groupsUtilityFunctions.getGroupEmailsToIdsObj(groups)
    emailsToIdsObj['ALL_GROUPS_LISTED'] = 'ALL_GROUPS_LISTED'

    // There are no groups in the org
    if (groups.length === 0) {
      const result = await groupsCacheService.overwriteIds(emailsToIdsObj)
      console.log('No groups in the org:', result)
      return
    }

    const result = await Promise.allSettled([
      groupsCacheService.overwriteIds(emailsToIdsObj),
      groupsCacheService.setGroups(groups)
    ])
    console.log('Stored all group ids and instances in the cache:', result)
  } catch (error) {
    console.log('Error storing all group ids and instances in the cache:', error)
  }
}

/**
 * Middleware to retrieve the instance of a group from the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function retrieveGroup(req, res, next) {
  const { groupEmail } = req.params

  try {
    const groupId = await groupsCacheService.getId(groupEmail)
    
    // No group ID corresponding to the group email is in the cache
    if (groupId === null) {
      return next()
    }

    // The group ID corresponding to the group email is a negative cache
    if (groupId === 'NEGATIVE_CACHE') {
      res.locals.statusCode = 404
      res.locals.data = { message: 'Group does not exist or you do not have necessary permissions to see this group' }
      res.locals.cached = true
      return next()
    }

    const group = await groupsCacheService.getGroupById(groupId)

    // No group instance corresponding to the retrieved group ID is in the cache
    if (group === null) {
      return next()
    }

    res.locals.data = group
    res.locals.cached = true
  } catch (error) {
    console.log(`Error retrieving the instance of a group "${groupEmail}" from the cache:`, error)
  }
  next()
}

/**
 * Middleware to store a group instance in the cache.
 *
 * If the group is not found (404), this function stores negative cache in the cache.
 * If the group is found, this function stores the group's id and instance in the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function storeGroup(req, res, next) {
  // `groupEmail` should be retrieved before calling next() because req.params is cleared after calling next()
  // Ref: https://github.com/expressjs/express/issues/4298#issuecomment-656770286
  const { groupEmail } = req.params
  
  next()

  if (res.locals.cached) {
    return
  }

  if (res.locals.statusCode === 500) {
    return
  }

  // If the group which has `groupEmail` is not found, store negative cache in the cache
  if (res.locals.statusCode === 404) {
    try {
      const result = await groupsCacheService.setIds({ [groupEmail]: 'NEGATIVE_CACHE' })
      console.log('Stored negative cache in the cache:', result)
    } catch (error) {
      console.log('Error storing negative cache in the cache:', error)
    }
    return
  }

  try {
    const group = res.locals.data
    const emailsToIdsObj = groupsUtilityFunctions.getGroupEmailsToIdsObj(group)

    const result = await Promise.allSettled([
      groupsCacheService.setIds(emailsToIdsObj),
      groupsCacheService.setGroup(group)
    ])
    console.log('Stored the group\'s id and instance in the cache:', result)
  } catch (error) {
    console.log('Error storing the group\'s id and instance in the cache:', error)
  }
}

/**
 * Middleware to retrieve the members of a group from the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function retrieveMembers(req, res, next) {
  const { groupEmail } = req.params

  if (req.query.includeDerivedMembership) {
    res.locals.includeDerivedMembership = req.query.includeDerivedMembership.toLowerCase() === 'true'
  }

  let groupId = null

  try {
    groupId = await groupsCacheService.getId(groupEmail)
  } catch (error) {
    console.log(`Error retrieving the ID of a group "${groupEmail}" from the cache:`, error)
  }

  // The group ID is not in the cache or there is an error retrieving the group ID from the cache
  if (groupId === null) {
    return next()
  }
  
  if (groupId === 'NEGATIVE_CACHE') {
    res.locals.statusCode = 404
    res.locals.data = { message: 'Group does not exist or you do not have necessary permissions to see this group' }
    res.locals.cached = true
    return next()
  }

  let members = null

  try {
    if (res.locals.includeDerivedMembership) {
      members = await groupsCacheService.getDescendantsById(groupId)
    } else {
      members = await groupsCacheService.getMembersById(groupId)
    }
  } catch (error) {
    console.log(`Error retrieving members of a group "${groupEmail}" from the cache:`, error)
  }

  // The group members are not in the cache or there is an error retrieving the group members from the cache
  if (members === null) {
    res.locals.groupId = groupId
    return next()
  }

  res.locals.data = members
  res.locals.cached = true
  next()
}

/**
 * Middleware to store the members of a group in the cache.
 * 
 * If the group's ID is not in the cache, this function calls an API to fetch the group instance and
 * stores the group's ID and instance as well as its members in the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function storeMembers(req, res, next) {
  // `groupEmail` should be retrieved before calling next() because req.params is cleared after calling next()
  // Ref: https://github.com/expressjs/express/issues/4298#issuecomment-656770286
  const { groupEmail } = req.params

  next()

  if (res.locals.cached) {
    return
  }

  if (res.locals.statusCode === 500) {
    return
  }

  // If the group which has `groupEmail` cannot be fetched by the API (e.g. the group does not exist), store negative cache in the cache
  if (res.locals.statusCode === 404) {
    try {
      const result = await groupsCacheService.setIds({ [groupEmail]: 'NEGATIVE_CACHE' })
      console.log('Stored negative cache in the cache:', result)
    } catch (error) {
      console.log('Error storing negative cache in the cache:', error)
    }
    return
  }

  const members = res.locals.data
  const includeDerivedMembership = res.locals.includeDerivedMembership

  // If the group ID is in the cache, store the members with the ID in the cache
  const cachedGroupId = res.locals.groupId

  if (cachedGroupId) {
    try {
      const result = await includeDerivedMembership
        ? groupsCacheService.overwriteDescendantsById(cachedGroupId, members)
        : groupsCacheService.overwriteMembersById(cachedGroupId, members)
      
      console.log(`Stored ${includeDerivedMembership ? 'direct and indirect' : 'direct'} members in the cache:`, result)
    } catch (error) {
      console.log(`Error storing ${includeDerivedMembership ? 'direct and indirect' : 'direct'} members in the cache:`, error)
    }
    return
  }

  // If the group ID is not in the cache, get the group instance by the API
  // and store the group ID, instance, and members in the cache

  let group

  try {
    const { userEmail } = req.query
    group = await groupsService.getGroupByEmail({
      userEmail,
      groupEmail
    })
  } catch (error) {
    // Abort if the group instance cannot be fetched by the API
    console.log('Error fetching the group instance by the API:', error)
    return
  }

  try {
    const emailsToIdsObj = groupsUtilityFunctions.getGroupEmailsToIdsObj(group)
    const result = await Promise.allSettled([
      groupsCacheService.setIds(emailsToIdsObj),
      groupsCacheService.setGroup(group),
      includeDerivedMembership
        ? groupsCacheService.overwriteDescendantsById(group.id, members)
        : groupsCacheService.overwriteMembersById(group.id, members)
    ])
    console.log('Stored the group\'s id, instance and members in the cache:', result)
  } catch (error) {
    console.log('Error storing the group\'s id, instance and members in the cache:', error)
  }
}

/**
 * Middleware to retrieve the settings of a group from the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function retrieveSettings(req, res, next) {
  const { groupEmail } = req.params

  try {
    const groupId = await groupsCacheService.getId(groupEmail)
    
    if (groupId === null) {
      return next()
    }

    if (groupId === 'NEGATIVE_CACHE') {
      res.locals.statusCode = 404
      res.locals.data = { message: 'Group does not exist or you do not have necessary permissions to see this group' }
      res.locals.cached = true
      return next()
    }

    const settings = await groupsCacheService.getSettingsById(groupId)

    if (settings === null) {
      return next()
    }

    res.locals.data = settings
    res.locals.cached = true
  } catch (error) {
    console.log(`Error retrieving settings of a group "${groupEmail}" from the cache:`, error)
  }
  next()
}

/**
 * Middleware to store the settings of a group in the cache.
 * 
 * If the group's ID is not in the cache, this function calls an API to fetch the group instance and
 * stores the group's ID and instance as well as its settings in the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function storeSettings(req, res, next) {
  // `groupEmail` should be retrieved before calling next() because req.params is cleared after calling next()
  // Ref: https://github.com/expressjs/express/issues/4298#issuecomment-656770286
  const { groupEmail } = req.params

  next()

  if (res.locals.cached) {
    return
  }

  if (res.locals.statusCode === 400 || res.locals.statusCode === 500) {
    return
  }

  // If the group which has `groupEmail` cannot be fetched by the API (e.g. the group does not exist), store negative cache in the cache
  if (res.locals.statusCode === 404) {
    try {
      const result = await groupsCacheService.setIds({ [groupEmail]: 'NEGATIVE_CACHE' })
      console.log('Stored negative cache in the cache:', result)
    } catch (error) {
      console.log('Error storing negative cache in the cache:', error)
    }
    return
  }

  const settings = res.locals.data

  // If the group ID is in the cache, store the settings with the ID in the cache

  let cachedGroupId

  try {
    cachedGroupId = await groupsCacheService.getId(groupEmail)
  } catch (error) {
    console.log('Error retrieving the group ID from the cache:', error)
    cachedGroupId = null
  }

  if (cachedGroupId !== null && cachedGroupId !== 'NEGATIVE_CACHE') {
    try {
      const result = await groupsCacheService.setSettingsById(cachedGroupId, settings)
      console.log('Stored settings in the cache:', result)
    } catch (error) {
      console.log('Error storing settings in the cache:', error)
    }
    return
  }

  // If the group ID is not in the cache, get the group instance by the API
  // and store the group ID, instance, and settings in the cache

  let group

  try {
    const { userEmail } = req.query
    group = await groupsService.getGroupByEmail({
      userEmail,
      groupEmail
    })
  } catch (error) {
    // Abort if the group instance cannot be fetched by the API
    console.log('Error fetching the group instance by the API:', error)
    return
  }

  try {
    const emailsToIdsObj = groupsUtilityFunctions.getGroupEmailsToIdsObj(group)
    const result = await Promise.allSettled([
      groupsCacheService.setIds(emailsToIdsObj),
      groupsCacheService.setGroup(group),
      groupsCacheService.setSettingsById(group.id, settings)
    ])
    console.log('Stored the group\'s id, instance and settings in the cache:', result)
  } catch (error) {
    console.log('Error storing the group\'s id, instance and settings in the cache:', error)
  }
}

/**
 * Middleware to retrieve a nested table from the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function retrieveNestedTable(req, res, next) {
  if (!req.query.type) {
    res.locals.statusCode = 400
    res.locals.data = { message: 'Type is required' }
    res.locals.cached = true
    return next()
  }

  const targetType = req.query.type.toLowerCase()

  if (targetType !== 'group' && targetType !== 'user') {
    res.locals.statusCode = 400
    res.locals.data = { message: 'Type must be either group or user' }
    res.locals.cached = true
    return next()
  }

  res.locals.targetType = targetType

  const { targetEmail } = req.params

  try {
    const targetId = await ((targetType === 'group') ? groupsCacheService.getId(targetEmail) : usersCacheService.getId(targetEmail))
    
    if (targetId === null) {
      return next()
    }

    if (targetId === 'NEGATIVE_CACHE') {
      res.locals.statusCode = 404
      res.locals.data = {
        message: `${targetEmail} does not exist or you do not have necessary permissions to see ${targetEmail}`
      }
      res.locals.cached = true
      return next()
    }

    const nestedTable = await ((targetType === 'group') ? groupsCacheService.getNestedTableById(targetId) : usersCacheService.getNestedTableById(targetId))

    if (nestedTable === null) {
      return next()
    }

    res.locals.data = nestedTable
    res.locals.cached = true
  } catch (error) {
    console.log(`Error retrieving a nested table of ${targetEmail} from the cache:`, error)
  }
  next()
}

/**
 * Middleware to store the nested tables of a group or user in the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function storeNestedTables(req, res, next) {
  next()

  if (res.locals.cached) {
    return
  }

  if (res.locals.statusCode === 500) {
    return
  }

  const targetType = res.locals.targetType
  const tables = res.locals.tables

  try {
    let result

    if (targetType === 'group') {
      result = await groupsCacheService.setNestedTablesByIds(tables)
    } else {  // targetType === 'user'
      const id = res.locals.id
      const table = res.locals.data
      
      result = await Promise.allSettled([
        groupsCacheService.setNestedTablesByIds(tables),
        usersCacheService.setNestedTableById(id, table)
      ])
    }
    console.log('Stored the tables in the cache:', result)
  } catch (error) {
    console.log('Error storing the tables in the cache:', error)
  }
}

module.exports = {
  retrieveAllGroups,
  storeAllGroups,
  
  retrieveGroup,
  storeGroup,

  retrieveMembers,
  storeMembers,

  retrieveSettings,
  storeSettings,

  retrieveNestedTable,
  storeNestedTables,
}
