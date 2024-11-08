const { google } = require('googleapis')
const { getClient } = require('../utility/groupsUtilityFunctions')

/**
 * Retrieves the list of all groups in the organization.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all groups in the organization.
 *
 * The function also takes an optional `client` parameter, which is a JWT client that can be used to authenticate the API call.
 * If `client` is provided, it will be used instead of creating a new JWT client.
 *
 * The function also takes an optional `query` parameter, which is a filter that can be used to narrow down the results.
 * For example, if `query` is set to `'email:example.com'`, only groups with the domain `example.com` will be returned.
 *
 * @param {Object} params - The parameters needed to fetch the groups.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {string} params.projectId - The project ID of the service account key.
 * @param {string} params.serviceAccountEmail - The email address of the service account.
 * @param {string} params.serviceAccountPrivateKey - The private key of the service account.
 * @param {Object} [params.client=null] - The JWT client to use to authenticate the API call.
 * @param {string} [params.query=''] - The filter to apply to the results.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of group objects.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function listGroups({ userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, client, query }) {
  // Retrieve JWT client or create it if it doesn't exist
  const jwtClient = client ?? (await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail))
  const directory = google.admin({
    version: 'directory_v1',
    auth: jwtClient,
  })
  const groups = [] // Container for all groups retrieved
  let groupsResponse // Response from the API

  //create request object
  const requestObj = {
    customer: 'my_customer',
    maxResults: 200, //max allowed value
    orderBy: 'email',
  }

  // Add query(filter) if it exists
  if (query) {
    requestObj.query = query
  }

  // Fetch all groups
  do {
    // Fetch groups
    groupsResponse = await directory.groups.list(requestObj)

    //if there are no groups in the organization, return an empty array
    if (typeof groupsResponse.data.groups === 'undefined') break

    // Append the fetched groups to the groups array
    groups.push(...groupsResponse.data.groups)

    //repeat until there are no more pages(i.e. no nextPageToken returned by google)
  } while ((requestObj.pageToken = groupsResponse.data.nextPageToken)) // Continue fetching groups while there are more pages

  return groups // Return all fetched groups
}

/**
 * Retrieves the details of a specific group in the organization.
 *
 * This function takes the email address of a user to impersonate, a project ID, a service account email address, a service account private key,
 * and the email address of the group to retrieve its details.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the service account key.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {string} groupEmail - The email address of the group to retrieve its details.
 * @param {Object} [client=null] - The JWT client to use to authenticate the API call.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the group's details.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function getGroupByEmail({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groupEmail,
  client,
}) {
  // Retrieve JWT client or create it if it doesn't exist
  const jwtClient = client ?? (await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail))
  const admin = google.admin({ version: 'directory_v1', auth: jwtClient }) // Create the Admin Directory API client
  const response = await admin.groups.get({
    groupKey: groupEmail,
  }) // Get the group details
  return response.data // Return the group details
}

/**
 * Retrieves the list of members of a specific group in the organization.
 *
 * This function takes a user's email, project ID, service account credentials, and the email address of the group,
 * to fetch the list of its members. It can include both direct and indirect members based on the `includeDerivedMembership` flag.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the service account key.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {string} groupEmail - The email address of the group to retrieve its members.
 * @param {boolean} includeDerivedMembership - Flag to include indirect members if true.
 * @param {Object} [client=null] - The JWT client to use to authenticate the API call.
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
  client,
}) {
  // Retrieve JWT client or create it if it doesn't exist
  const jwtClient = client ?? (await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail))

  const directory = google.admin({
    version: 'directory_v1',
    auth: jwtClient,
  })

  const members = [] // Container for members retrieved
  let membersResponse // Response from the API

  //create request object
  const requestObj = {
    groupKey: groupEmail,
    maxResults: 200, //max allowed value
    includeDerivedMembership: includeDerivedMembership,
  }

  do {
    // Fetch members
    membersResponse = await directory.members.list(requestObj)

    //if there are no members in the group, return an empty array
    if (typeof membersResponse.data.members === 'undefined') break

    // Append the fetched groups to the members array
    members.push(...membersResponse.data.members)
  } while ((requestObj.pageToken = membersResponse.data.nextPageToken)) // Continue fetching members while there are more pages

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

  const activityLogs = [] // Container for activity logs retrieved
  let activityResponse // Response from the API

  // Retrieve JWT client or create it if it doesn't exist
  const jwtClient = client ?? (await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail))
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

  //Fetch activity logs
  do {
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

    activityResponse = await directory.activities.list(requestObj) // Call the API

    // Append the fetched groups to the activity logs array
    if (typeof activityResponse.data.items !== 'undefined') {
      activityLogs.push(...activityResponse.data.items)
    }
  } while ((requestObj.pageToken = activityResponse.data.nextPageToken)) // Continue fetching activity logs while there are more pages

  return activityLogs // Return all fetched activity logs
}

/**
 * Retrieves the list of all activities related to joining groups in the organization.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, and `client` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all activities related to joining groups in the organization.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the service account key.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {Object} [client=null] - The JWT client to use to authenticate the API call.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of all activities related to joining groups in the organization.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function getJoinGroupsLogs({ userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, client }) {
  // Retrieve JWT client or create it if it doesn't exist
  const jwtClient = client ?? (await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail))

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
