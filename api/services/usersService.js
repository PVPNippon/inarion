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

/**
 * Turns off two-step verification for a specified user using Google Admin Directory API.
 *
 * This function takes the email address of the user to impersonate, an optional existing impersonated auth client,
 * and the email address of the user for whom to disable two-step verification. It uses these values to authorize a JWT client,
 * which it then uses to make a request to the Google Admin Directory API to turn off two-step verification for the specified user.
 *
 * @param {Object} params - The parameters needed to turn off two-step verification for a user.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {Object} [params.client] - An existing impersonated auth client for Directory API.
 * @param {string} params.twoSVUser - The email address of the user for whom to disable two-step verification.
 * @returns {Promise<Object>} - A promise that resolves to an object which contains the response from Google Admin Directory API.
 * @throws {Error} - Throws an error if there is an issue with the API call.
 */
async function turnOffTwoSVForUser({ userEmail, client, twoSVUser }) {
  logger.debug('Reached turnOffTwoSVForUser endpoint.')
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  // TODO: Write the status codes for twoStepVerification.turnOff
  // twoStepVerification.turnOff returns a 204 response without any messages if 2sv was successfully turned off.
  // Successful only if the user's parameter "isEnrolledIn2Sv" is true AND "isEnforcedIn2Sv" is false.
  // The currently known error status patterns are listed below.
  // 400
  // - When the parameter "isEnforcedIn2Sv" of twoSVUser is true.
  //   Original message is "2-Step Verification cannot be turned off: user is required by admin policy to have 2-Step Verification (\"enforced\")"
  // - When the parameter "isEnrolledIn2Sv" of twoSVUser is false.
  //   Original message is "2-Step Verification cannot be turned off: user not enrolled in 2-Step Verification"
  // - When twoSVUser is a group outside the organization.
  //   Original message is "Type not supported: userKey"
  //
  // 403
  // - When twoSVUser is a user outside the organization.
  //   Original message is "Not Authorized to access this resource/api"
  //
  // 404
  // - When Google cannot find twoSVUser as a user inside the org, like group, unmanaged user, non-email string, etc.
  //   Original message is "Resource Not Found: userKey"
  // otherwise it will be 500
  const response = await directory.twoStepVerification.turnOff({ userKey: twoSVUser })

  return response
}

/**
 * Turns off two-step verification for multiple users using Google Admin Directory API.
 *
 * This function takes the email address of the user to impersonate, an optional existing impersonated auth client,
 * and the email addresses of the users for whom to disable two-step verification. It uses these values to authorize a JWT client,
 * which it then uses to make requests to the Google Admin Directory API to turn off two-step verification for the specified users.
 *
 * @param {Object} params - The parameters needed to turn off two-step verification for multiple users.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {Object} [params.client] - An existing impersonated auth client for Directory API.
 * @param {string[]} params.twoSVUsers - The email addresses of the users for whom to disable two-step verification.
 * @returns {Promise<Object>} - A promise that resolves to an object which contains two arrays, an array of users for which the operation succeeded and an array of users for which the operation failed.
 * @throws {Error} - Throws an error if there is an issue with the API call.
 */
async function turnOffTwoSVForUsers({ userEmail, client, twoSVUsers }) {
  // TODO(m.okamoto): Allow filtering by OU in the future because the 2sv-related config that Admin can do in admin console is always per OU.
  logger.debug('Reached turnOffTwoSVForUsers endpoint.')
  // Retrieve an existing impersonated auth client for Directory API or create a new one
  const directoryClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  const succeededUsers = [] // Array of users for which turning off 2sv was successful
  const failedUsers = [] // Array of users for which turning off 2sv was UNsuccessful

  const responseArray = await Promise.allSettled(
    twoSVUsers.map((twoSVUser) => turnOffTwoSVForUser({ client: directoryClient, twoSVUser }))
  )

  for (let index = 0; index < twoSVUsers.length; index++) {
    const twoSVUser = twoSVUsers[index]

    // If the turning off 2sv was successful, put the user email and statusCode (= 204) to the succeededUsers array.
    if (responseArray[index].status === 'fulfilled') {
      succeededUsers.push({
        email: twoSVUser,
        statusCode: responseArray[index].value.status,
      })

      // If the turning off 2sv failed, put the user email, statusCode and the error message to the failedUsers array.
    } else {
      failedUsers.push({
        email: twoSVUser,
        statusCode: responseArray[index].reason.status,
        errorMessage: responseArray[index].reason.message,
      })
    }
  }

  return { succeededUsers, failedUsers }
}

/**
 * Turns off two-step verification for multiple users using Google Admin Directory API,
 * with limiting the number of concurrent API calls to prevent rate limit errors.
 *
 * This function takes the email address of the user to impersonate, an optional existing impersonated auth client,
 * and the email addresses of the users for whom to disable two-step verification. It uses these values to authorize a JWT client,
 * which it then uses to make requests to the Google Admin Directory API to turn off two-step verification for the specified users.
 *
 * The number of concurrent API calls is limited to 40 per "set", and this function calls the API in sets until all users are processed.
 * If the number of users is not divisible by 40, the remaining API calls are executed separately.
 *
 * @param {Object} params - The parameters needed to turn off two-step verification for multiple users.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {Object} [params.client] - An existing impersonated auth client for Directory API.
 * @param {string[]} params.twoSVUsers - The email addresses of the users for whom to disable two-step verification.
 * @returns {Promise<Object>} - A promise that resolves to an object which contains two arrays, an array of users for which the operation succeeded and an array of users for which the operation failed.
 * @throws {Error} - Throws an error if there is an issue with the API call.
 */
async function turnOffTwoSVForUsersWithRateLimit({ userEmail, client, twoSVUsers }) {
  logger.debug('Reached turnOffTwoSVForUsersWithRateLimit endpoint.')
  // Retrieve an existing impersonated auth client for Directory API or create a new one
  const directoryClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  // Using same logic as deleteMembersWithRateLimit
  // Changed the variable name since this function is for turning off 2sv.
  // This may be integrated into middleware etc. in the future.
  const BULK_2SV_OFF_THRESHOLD = 40

  const numOfBulkAPICalls = Math.floor(twoSVUsers.length / BULK_2SV_OFF_THRESHOLD) // Number of "sets" to execute API 40 times with Promise.allSettled
  const numOfRemainingAPICalls = twoSVUsers.length % BULK_2SV_OFF_THRESHOLD // Remaining number of API executions below the set of 40

  const succeededUsers = [] // Array of users for which turning off 2sv was successful
  const failedUsers = [] // Array of users for which turning off 2sv failed

  for (let i = 0; i < numOfBulkAPICalls; i++) {
    const startIndex = i * BULK_2SV_OFF_THRESHOLD
    const endIndex = startIndex + BULK_2SV_OFF_THRESHOLD

    const response = await turnOffTwoSVForUsers({
      client: directoryClient,
      twoSVUsers: twoSVUsers.slice(startIndex, endIndex),
    })

    succeededUsers.push(...response.succeededUsers)
    failedUsers.push(...response.failedUsers)
  }

  if (numOfRemainingAPICalls > 0) {
    const startIndex = twoSVUsers.length - numOfRemainingAPICalls

    const response = await turnOffTwoSVForUsers({
      client: directoryClient,
      twoSVUsers: twoSVUsers.slice(startIndex),
    })

    succeededUsers.push(...response.succeededUsers)
    failedUsers.push(...response.failedUsers)
  }

  return { succeededUsers, failedUsers }
}

module.exports = {
  listUsers,
  turnOffTwoSVForUsersWithRateLimit,
}
