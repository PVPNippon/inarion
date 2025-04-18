/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const { getImpersonatedClientInstanceForAdmin } = require('../services/authService')
const logger = require('../logger/logger')(__filename, 'Admin Service')

/**
 * Retrieves a list of all users in the organization using Google Admin Directory API.
 *
 * This asynchronous function takes the email address of the user to impersonate and an
 * optional existing impersonated auth client. It uses these values to authorize a JWT client,
 * which it then uses to make a request to the Google Admin Directory API to list all users
 * within the organization.
 *
 * @param {Object} params - An object containing the following properties:
 *   - {string} userEmail - The email address of the user to impersonate.
 *   - {Object} [client] - An existing impersonated auth client for Directory API.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of user objects, each containing user details.
 * @throws {Error} - Logs an error message if there is an issue with the API call.
 */

async function getOrganizationUsersList({ userEmail, client }) {
  logger.debug('Reached getOrganizationUsersList endpoint.')
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  // Create the request object
  const requestObj = {
    customer: 'my_customer',
    maxResults: 500, //max allowed value
    orderBy: 'email',
    // domain: process.env.DOMAIN_TEST,
  }

  const users = [] // Container for all users retrieved
  let response // Response from the API

  // Fetch all users
  do {
    // To make clear if the problem is wrong type of client for the future
    try {
      response = await directory.users.list(requestObj)
      users.push(...response.data.users)
    } catch (error) {
      logger.error(`API call failed:${error}`)
      throw error
    }
  } while ((requestObj.pageToken = response.data.nextPageToken)) // Continue fetching users while there are more pages

  return users // Return users list
}

module.exports = {
  getOrganizationUsersList,
}
