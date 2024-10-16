const { google } = require('googleapis')
const { getClient } = require('../utility/groupsUtilityFunctions')

/**
 * Retrieves the list of all groups in the organization.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all groups in the organization.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the GCP project.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of group objects.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function listGroups(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client
  let nextPageToken = null // Token to manage pagination
  let groups = [] // Container for all groups retrieved
  let groupsResponse // Response from the API

  // Fetch all groups
  do {
    try {
      const directory = google.admin({
        version: 'directory_v1',
        auth: jwtClient,
      })
      groupsResponse = await directory.groups.list({
        customer: 'my_customer',
        maxResults: 200, //max allowed value
        orderBy: 'email',
        pageToken: nextPageToken,
      })
      // Append the fetched groups to the groups array
      groups.push(...groupsResponse.data.groups)

      // Store the next page token for pagination
      nextPageToken = groupsResponse.data.nextPageToken
    } catch (error) {
      // Log the error and rethrow it if groups fetching fails
      console.error('Error fetching groups:', error.message)
      throw error
    }
  } while (nextPageToken) // Continue fetching groups while there are more pages

  return groups // Return all fetched groups
}

/**
 * Retrieves the details of a specific group.
 *
 * This function takes a group's email address and returns its details, such as its name, email address, and description.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the service account key.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {string} groupEmail - The email address of the group.
 * @returns {Promise<Object>} - A promise that resolves to the group details.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function getGroupByEmail(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client
  try {
    const admin = google.admin({ version: 'directory_v1', auth: jwtClient }) // Create the Admin Directory API client
    const response = await admin.groups.get({
      groupKey: groupEmail,
    }) // Get the group details
    return response.data // Return the group details
  } catch (error) {
    console.error('Error fetching group:', error)
    throw error
  }
}

/**
 * Retrieves the list of members of a group.
 *
 * This function takes a group's email address, and optionally whether to include derived membership,
 * and returns its members.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the service account key.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {string} groupEmail - The email address of the group.
 * @param {boolean} [includeDerivedMembership=false] - Whether to include derived membership in the response.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of group members.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function listGroupMembers(
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groupEmail,
  includeDerivedMembership
) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client
  let nextPageToken = null // Token to manage pagination
  let members = [] // Container for members retrieved
  let membersResponse // Response from the API

  //Fetch members
  do {
    try {
      const directory = google.admin({
        version: 'directory_v1',
        auth: jwtClient,
      })
      membersResponse = await directory.members.list({
        groupKey: groupEmail,
        maxResults: 200, //max allowed value
        includeDerivedMembership: includeDerivedMembership,
        pageToken: nextPageToken,
      })

      if (typeof membersResponse.data.members === 'undefined') {
        return [{ response: 'no members found' }]
      } // Return an array with error message if no members are found(temporary "error handling")

      // Append the fetched groups to the members array
      members.push(...membersResponse.data.members)

      // Store the next page token for pagination
      nextPageToken = membersResponse.data.nextPageToken
    } catch (error) {
      // Log the error and rethrow it if member fetching fails
      console.error('Error fetching members:', error.message)
      throw error
    }
  } while (nextPageToken) // Continue fetching members while there are more pages

  return members // Return all fetched members
}

/**
 * Retrieves a list of all activities in the organization related to groups.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all activities related to groups in the organization.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the service account key.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of activity logs.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function getAllGroupsLogs(
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  typeOfLogs = '',
  client = null
) {
  let jwtClient = client

  if (!client) {
    jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client
  }

  let nextPageToken = null // Token to manage pagination
  let activityLogs = [] // Container for activity logs retrieved
  let activityResponse // Response from the API

  //Fetch activity logs
  do {
    try {
      const directory = google.admin({
        version: 'reports_v1',
        auth: jwtClient,
      })

      const requestObj = {
        customerId: 'my_customer',
        userKey: 'all',
        applicationName: 'groups_enterprise',
        maxResults: 1000, //max allowed value
      }

      if (typeOfLogs) {
        requestObj.eventName = typeOfLogs
      }

      // Add the next page token if it exists
      //unlike drive or directory, reports do not support null page tokens
      //that's why I needed to add this logic
      if (nextPageToken !== null) {
        requestObj.pageToken = nextPageToken
      }

      activityResponse = await directory.activities.list(requestObj)

      // Append the fetched groups to the activity logs array
      if (typeof activityResponse.data.items !== 'undefined') {
        activityLogs.push(...activityResponse.data.items)
        nextPageToken = activityResponse.data.nextPageToken // Store the next page token for pagination
      } else {
        nextPageToken = null //reset nextPageToken to null if no more pages return
      }
    } catch (error) {
      // Log the error and rethrow it if activity logs fetching fails
      console.error('Error fetching activity logs:', error.message)
      throw error
    }
  } while (nextPageToken) // Continue fetching activity logs while there are more pages

  return activityLogs // Return all fetched activity logs
}

/**
 * Retrieves the list of all activities in the organization related to joining groups.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all activities related to joining groups in the organization.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the GCP project.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of group joined activity logs.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function getJoinGroupsLogs(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client

  //Fetch activity logs
  try {
    const promises = []
    let allActivities = []

    // Get all activities related to joining groups(could identify 2 by now, could be more)
    //I'm not using "add_user" because it coincides with "add_member"(i.e. for each add_user activity there is also add_member log)
    // Could not find a way to specify multiple activities in the eventName field
    // => fetch each eventName separately and concat the results
    const activityNames = ['add_member', 'accept_invitation']

    activityNames.forEach(async (activityName) => {
      const x = new Promise(async (resolve, reject) => {
        resolve(
          getAllGroupsLogs(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, activityName, jwtClient)
        )
      })
      promises.push(x)
    })

    await Promise.all(promises).then((results) => {
      results.forEach((result) => {
        allActivities = allActivities.concat(result)
      })
    })

    //Return the list of group joined activity in customer organization
    return allActivities
  } catch (error) {
    console.error('Error fetching group joined activity:', error)
    throw error
  }
}

module.exports = {
  listGroups,
  getGroupByEmail,
  listGroupMembers,
  getAllGroupsLogs,
  getJoinGroupsLogs,
}
