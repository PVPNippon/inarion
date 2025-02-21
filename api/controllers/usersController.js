const usersService = require('../services/usersService')
const logger = require('../logger/logger')(__filename, 'Users Controller')
const usersUtilityFunctions = require('../utility/usersUtilityFunctions')

/**
 * Retrieves the list of all users in the organization.
 *
 * This function extracts the `userEmail` from the query parameters and uses it
 * to fetch the list of all users in the organization. The list of users is then
 * stored in `res.locals.data` and passed to the next middleware function.
 *
 * @param {Object} req - The request object containing the `userEmail` in the query parameters.
 * @param {Object} res - The response object used to store the list of users.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} - Passes control to the next middleware function.
 * @throws {Error} - Sends a 500 status code if there is an error fetching users.
 */
exports.listAllUsers = async (req, res, next) => {
  // TODO(m.okamoto): Will it be possible to get the logged-in email address from Redis/session in the future?
  // Retrieve the userEmail from the query parameter
  const { userEmail } = req.query

  // console.log('res.locals.cached', res.locals.cached)
  // console.log('res.locals.filterCached', res.locals.filterCached)

  // if all users are already cached in Redis, bypass listAllUsers
  if (res.locals.cached) {
    logger.debug('Bypassing Google API call since all users are already cached.')
    return next()
  }

  // if users by same filters are already cached in Redis, bypass listAllUsers
  if (res.locals.filterCached) {
    logger.debug('Bypassing Google API call since users by same filters are already cached.')
    return next()
  }

  try {
    // Get an array with all users in the organization
    const users = await usersService.listUsers({ userEmail })
    logger.debug(`Fetched ${users.length} users from the domain in backend.`)

    // TODO:(m.okamoto): If you want to add a filter, process the response of listAllUsers and pass it here.
    res.locals.dataToBeCached = users // Pass the list of all organization's users

    if (
      !req.query.orgUnitPath &&
      !req.query.isEnrolledIn2Sv &&
      !req.query.isEnforcedIn2Sv &&
      !req.query.domain &&
      !req.query.groupEmail &&
      !req.query.roleName
    ) {
      res.locals.data = users
    } else {
      // Filter
      let filteredUsers = users
      if (req.query.orgUnitPath) {
        logger.debug(`Filtering users by orgUnitPath: ${req.query.orgUnitPath}`)
        filteredUsers = usersUtilityFunctions.filterUsersByOrgUnitPath(filteredUsers, req.query.orgUnitPath)
      }
      if (req.query.isEnrolledIn2Sv) {
        logger.debug(`Filtering users by isEnrolledIn2Sv: ${req.query.isEnrolledIn2Sv}`)
        filteredUsers = usersUtilityFunctions.filterUsersIf2svEnrolled(
          filteredUsers,
          req.query.isEnrolledIn2Sv === 'true'
        )
      }
      if (req.query.isEnforcedIn2Sv) {
        logger.debug(`Filtering users by isEnforcedIn2Sv: ${req.query.isEnforcedIn2Sv}`)
        filteredUsers = usersUtilityFunctions.filterUsersIf2svEnforced(
          filteredUsers,
          req.query.isEnforcedIn2Sv === 'true'
        )
      }
      if (req.query.domain) {
        logger.debug(`Filtering users by domain: ${req.query.domain}`)
        filteredUsers = usersUtilityFunctions.filterUsersByDomain(filteredUsers, req.query.domain)
      }
      if (req.query.groupEmail) {
        logger.debug(`Filtering users by group: ${req.query.groupEmail}`)
        // Since filterUsersByGroup calls group API, need to pass userEmail for Auth module
        filteredUsers = await usersUtilityFunctions.filterUsersByGroup(filteredUsers, req.query.groupEmail, userEmail)
      }
      if (req.query.roleName) {
        logger.debug(`Filtering users by roleName: ${req.query.roleName}`)
        // Since filterUsersByRoleName calls role-related API, need to pass userEmail for Auth module
        filteredUsers = await usersUtilityFunctions.filterUsersByRoleName(filteredUsers, req.query.roleName, userEmail)
      }
      res.locals.data = filteredUsers
    }

    logger.debug('Returning list of users.')
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: 'Error fetching users.' }
    logger.error(error)
  }
  next()
}

/**
 * Turns off two-step verification for multiple users using Google Admin Directory API, with limiting the number of concurrent API calls to prevent rate limit errors.
 *
 * This function takes the email address of the user to impersonate, and the email addresses of the users for whom to disable two-step verification. It uses these values to authorize a JWT client,
 * which it then uses to make requests to the Google Admin Directory API to turn off two-step verification for the specified users.
 *
 * The number of concurrent API calls is limited to 40 per "set", and this function calls the API in sets until all users are processed.
 * If the number of users is not divisible by 40, the remaining API calls are executed separately.
 *
 * @param {Object} req - The request object containing the `userEmail` in the query parameters and the `twoSVUserEmails` in the request body.
 * @param {Object} res - The response object used to return the list of users for which the operation succeeded and an array of users for which the operation failed.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} - Passes control to the next middleware function.
 * @throws {Error} - Sends a 500 status code if there is an error turning off two-step verification for users.
 */
exports.turnOffTwoSVForUsers = async (req, res, next) => {
  // TODO(m.okamoto): Will it be possible to get the logged-in email address from Redis/session in the future?
  // Retrieve the userEmail from the query parameter
  const { userEmail } = req.query

  const { twoSVUserEmails } = req.body

  // Eliminate duplicate members if any.
  const uniqueTwoSVUsers = [...new Set(twoSVUserEmails)]

  try {
    const response = await usersService.turnOffTwoSVForUsersWithRateLimit({
      userEmail,
      twoSVUserEmails: uniqueTwoSVUsers,
    })

    if (response.failedUsers.length === 0) {
      // All requested users were turned off 2sv successfully.
      logger.debug(`All ${response.succeededUsers.length} users were turned off 2sv successfully.`)
      response.message = `Turned off 2sv for All user(s) successfully.`
      res.locals.statusCode = 200
    } else if (response.succeededUsers.length > 0) {
      // Some requested users were turned off 2sv successfully, but some were not.
      logger.debug(
        `${response.succeededUsers.length} users were turned off 2sv and ${response.failedUsers.length} users were not.`
      )
      response.message = `${response.failedUsers.length} requested user(s) could not be turned off 2sv.`
      res.locals.statusCode = 207
    } else {
      // No requested users were turned off 2sv.
      logger.debug(`All ${response.failedUsers.length} users were not turned off 2sv.`)
      response.message = `No users were turned off 2sv.`

      // TODO(m.okamoto): I need to think about validation later.
      res.locals.statusCode = response.failedUsers.some(({ statusCode }) => statusCode >= 500 && statusCode < 600)
        ? 500
        : 400
    }

    res.locals.data = response
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: `Error turning off 2sv for users.` }
    logger.error(error)
  }
  next()
}

/**
 * Deletes multiple users using Google Admin Directory API, with limiting the number of concurrent API calls to prevent rate limit errors.
 *
 * This function takes the email address of the user to impersonate, and the email addresses of the users to be deleted. It uses these values to authorize a JWT client,
 * which it then uses to make requests to the Google Admin Directory API to delete the specified users.
 *
 * The number of concurrent API calls is limited to 40 per "set", and this function calls the API in sets until all users are processed.
 * If the number of users is not divisible by 40, the remaining API calls are executed separately.
 *
 * @param {Object} req - The request object containing the `userEmail` in the query parameters and the `deleteUserEmails` in the request body.
 * @param {Object} res - The response object used to return the list of users for which the operation succeeded and an array of users for which the operation failed.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} - Passes control to the next middleware function.
 * @throws {Error} - Sends a 500 status code if there is an error deleting users.
 */
exports.deleteUsers = async (req, res, next) => {
  // TODO(m.okamoto): Will it be possible to get the logged-in email address from Redis/session in the future?
  // Retrieve the userEmail from the query parameter
  const { userEmail } = req.query

  const { deleteUserEmails } = req.body

  // Eliminate duplicate members if any.
  const uniqueDeleteUsers = [...new Set(deleteUserEmails)]

  try {
    const response = await usersService.deleteUsersWithRateLimit({
      userEmail,
      deleteUserEmails: uniqueDeleteUsers,
    })

    if (response.undeletedUsers.length === 0) {
      // All requested users were deleted successfully.
      logger.debug(`All ${response.deletedUsers.length} users were deleted successfully.`)
      response.message = `Deleted All user(s) successfully.`
      res.locals.statusCode = 200
    } else if (response.deletedUsers.length > 0) {
      // Some requested users were deleted successfully, but some were not.
      logger.debug(
        `${response.deletedUsers.length} users were deleted and ${response.undeletedUsers.length} users were not.`
      )
      response.message = `${response.undeletedUsers.length} requested user(s) could not be deleted.`
      res.locals.statusCode = 207
    } else {
      // No requested users were deleted.
      logger.debug(`All ${response.undeletedUsers.length} users were not deleted.`)
      response.message = `No users were deleted.`

      // TODO(m.okamoto): I need to think about validation later.
      res.locals.statusCode = response.undeletedUsers.some(({ statusCode }) => statusCode >= 500 && statusCode < 600)
        ? 500
        : 400
    }

    res.locals.data = response
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: `Error deleting users.` }
    logger.error(error)
  }
  next()
}

// Currently listRoleNames and listRoleAssignments are only used to filter listAllUsers.
// Because filtering calls functions in usersService directly, the code below will not be run in the current implementation..
exports.listRoleNames = async (req, res, next) => {
  const { userEmail } = req.query

  try {
    const roleNames = await usersService.listRoleNames({ userEmail })
    logger.debug(`Fetched ${roleNames.length} role names from the domain.`)

    res.locals.data = roleNames
    logger.debug('Returning list of roleNames.')
  } catch (error) {
    logger.error(error)
    res.status(500).json({ message: 'Error fetching roleNames.' })
  }
  next()
}

exports.listRoleAssignments = async (req, res, next) => {
  const { userEmail } = req.query

  try {
    const roleAssignments = await usersService.listRoleAssignments({ userEmail })
    logger.debug(`Fetched ${roleAssignments.length} role assignments from the domain.`)

    res.locals.data = roleAssignments
    logger.debug('Returning list of roleAssignments.')
  } catch (error) {
    logger.error(error)
    res.status(500).json({ message: 'Error fetching roleAssignments.' })
  }
  next()
}
//
