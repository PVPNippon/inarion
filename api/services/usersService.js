const { getImpersonatedClientInstanceForAdmin } = require('./authService')
const logger = require('../logger/logger')(__filename, 'Users Service')

/**
 * Retrieves a list of all users in the organization.
 *
 * This function takes the email address of the user to impersonate, an optional existing impersonated auth client,
 * and an optional query for filtering the users. It uses these values to authorize a JWT client, which it then uses
 * to make a request to the Google Admin Directory API to list all users in the organization.
 *
 * @param {Object} params - The parameters for listing users.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {Object} [params.client] - An existing impersonated auth client for Directory API.
 * @param {string} [params.query] - The filter to apply to the users list.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of user objects, each containing user details.
 * @throws {Error} - Throws an error if there is an issue with the API call.
 */

async function listUsers({ userEmail, client, query }) {
  // TODO(m.okamoto): Allow filtering by domain or group in the future
  logger.debug('Reached listUsers endpoint.')
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))
  const users = [] // Container for all users retrieved
  let usersResponse // Response from the API

  // create request object
  const requestObj = {
    customer: 'my_customer',
    maxResults: 500, //max allowed value
    orderBy: 'email',
    // Deleted domain parameter here
  }

  // Add query(filter) if it exists
  if (query) {
    requestObj.query = query
  }

  // Fetch all users
  do {
    // Fetch users
    usersResponse = await directory.users.list(requestObj)

    // groupService.js has a break loop for when the group does not exist in the organization, but it is not expected for users, so I removed it.
    // The user array is expected to always contain at least one email address.

    // Append the fetched users to the users array
    users.push(...usersResponse.data.users)

    //repeat until there are no more pages(i.e. no nextPageToken returned by google)
  } while ((requestObj.pageToken = usersResponse.data.nextPageToken)) // Continue fetching users while there are more pages

  return users // Return all fetched users
}

module.exports = {
  listUsers,
}
