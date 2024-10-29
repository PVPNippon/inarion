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
async function listGroups({ userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey }) {
  let nextPageToken = null // Token to manage pagination
  let groups = [] // Container for all groups retrieved
  let groupsResponse // Response from the API

  // Fetch all groups
  do {
    const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client
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
async function getGroupByEmail({ userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail }) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client
  const admin = google.admin({ version: 'directory_v1', auth: jwtClient }) // Create the Admin Directory API client
  const response = await admin.groups.get({
    groupKey: groupEmail,
  }) // Get the group details
  return response.data // Return the group details
}

/**
 * Retrieves the list of members of a group.
 *
 * This function takes a group's email address and a boolean specifying whether to include derived membership,
 * and returns a list of its members, including both direct and indirect members.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the service account key.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {string} groupEmail - The email address of the group.
 * @param {boolean} includeDerivedMembership - Whether to include derived membership.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of group members.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function listGroupMembers({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groupEmail,
  includeDerivedMembership,
}) {
  let nextPageToken = null // Token to manage pagination
  let members = [] // Container for members retrieved
  let membersResponse // Response from the API

  //Fetch members
  do {
    const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client
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
  } while (nextPageToken) // Continue fetching members while there are more pages

  return members // Return all fetched members
}

/**
 * Retrieves the list of activity logs related to groups in the organization.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all activity logs related to groups in the organization.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the service account key.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {string} [appName='groups_enterprise'] - The type of Google service to get activity logs from.
 * @param {string} [typeOfLog=''] - The type of activity logs to get.
 * @param {Object} [client=null] - The JWT client to use to authenticate the API call.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of activity logs.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function getAllGroupsLogs(
  { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey },
  appName = 'groups_enterprise',
  typeOfLogs = '',
  client = null
) {
  //'groups_enterprise' don't have 'join_via_mail' type of logs, but "groups" have
  //=> if appName is 'groups_enterprise' and typeOfLogs is 'join_via_mail', return nothing
  //https://developers.google.com/admin-sdk/reports/v1/appendix/activity/groups-enterprise
  //https://developers.google.com/admin-sdk/reports/v1/appendix/activity/groups
  if (appName === 'groups_enterprise' && typeOfLogs === 'join_via_mail') {
    return
  }

  //in admin activity events we need only one event, so skip for all other activity types
  if (appName === 'admin' && typeOfLogs !== 'add_member') {
    return
  }

  let jwtClient = client // get JWT client from the parameter
  let nextPageToken = null // Token to manage pagination
  let activityLogs = [] // Container for activity logs retrieved
  let activityResponse // Response from the API

  // If the client is not provided, create a new one
  if (!client) {
    jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)
  }

  //Fetch activity logs
  do {
    const directory = google.admin({
      version: 'reports_v1',
      auth: jwtClient,
    })

    // Create the request object
    const requestObj = {
      customerId: 'my_customer',
      userKey: 'all',
      applicationName: appName,
      maxResults: 1000, //max allowed value
    }

    // Add the type of logs if it is provided
    if (typeOfLogs) {
      requestObj.eventName = typeOfLogs
    }

    //the same type of logs are called 'add_member' in 'enterprise_groups' and 'add_user' in 'groups'
    //by the way, in both cases member or user means both users or groups, so 'add_user' is kinda misleading
    //=> we swap 'add_member' to 'add_user' if type of app is "groups"
    if (appName === 'groups' && typeOfLogs === 'add_member') {
      requestObj.eventName = 'add_user'
    }

    //'add_member' is called 'ADD_GROUP_MEMBER' in 'admin'
    //and it's ...drumroll.. drumroll... CASE SENSITIVE
    if (appName === 'admin' && typeOfLogs === 'add_member') {
      requestObj.eventName = 'ADD_GROUP_MEMBER'
    }

    // Add the next page token if it exists
    //unlike drive or directory, reports do not support null page tokens
    //that's why I needed to add this logic
    if (nextPageToken !== null) {
      requestObj.pageToken = nextPageToken
    }

    activityResponse = await directory.activities.list(requestObj) // Call the API

    // Append the fetched groups to the activity logs array
    if (typeof activityResponse.data.items !== 'undefined') {
      activityLogs.push(...activityResponse.data.items)
      nextPageToken = activityResponse.data.nextPageToken // Store the next page token for pagination
    } else {
      nextPageToken = null //reset nextPageToken to null if no more pages return
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
async function getJoinGroupsLogs({ userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey }) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client

  const promises = []
  let allActivities = []

  //Get all activities related to joining groups(could identify 5 by now, could be more)
  //I'm not using "add_user" here, because it overlaps with "add_member" for "groups_enterprise"
  //But it WILL be used with "groups" later on the way because groups don't have "add_member"
  //It's impossible to query multiple apps at the same time, therefore we need to query each app separately
  //Could not find a way to specify multiple activities in the eventName field
  // => fetch each eventName separately and concat the results

  const appNames = ['groups_enterprise', 'groups', 'admin']
  const activityNames = ['add_member', 'accept_invitation', 'join', 'approve_join_request', 'join_via_mail']

  //Iterate through each app and each activity and push all into promises array
  appNames.forEach((appName) => {
    activityNames.forEach(async (activityName) => {
      const x = new Promise(async (resolve, reject) => {
        resolve(
          getAllGroupsLogs(
            {
              userEmail,
              projectId,
              serviceAccountEmail,
              serviceAccountPrivateKey,
            },
            appName,
            activityName,
            jwtClient
          )
        )
      })
      promises.push(x)
    })
  })

  //Iterate through the promises array and concat the results
  await Promise.all(promises).then((results) => {
    results.forEach((result) => {
      if (typeof result === 'undefined' || result === null) return
      allActivities = allActivities.concat(result)
    })
  })

  //Sort activities by time in descending order
  //Users may leave and rejoin etc, so we need the latest logs first
  allActivities.sort((a, b) => {
    return new Date(b.id.time) - new Date(a.id.time)
  })

  //Return the list of joined activity logs for "enterprise groups" and "groups" in customer organization
  return allActivities
}

module.exports = {
  listGroups,
  getGroupByEmail,
  listGroupMembers,
  getAllGroupsLogs,
  getJoinGroupsLogs,
}
