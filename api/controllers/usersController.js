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
    // TODO(m.okamoto): When encryption/decryption including status code is introduced, call next() here.
  }
}
