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
  // TODO(m.okamoto): Allow filtering by OU or domain or group in the future
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
 * Turns off two-step verification for one user using Google Admin Directory API.
 *
 * This function takes the email address of the user to impersonate, an optional existing impersonated auth client,
 * and the email address of the user for whom to disable two-step verification. It uses these values to authorize a JWT client,
 * which it then uses to make a request to the Google Admin Directory API to turn off two-step verification for the specified user.
 *
 * @param {Object} params - The parameters needed to turn off two-step verification for one user.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {Object} [params.client] - An existing impersonated auth client for Directory API.
 * @param {string} params.twoSVUserEmail - The email address of the user for whom to disable two-step verification.
 * @returns {Promise<Object>} - A promise that resolves to an object which contains the response from the API.
 * @throws {Error} - Throws an error if there is an issue with the API call.
 */
async function turnOffTwoSVForUser({ userEmail, client, twoSVUserEmail }) {
  // logger.debug('Reached turnOffTwoSVForUser endpoint.')
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  // TODO: Write the status codes for twoStepVerification.turnOff
  // twoStepVerification.turnOff returns a 204 response without any messages if 2sv was successfully turned off.
  // Successful only if the user's parameter "isEnrolledIn2Sv" is true AND "isEnforcedIn2Sv" is false.
  // The currently known error status patterns are listed below.
  // 400
  // - When the parameter "isEnforcedIn2Sv" of twoSVUserEmail is true.
  //   Original message is "2-Step Verification cannot be turned off: user is required by admin policy to have 2-Step Verification (\"enforced\")"
  // - When the parameter "isEnrolledIn2Sv" of twoSVUserEmail is false.
  //   Original message is "2-Step Verification cannot be turned off: user not enrolled in 2-Step Verification"
  // - When twoSVUserEmail is a group outside the organization.
  //   Original message is "Type not supported: userKey"
  //
  // 403
  // - When twoSVUserEmail is a user outside the organization.
  //   Original message is "Not Authorized to access this resource/api"
  //
  // 404
  // - When Google cannot find twoSVUserEmail as a user inside the org, like group, unmanaged user, non-email string, etc.
  //   Original message is "Resource Not Found: userKey"
  // otherwise it will be 500

  const response = await directory.twoStepVerification.turnOff({ userKey: twoSVUserEmail })
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
 * @param {string[]} params.twoSVUserEmails - The email addresses of the users for whom to disable two-step verification.
 * @returns {Promise<Object>} - A promise that resolves to an object which contains two arrays, an array of users for which the operation succeeded and an array of users for which the operation failed.
 * @throws {Error} - Throws an error if there is an issue with the API call.
 */
async function turnOffTwoSVForUsers({ userEmail, client, twoSVUserEmails }) {
  // TODO(m.okamoto): Allow filtering by OU or group in the future because the 2sv-related config that Admin can do in admin console is always per OU or group.
  logger.debug('Reached turnOffTwoSVForUsers endpoint.')
  // Retrieve an existing impersonated auth client for Directory API or create a new one
  const directoryClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  const succeededUsers = [] // Array of users for which turning off 2sv was successful
  const failedUsers = [] // Array of users for which turning off 2sv was UNsuccessful

  const responseArray = await Promise.allSettled(
    twoSVUserEmails.map((twoSVUserEmail) => turnOffTwoSVForUser({ client: directoryClient, twoSVUserEmail }))
  )

  for (let index = 0; index < twoSVUserEmails.length; index++) {
    const twoSVUserEmail = twoSVUserEmails[index]

    // If the turning off 2sv was successful, put the user email and statusCode (= 204) to the succeededUsers array.
    if (responseArray[index].status === 'fulfilled') {
      succeededUsers.push({
        email: twoSVUserEmail,
        statusCode: responseArray[index].value.status,
      })

      // If the turning off 2sv failed, put the user email, statusCode and the error message to the failedUsers array.
    } else {
      failedUsers.push({
        email: twoSVUserEmail,
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
async function turnOffTwoSVForUsersWithRateLimit({ userEmail, client, twoSVUserEmails }) {
  logger.debug('Reached turnOffTwoSVForUsersWithRateLimit endpoint.')
  // Retrieve an existing impersonated auth client for Directory API or create a new one
  const directoryClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  // Using same logic as deleteMembersWithRateLimit
  // Changed the variable name since this function is for turning off 2sv.
  // This may be integrated into middleware etc. in the future.
  const BULK_2SV_OFF_THRESHOLD = 40

  const numOfBulkAPICalls = Math.floor(twoSVUserEmails.length / BULK_2SV_OFF_THRESHOLD) // Number of "sets" to execute API 40 times with Promise.allSettled
  const numOfRemainingAPICalls = twoSVUserEmails.length % BULK_2SV_OFF_THRESHOLD // Remaining number of API executions below the set of 40

  const succeededUsers = [] // Array of users for which turning off 2sv was successful
  const failedUsers = [] // Array of users for which turning off 2sv failed

  for (let i = 0; i < numOfBulkAPICalls; i++) {
    const startIndex = i * BULK_2SV_OFF_THRESHOLD
    const endIndex = startIndex + BULK_2SV_OFF_THRESHOLD

    const response = await turnOffTwoSVForUsers({
      client: directoryClient,
      twoSVUserEmails: twoSVUserEmails.slice(startIndex, endIndex),
    })

    succeededUsers.push(...response.succeededUsers)
    failedUsers.push(...response.failedUsers)
  }

  if (numOfRemainingAPICalls > 0) {
    const startIndex = twoSVUserEmails.length - numOfRemainingAPICalls

    const response = await turnOffTwoSVForUsers({
      client: directoryClient,
      twoSVUserEmails: twoSVUserEmails.slice(startIndex),
    })

    succeededUsers.push(...response.succeededUsers)
    failedUsers.push(...response.failedUsers)
  }

  return { succeededUsers, failedUsers }
}

/**
 * Deletes a user using Google Admin Directory API.
 *
 * This function takes the email address of the user to impersonate, an optional existing impersonated auth client,
 * and the email address of the user to delete. It uses these values to authorize a JWT client,
 * which it then uses to make a request to the Google Admin Directory API to delete the specified user.
 *
 * @param {Object} params - The parameters needed to delete a user.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {Object} [params.client] - An existing impersonated auth client for Directory API.
 * @param {string} params.deleteUserEmail - The email address of the user to delete.
 * @returns {Promise<Object>} - A promise that resolves to the response from the API.
 * @throws {Error} - Throws an error if the API call fails with status 400, 403, 404 or other issues.
 * Status 400 indicates the user key is a group outside the organization.
 * Status 403 indicates the user is outside the organization.
 * Status 404 indicates the user cannot be found as a valid email or group.
 */
async function deleteUser({ userEmail, client, deleteUserEmail }) {
  // logger.debug('Reached deleteUser endpoint.')
  // Retrieve an existing impersonated auth client for Directory API or create a new one
  const directoryClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  //TODO(m.okamoto): Write the status codes for users.delete
  // users.delete returns a 204 response without any messages if an user deleted successfully.
  // The currently known error status patterns are listed below.
  // 400
  // - When deleteUserEmail is a group outside the organization.
  //   Original message is "Type not supported: userKey"
  //
  // 403
  // - When deleteUserEmail is an user outside the organization.
  //   Original message is "Not Authorized to access this resource/api"
  //
  // 404
  // - When Google cannot find deleteUserEmail as a user inside the org, like group, unmanaged user, non-email string, etc.
  //   Original message is "Resource Not Found: userKey"
  // otherwise it will be 500

  const response = await directoryClient.users.delete({ userKey: deleteUserEmail })
  return response
}

/**
 * Deletes multiple users using the Google Admin Directory API.
 *
 * This function takes the email address of the user to impersonate, an optional existing impersonated auth client,
 * and the email addresses of the users to be deleted. It uses these values to authorize a JWT client, which it then uses
 * to make requests to delete the specified users.
 *
 * The function attempts to delete each user in the provided list and records the outcome for each user.
 * If a user's deletion is successful, their email and status code are added to the `deletedUsers` array.
 * If a user's deletion fails, their email, status code, and error message are added to the `undeletedUsers` array.
 *
 * @param {Object} params - The parameters needed to delete users.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {Object} [params.client] - An existing impersonated auth client for Directory API.
 * @param {string[]} params.deleteUserEmails - The email addresses of the users to be deleted.
 * @returns {Promise<Object>} - A promise that resolves to an object containing two arrays:
 *                              `deletedUsers` and `undeletedUsers`, each holding details of the
 *                              respective operation's outcome.
 * @throws {Error} - Throws an error if there is an issue with the API call.
 */
async function deleteUsers({ userEmail, client, deleteUserEmails }) {
  // TODO(m.okamoto): I will think about the function to raise an alert later if the user to be deleted is SA or Admin.
  logger.debug('Reached deleteUsers endpoint.')
  // Retrieve an existing impersonated auth client for Directory API or create a new one
  const directoryClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  const deletedUsers = [] // Array of users for which deletion was successful
  const undeletedUsers = [] // Array of users for which deletion failed

  const responseArray = await Promise.allSettled(
    deleteUserEmails.map((deleteUserEmail) => deleteUser({ client: directoryClient, deleteUserEmail }))
  )

  for (let index = 0; index < deleteUserEmails.length; index++) {
    const deleteUserEmail = deleteUserEmails[index]

    if (responseArray[index].status === 'fulfilled') {
      deletedUsers.push({
        email: deleteUserEmail,
        statuscode: responseArray[index].value.status,
      })
    } else {
      undeletedUsers.push({
        email: deleteUserEmail,
        statuscode: responseArray[index].reason.status,
        errorMessage: responseArray[index].reason.message,
      })
    }
  }

  return { deletedUsers, undeletedUsers }
}

/**
 * Deletes multiple users using the Google Admin Directory API,
 * with limiting the number of concurrent API calls to prevent rate limit errors.
 *
 * This function takes the email address of the user to impersonate, an optional existing impersonated auth client,
 * and the email addresses of the users to be deleted. It uses these values to authorize a JWT client, which it then uses
 * to make requests to delete the specified users.
 *
 * The function attempts to delete each user in the provided list and records the outcome for each user.
 * If a user's deletion is successful, their email and status code are added to the `deletedUsers` array.
 * If a user's deletion fails, their email, status code, and error message are added to the `undeletedUsers` array.
 *
 * The number of concurrent API calls is limited to 40 per "set", and this function calls the API in sets until all users are processed.
 * If the number of users is not divisible by 40, the remaining API calls are executed separately.
 *
 * @param {Object} params - The parameters needed to delete users.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {Object} [params.client] - An existing impersonated auth client for Directory API.
 * @param {string[]} params.deleteUserEmails - The email addresses of the users to be deleted.
 * @returns {Promise<Object>} - A promise that resolves to an object containing two arrays:
 *                              `deletedUsers` and `undeletedUsers`, each holding details of the
 *                              respective operation's outcome.
 * @throws {Error} - Throws an error if there is an issue with the API call.
 */
async function deleteUsersWithRateLimit({ userEmail, client, deleteUserEmails }) {
  logger.debug('Reached deleteUsersWithRateLimit endpoint.')
  // Retrieve an existing impersonated auth client for Directory API or create a new one
  const directoryClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  // Using same logic as deleteMembersWithRateLimit
  // This may be integrated into middleware etc. in the future.
  const BULK_DELETE_THRESHOLD = 40

  const numOfBulkAPICalls = Math.floor(deleteUserEmails.length / BULK_DELETE_THRESHOLD)
  const numOfRemainingAPICalls = deleteUserEmails.length % BULK_DELETE_THRESHOLD

  const deletedUsers = [] // Array of users for which deletion was successful
  const undeletedUsers = [] // Array of users for which deletion failed

  for (let i = 0; i < numOfBulkAPICalls; i++) {
    const startIndex = i * BULK_DELETE_THRESHOLD
    const endIndex = startIndex + BULK_DELETE_THRESHOLD

    const response = await deleteUsers({
      client: directoryClient,
      deleteUserEmails: deleteUserEmails.slice(startIndex, endIndex),
    })

    deletedUsers.push(...response.deletedUsers)
    undeletedUsers.push(...response.undeletedUsers)
  }

  if (numOfRemainingAPICalls > 0) {
    const startIndex = deleteUserEmails.length - numOfRemainingAPICalls

    const response = await deleteUsers({
      client: directoryClient,
      deleteUserEmails: deleteUserEmails.slice(startIndex),
    })

    deletedUsers.push(...response.deletedUsers)
    undeletedUsers.push(...response.undeletedUsers)
  }

  return { deletedUsers, undeletedUsers }
}

async function listRoleNames({ userEmail, client }) {
  logger.debug('Reached listRoleNames endpoint.')
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))
  const roleNames = [] // Container for all role names retrieved
  let roleNamesResponse // Response from the API

  // create request object
  const requestObj = {
    customer: 'my_customer',
    maxResults: 100, // seems to be max allowed value regarding error message
  }

  // Fetch all role names
  do {
    // Fetch role names
    roleNamesResponse = await directory.roles.list(requestObj)

    roleNames.push(...roleNamesResponse.data.items)

    //repeat until there are no more pages(i.e. no nextPageToken returned by google)
  } while ((requestObj.pageToken = roleNamesResponse.data.nextPageToken))

  return roleNames // Return the role names
}

async function listRoleAssignments({ userEmail, client }) {
  logger.debug('Reached listRoleAssignments endpoint.')
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))
  const roleAssignments = [] // Container for all role assignments retrieved
  let pageToken = null // In roleAssignments.list, there seems to be no limit to maxResult, so I set the pageToken myself.
  let roleAssignmentsResponse // Response from the API

  // create request object
  const requestObj = {
    customer: 'my_customer',
    maxResults: 100, // set the same value as maxResults in roles.list
    pageToken: pageToken,
  }

  // Fetch all role assignments
  do {
    // Fetch role assignments
    roleAssignmentsResponse = await directory.roleAssignments.list(requestObj)

    roleAssignments.push(...roleAssignmentsResponse.data.items)

    //repeat until there are no more pages(i.e. no nextPageToken returned by google)
  } while ((requestObj.pageToken = roleAssignmentsResponse.data.nextPageToken))

  return roleAssignments // Return the role assignments
}

/**
 * Retrieves all organizational units in the organization.
 *
 * This function takes the email address of the user to impersonate and an optional existing impersonated auth client.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all organizational units in the organization.
 *
 * @param {Object} params - The parameters needed to list the organizational units.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {Object} [params.client] - An existing impersonated auth client for Directory API.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of objects, each containing details of an organizational unit.
 * @throws {Error} - Throws an error if there is an issue with the API call.
 */
async function listOrgUnits({ userEmail, client }) {
  // Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  const response = await directory.orgunits.list({
    customerId: 'my_customer',
    type: 'all', // fetch all OU hierarchy paths
  })

  return response.data
}

module.exports = {
  listUsers,
  turnOffTwoSVForUsersWithRateLimit,
  deleteUsersWithRateLimit,
  listRoleNames,
  listRoleAssignments,
  listOrgUnits,
}
