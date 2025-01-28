const usersCacheService = require('../services/usersCacheService.js')
const usersUtilityFunctions = require('../utility/usersUtilityFunctions.js')

/**
 * Middleware to retrieve all user instances from the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to store the list of users.
 * @param {Function} next - The next middleware function in the stack.
 *
 * This function attempts to retrieve all user IDs from the cache. If no IDs are found,
 * it passes control to the next middleware. It fetches user instances corresponding to
 * the IDs, filters out any null entries, and sorts the users by email before storing them
 * in `res.locals.data`. If the cache retrieval or processing fails, it logs the error.
 */
async function retrieveAllUsers(req, res, next) {
  try {
    const allUserIds = await usersCacheService.getAllIds(true)

    if (allUserIds === null) {
      return next()
    }

    const rawUsers = await usersCacheService.getUsersByIds(allUserIds)

    // allUsers は0にはならない想定
    if (rawUsers.length === 0) {
      res.locals.data = []
      res.locals.cached = true
      return next()
    }

    const users = rawUsers.filter((user) => user !== null)

    if (users.length === 0) {
      return next()
    }

    usersUtilityFunctions.sortUsersByEmail(users)
    res.locals.data = users
    res.locals.cached = true
  } catch (error) {
    console.log('Error retrieving all user instances from the cache:', error)
  }

  next()
}

/**
 * Middleware to store all user instances in the cache.
 *
 * If the cache storage fails, it logs the error.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function storeAllUsers(req, res, next) {
  next()

  if (res.locals.cached) {
    return
  }

  if (res.locals.statusCode === 500) {
    return
  }

  try {
    const users = res.locals.data // users = all users

    const emailsToIdsObj = usersUtilityFunctions.getUserEmailsToIdsObj(users)
    emailsToIdsObj['ALL_USERS_LISTED'] = 'ALL_USERS_LISTED'

    // There will never be 0 users in the organization
    // but 'ALL_USERS_LISTED' is required to indicate that it is the result of calling users.list
    if (users.length === 0) {
      const result = await usersCacheService.overwriteIds(emailsToIdsObj)
      console.log('No users in the org:', result)
      return
    }

    const result = await Promise.allSettled([
      usersCacheService.overwriteIds(emailsToIdsObj),
      usersCacheService.setUsers(users),
    ])
    console.log('Stored all user ids and instances in the cache:', result)
  } catch (error) {
    console.log('Error storing all user ids and instances in the cache:', error)
  }
}

module.exports = {
  retrieveAllUsers,
  storeAllUsers,
}
