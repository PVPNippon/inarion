/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const { all } = require('axios')
const usersCacheService = require('../services/usersCacheService.js')
const usersUtilityFunctions = require('../utility/usersUtilityFunctions.js')
const config = require('../config/config')

/**
 * Middleware to retrieve all user instances from the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to store the list of users.
 * @param {Function} next - The next middleware function in the stack.
 *
 * If the query parameters specify any filtering, this middleware passes control to the next middleware.
 * If the cache retrieval or processing fails, it logs the error.
 */
async function retrieveAllUsers(req, res, next) {
  // Ability to disable cache
  if (req.query.requiresFresh) {
    return next()
  }

  // If any filtering is specified in the query parameters,
  if (
    req.query.orgUnitPath ||
    req.query.isEnrolledIn2Sv ||
    req.query.isEnforcedIn2Sv ||
    req.query.domain ||
    req.query.groupEmail ||
    req.query.roleName
  ) {
    // no need to run the following code
    return next()
  }

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
 * This function checks if the user data is already cached or if there is a server error,
 * and proceeds only if neither condition is met. It retrieves all user instances from
 * `res.locals.dataToBeCached`, maps their emails to IDs, and stores both the mapping and
 * the user data in the cache. It uses 'ALL_USERS_LISTED' to indicate that the operation
 * is a result of calling users.list. Logs errors if the cache storage fails.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */

async function storeAllUsers(req, res, next) {
  next()

  if (res.locals.cached) {
    return next()
  }

  if (res.locals.statusCode === 500) {
    return next()
  }

  // console.log('res.locals.dataToBeCached', res.locals.dataToBeCached)

  // No need to run the following code if filteredUsers is undefined
  if (res.locals.dataToBeCached === undefined) {
    return next()
  }

  try {
    const users = res.locals.dataToBeCached // users = all users

    const emailsToIdsObj = usersUtilityFunctions.getUserEmailsToIdsObj(users)
    emailsToIdsObj['ALL_USERS_LISTED'] = 'ALL_USERS_LISTED'

    // There will never be 0 users in the organization
    // but 'ALL_USERS_LISTED' is required to indicate that it is the result of calling users.list
    if (users.length === 0) {
      const result = await usersCacheService.overwriteIds(emailsToIdsObj)
      console.log('No users in the org:', result)
      return next()
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

/**
 * Middleware to retrieve filtered users from the cache.
 *
 * If one or more filters are applied in the query parameters, this middleware
 * attempts to retrieve the filtered users from the cache. If all filters are
 * found in the cache, it stores the filtered users in `res.locals.data` and
 * sets `res.locals.filterCached` to true. If no filters are found in the
 * cache, it passes control to the next middleware. If an error occurs, it
 * logs the error.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to store the filtered users.
 * @param {Function} next - The next middleware function in the stack.
 */
async function retrieveFilteredUsers(req, res, next) {
  // キャッシュ使わない機能
  if (req.query.requiresFresh) {
    // クエリパラメータで指定された場合
    return next()
  }

  // Create an array of applied filter keys
  const filterKeys = []

  if (req.query.orgUnitPath) {
    const filterKey = `${config.DOMAIN_TEST}:users:orgUnitPath:${req.query.orgUnitPath}`
    // orgUnitPath allows spaces so replace it with other symbols
    const formattedKey = filterKey.replace(/ +/g, '-')
    filterKeys.push(formattedKey)
  }
  if (req.query.isEnrolledIn2Sv) {
    const filterKey = `${config.DOMAIN_TEST}:users:isEnrolledIn2Sv:${req.query.isEnrolledIn2Sv}`
    filterKeys.push(filterKey)
  }
  if (req.query.isEnforcedIn2Sv) {
    const filterKey = `${config.DOMAIN_TEST}:users:isEnforcedIn2Sv:${req.query.isEnforcedIn2Sv}`
    filterKeys.push(filterKey)
  }
  if (req.query.domain) {
    const filterKey = `${config.DOMAIN_TEST}:users:domain:${req.query.domain}`
    filterKeys.push(filterKey)
  }
  if (req.query.groupEmail) {
    const filterKey = `${config.DOMAIN_TEST}:users:groupEmail:${req.query.groupEmail}`
    filterKeys.push(filterKey)
  }
  if (req.query.roleName) {
    const filterKey = `${config.DOMAIN_TEST}:users:roleName:${req.query.roleName}`
    // roleName allows spaces so replace it with other symbols
    const formattedKey = filterKey.replace(/ +/g, '-')
    filterKeys.push(formattedKey)
  }

  // console.log('filterKeys:', filterKeys)

  // If no filters are applied, return next
  if (filterKeys.length === 0) {
    return next()
  }

  try {
    // If two or more filters are applied,
    if (filterKeys.length > 1) {
      // get the ids in the set for all keys
      const cachedIds = []
      for (let i = 0; i < filterKeys.length; i++) {
        const filterKey = filterKeys[i]
        const ids = await usersCacheService.getIdsFromCache(filterKey)
        cachedIds.push(ids)
      }
      // console.log('cachedIds:', cachedIds)

      // If cachedIds contains at least one empty array, it means that non-cached filter was applied.
      // So only if cachedIds contains NO empty arrays,
      if (!cachedIds.some((id) => id.length === 0)) {
        // Set res.locals.filterCached to true
        res.locals.filterCached = true
        console.log('All keys found in Redis:')
      }

      // get the intersection of the sets in Redis
      const intersectionId = await usersCacheService.getIntersectionIdOfSets(filterKeys)
      // get the users using the intersectionId
      const filteredUsers = await usersCacheService.getFilteredUsersByIds(intersectionId)
      res.locals.data = filteredUsers

      // If only one filter is applied,
    } else if (filterKeys.length === 1) {
      // just get the members (= user IDs) of the set in Redis (No intersection needed)
      const cachedId = await usersCacheService.getIdsFromCache(filterKeys[0])
      // If cachedId is not empty,
      if (cachedId.length !== 0) {
        // get the users using the cachedId
        const filteredUsers = await usersCacheService.getFilteredUsersByIds(cachedId)
        // and set res.locals.filterCached to true
        res.locals.data = filteredUsers
        res.locals.filterCached = true
        console.log('The key is found in Redis:', filterKeys[0])
      }
    } else {
      console.log('Key not found in Redis')
    }
  } catch (error) {
    console.log('Error retrieving filtered users from cache:', error)
  }

  next()
}

/**
 * Middleware to store filtered users in Redis cache.
 *
 * This middleware runs after listAllUsers and fetchUsersFromCache and stores filtered users in Redis cache.
 * It uses the query parameters to filter users and stores the filtered users in Redis cache.
 * If any error occurs, it logs an error and does not set res.locals.data.
 * Proceeds to the next middleware on successful execution.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express middleware function to proceed to the next step.
 */
async function storeFilteredUsers(req, res, next) {
  next()

  if (res.locals.statusCode === 500) {
    return next()
  }

  let filteredUsers = res.locals.dataToBeCached // = all users fetched in listAllUsers
  // No need to run the following code if filteredUsers is undefined
  if (filteredUsers === undefined) {
    return
  }

  const { userEmail } = req.query

  try {
    // TODO(m.okamoto): Couldn't the next 6 if checks be done with Promise.allSettled?
    // NOTE: filteredUsers need to be initialized before any of the following 6 if checks

    if (req.query.orgUnitPath) {
      // filter users by orgUnitPath
      filteredUsersByOrgUnitPath = usersUtilityFunctions.filterUsersByOrgUnitPath(filteredUsers, req.query.orgUnitPath)
      // create a set of filtered user IDs by orgUnitPath
      usersCacheService.saveFilteredUsersCache('orgUnitPath', req.query.orgUnitPath, filteredUsersByOrgUnitPath)
    }
    // Same for each filter below
    if (req.query.isEnrolledIn2Sv) {
      filteredUsersByIsEnrolledIn2Sv = usersUtilityFunctions.filterUsersIf2svEnrolled(
        filteredUsers,
        req.query.isEnrolledIn2Sv === 'true'
      )
      usersCacheService.saveFilteredUsersCache(
        'isEnrolledIn2Sv',
        req.query.isEnrolledIn2Sv,
        filteredUsersByIsEnrolledIn2Sv
      )
    }
    if (req.query.isEnforcedIn2Sv) {
      filteredUsersByEnforcedIn2Sv = usersUtilityFunctions.filterUsersIf2svEnforced(
        filteredUsers,
        req.query.isEnforcedIn2Sv === 'true'
      )
      usersCacheService.saveFilteredUsersCache(
        'isEnforcedIn2Sv',
        req.query.isEnforcedIn2Sv,
        filteredUsersByEnforcedIn2Sv
      )
    }
    if (req.query.domain) {
      filteredUsersByDomain = usersUtilityFunctions.filterUsersByDomain(filteredUsers, req.query.domain)
      usersCacheService.saveFilteredUsersCache('domain', req.query.domain, filteredUsersByDomain)
    }
    if (req.query.groupEmail) {
      filteredUsersByGroupEmail = await usersUtilityFunctions.filterUsersByGroup(
        filteredUsers,
        req.query.groupEmail,
        userEmail
      )
      await usersCacheService.saveFilteredUsersCache('groupEmail', req.query.groupEmail, filteredUsersByGroupEmail)
    }
    if (req.query.roleName) {
      filteredUsersByRoleName = await usersUtilityFunctions.filterUsersByRoleName(
        filteredUsers,
        req.query.roleName,
        userEmail
      )
      await usersCacheService.saveFilteredUsersCache('roleName', req.query.roleName, filteredUsersByRoleName)
    }

    console.log('Stored filtered users in the cache')
  } catch (error) {
    console.log('Error storing filtered users in the cache:', error)
  }
}

module.exports = {
  retrieveAllUsers,
  storeAllUsers,
  retrieveFilteredUsers,
  storeFilteredUsers,
}
