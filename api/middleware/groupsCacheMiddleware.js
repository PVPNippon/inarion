const groupsCacheService = require('../services/groupsCacheService.js')
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
  try {
    // TODO (r.hidaka): Change this to "const groupEmail = req.params.groupEmail"
    // after refactoring groupsController.getGroup and its route
    const { groupEmail } = req.body

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
  next()

  if (res.locals.cached) {
    return
  }

  // If the group which has `groupEmail` is not found, store negative cache in the cache
  if (res.locals.statusCode === 404) {
    try {
      // TODO (r.hidaka): Change this to "const groupEmail = req.params.groupEmail"
      // after refactoring groupsController.getGroup and its route
      const { groupEmail } = req.body
      
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
  try {
    // TODO (r.hidaka): Change this to "const groupEmail = req.params.groupEmail"
    // after refactoring groupsController.listDirectMembers and its route
    const { groupEmail } = req.body

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

    const members = await groupsCacheService.getMembersById(groupId)

    if (members === null) {
      return next()
    }

    res.locals.data = members
    res.locals.cached = true
  } catch (error) {
    console.log(`Error retrieving members of a group "${groupEmail}" from the cache:`, error)
  }
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
  next()

  if (res.locals.cached) {
    return
  }

  // TODO (r.hidaka): Change this to "const groupEmail = req.params.groupEmail"
  // after refactoring groupsController.listDirectMembers and its route
  const { groupEmail } = req.body

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

  // If the group ID is in the cache, store the members with the ID in the cache

  let cachedGroupId

  try {
    cachedGroupId = await groupsCacheService.getId(groupEmail)
  } catch (error) {
    console.log('Error retrieving the group ID from the cache:', error)
    cachedGroupId = null
  }

  if (cachedGroupId !== null && cachedGroupId !== 'NEGATIVE_CACHE') {
    try {
      const result = await groupsCacheService.overwriteMembersById(cachedGroupId, members)
      console.log('Stored members in the cache:', result)
    } catch (error) {
      console.log('Error storing members in the cache:', error)
    }
    return
  }

  // If the group ID is not in the cache, get the group instance by the API
  // and store the group ID, instance, and members in the cache

  let group

  try {
    // TODO (r.hidaka): Change this to "const userEmail = req.query.userEmail"
    // after refactoring groupsController.listDirectMembers
    const { userEmail } = req.body
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
      groupsCacheService.overwriteMembersById(group.id, members)
    ])
    console.log('Stored the group\'s id, instance and members in the cache:', result)
  } catch (error) {
    console.log('Error storing the group\'s id, instance and members in the cache:', error)
  }
}

/**
 * Middleware to retrieve the descendants (both direct and indirect members) of a group from the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function retrieveDescendants(req, res, next) {
  try {
    // TODO (r.hidaka): Change this to "const groupEmail = req.params.groupEmail"
    // after refactoring groupsController.listAllMembers and its route
    const { groupEmail } = req.body

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

    const descendants = await groupsCacheService.getDescendantsById(groupId)

    if (descendants === null) {
      return next()
    }

    res.locals.data = descendants
    res.locals.cached = true
  } catch (error) {
    console.log(`Error retrieving descendants of a group "${groupEmail}" from the cache:`, error)
  }
  next()
}

/**
 * Middleware to store the descendants (both direct and indirect members) of a group in the cache.
 * 
 * If the group's ID is not in the cache, this function calls an API to fetch the group instance and
 * stores the group's ID and instance as well as its descendants in the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function storeDescendants(req, res, next) {
  next()

  if (res.locals.cached) {
    return
  }

  // TODO (r.hidaka): Change this to "const groupEmail = req.params.groupEmail"
  // after refactoring groupsController.listAllMembers and its route
  const { groupEmail } = req.body

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

  const descendants = res.locals.data

  // If the group ID is in the cache, store the descendants with the ID in the cache

  let cachedGroupId

  try {
    cachedGroupId = await groupsCacheService.getId(groupEmail)
  } catch (error) {
    console.log('Error retrieving the group ID from the cache:', error)
    cachedGroupId = null
  }

  if (cachedGroupId !== null && cachedGroupId !== 'NEGATIVE_CACHE') {
    try {
      const result = await groupsCacheService.overwriteDescendantsById(cachedGroupId, descendants)
      console.log('Stored descendants in the cache:', result)
    } catch (error) {
      console.log('Error storing descendants in the cache:', error)
    }
    return
  }

  // If the group ID is not in the cache, get the group instance by the API
  // and store the group ID, instance, and descendants in the cache

  let group

  try {
    // TODO (r.hidaka): Change this to "const userEmail = req.query.userEmail"
    // after refactoring groupsController.listAllMembers
    const { userEmail } = req.body
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
      groupsCacheService.overwriteDescendantsById(group.id, descendants)
    ])
    console.log('Stored the group\'s id, instance and descendants in the cache:', result)
  } catch (error) {
    console.log('Error storing the group\'s id, instance and descendants in the cache:', error)
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
  try {
    // TODO (r.hidaka): Change this to "const groupEmail = req.params.groupEmail"
    // after creating a controller function which fetches group settings
    const { groupEmail } = req.body

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
  next()

  if (res.locals.cached) {
    return
  }

  // TODO (r.hidaka): Change this to "const groupEmail = req.params.groupEmail"
  // after creating a controller function which fetches group settings
  const { groupEmail } = req.body

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
    // TODO (r.hidaka): Change this to "const userEmail = req.query.userEmail"
    // after creating and refactoring controller functions which fetch groups' settings
    const { userEmail } = req.body
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

module.exports = {
  retrieveAllGroups,
  storeAllGroups,
  
  retrieveGroup,
  storeGroup,

  retrieveMembers,
  storeMembers,

  retrieveDescendants,
  storeDescendants,

  retrieveSettings,
  storeSettings,
}
