const logger = require('../logger/logger')(__filename, 'Domain Users Controller')
const { getOrganizationUsersList } = require('../services/adminService')
require('dotenv').config()

/**
 * Retrieves a list of users from the specified domain using Google Admin SDK.
 *
 * This function takes the `userEmail` from the request body and uses it to impersonate a user
 * when making the API call to list the domain users. The function requires the
 * service account email and private key to be stored in environment variables.
 *
 * @param {Object} req - The request object containing the `userEmail` in the request body.
 * @param {Object} res - The response object used to return the list of users or an error.
 * @returns {Promise<void>} - Responds with the list of users in the domain or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getDomainUsersList = async (req, res) => {
  // Deleted "client" here since client is too large to pass in the request (axios error 413)
  const { userEmail } = req.body // Extract the email and userEmail from the request body

  try {
    // Try to retrieve all users in the organization
    const users = await getOrganizationUsersList({ userEmail })
    logger.debug(`Fetched ${users.length} users from the domain.`)
    // Return the list of users as the response
    res.status(200).json(users)
  } catch (error) {
    logger.error(`Error fetching users:${error}`)
    res.status(500).json({ message: 'Error fetching users' })
  }
}
