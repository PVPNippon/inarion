const usersService = require('../services/usersService')
const logger = require('../logger/logger')(__filename, 'Users Controller')

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

  try {
    // Get an array with all users in the organization
    const users = await usersService.listUsers({ userEmail })
    logger.debug(`Fetched ${users.length} users from the domain.`)

    // Pass the list of all organization's users
    res.locals.data = users
    logger.debug('Returning list of users.')
    next()
  } catch (error) {
    logger.error(error)
    res.status(500).json({ message: 'Error fetching users.' })
    next()
  }
}

/**
 * Turns off two-step verification for a specified list of users using Google Admin Directory API.
 *
 * This function takes the email address of the user to impersonate, an optional existing impersonated auth client,
 * and the email addresses of the users for whom to disable two-step verification. It uses these values to authorize a JWT client,
 * which it then uses to make requests to the Google Admin Directory API to turn off two-step verification for the specified users.
 *
 * @param {Object} req - The request object containing the `userEmail` in the query parameters and the `twoSVUsers` in the request body.
 * @param {Object} res - The response object used to return the list of users for which the operation succeeded and an array of users for which the operation failed.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} - Passes control to the next middleware function.
 * @throws {Error} - Sends a 500 status code if there is an error turning off two-step verification for users.
 */
exports.turnOffTwoSVForUsers = async (req, res, next) => {
  // TODO(m.okamoto): Will it be possible to get the logged-in email address from Redis/session in the future?
  // Retrieve the userEmail from the query parameter
  const { userEmail } = req.query

  const { twoSVUsers } = req.body

  // Returns Bad Request if users to be turned off 2sv are not specified.
  if (!twoSVUsers || twoSVUsers.length === 0) {
    logger.debug('Fetched no users to be turned off 2sv.')
    return res.status(400).json({ message: 'Users are not specified' })
  }

  // Eliminate duplicate members if any.
  const uniqueTwoSVUsers = [...new Set(twoSVUsers)]

  try {
    const response = await usersService.turnOffTwoSVForUsersWithRateLimit({
      userEmail,
      twoSVUsers: uniqueTwoSVUsers,
    })

    if (response.failedUsers.length === 0) {
      // All requested users were turned off 2sv successfully.
      logger.debug(`All ${response.succeededUsers.length} users were turned off 2sv successfully.`)
      response.message = `Turned off 2sv for All user(s) successfully.`
      res.status(200).json(response)
    } else if (response.succeededUsers.length > 0) {
      // Some requested users were turned off 2sv successfully, but some were not.
      logger.debug(
        `${response.succeededUsers.length} users were turned off 2sv and ${response.failedUsers.length} users were not.`
      )
      response.message = `${response.failedUsers.length} requested user(s) could not be turned off 2sv.`
      res.status(207).json(response)
    } else {
      // No requested users were turned off 2sv.
      logger.debug(`All ${response.failedUsers.length} users were not turned off 2sv.`)
      response.message = `No users were turned off 2sv.`

      // TODO(m.okamoto): I need to think about validation later.
      const statusCode = response.failedUsers.some(({ statusCode }) => statusCode >= 500 && statusCode < 600)
        ? 500
        : 400

      res.status(statusCode).json(response)
    }
    next()
  } catch (error) {
    logger.error(error)
    res.status(500).json({ message: `Error turning off 2sv for users.` })
    next()
  }
}
