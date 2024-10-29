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
async function listGroups({userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey}) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client
  const directory = google.admin({
    version: 'directory_v1',
    auth: jwtClient,
  }) // Create the Admin Directory API client
  let nextPageToken = null // Token to manage pagination
  const groups = [] // Container for all groups retrieved
  let groupsResponse // Response from the API

  // Fetch all groups
  do {
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
async function getGroupByEmail({userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail}) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client
  const directory = google.admin({
    version: 'directory_v1',
    auth: jwtClient,
  }) // Create the Admin Directory API client

  const group = await directory.groups.get({
    groupKey: groupEmail,
  }) // Get the group details

  return group.data // Return the group details
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
async function listGroupMembers({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groupEmail,
  includeDerivedMembership
}) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client
  const directory = google.admin({
    version: 'directory_v1',
    auth: jwtClient,
  }) // Create the Admin Directory API client
  let nextPageToken = null // Token to manage pagination
  const members = [] // Container for members retrieved
  let membersResponse // Response from the API

  //Fetch members
  do {
    membersResponse = await directory.members.list({
      groupKey: groupEmail,
      maxResults: 200, //max allowed value
      includeDerivedMembership,
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
 * Retrieves all activity logs related to a specific application or type of logs in the organization.
 * Uses the provided user email, project ID, service account email, and private key to authenticate.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the GCP project.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {string} [appName='groups_enterprise'] - The application name for filtering the logs('groups_enterprise','groups', 'admin').
 * @param {string} [typeOfLogs=''] - The type of logs to retrieve.
 * @param {Object} [client=null] - The JWT client to use for the API calls.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of activity logs.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function getAllGroupsLogs({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  appName = 'groups_enterprise',
  typeOfLogs,
  client
}) {
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

  // get JWT client from the parameter
  // If the client is not provided, create a new one
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)
  const directory = google.admin({
    version: 'reports_v1',
    auth: jwtClient,
  })

  const requestObj = {
    customerId: 'my_customer',
    userKey: 'all',
    applicationName: appName,
    maxResults: 1000, // max allowed value
    eventName: typeOfLogs,
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

  let nextPageToken = null // Token to manage pagination
  const activityLogs = [] // Container for activity logs retrieved
  let activityResponse // Response from the API

  //Fetch activity logs
  do {
    activityResponse = await directory.activities.list(requestObj) // Call the API

    // Append the fetched groups to the activity logs array
    if (typeof activityResponse.data.items !== 'undefined') {
      activityLogs.push(...activityResponse.data.items)
      nextPageToken = activityResponse.data.nextPageToken // Store the next page token for pagination
      requestObj.pageToken = nextPageToken // Unlike drive or directory, reports do not support null page tokens
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
async function getJoinGroupsLogs({userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey}) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client

  //Fetch activity logs
  try {
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
              userEmail,
              projectId,
              serviceAccountEmail,
              serviceAccountPrivateKey,
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
  } catch (error) {
    console.error('Error fetching group joined activity:', error)
    throw error
  }
}

async function listAllMembersInExportFormat({userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail}) {
  const AllMembers = await listGroupMembers({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    groupEmail,
    includeDerivedMembership: true
  })

  const directMembersSet = new Set((await listGroupMembers({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    groupEmail,
    includeDerivedMembership: false
  })).map(member => member.email))

  // Redis can be used
  const groupNameMap = new Map((await listGroups({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey
  })).map(group => [group.email, group.name]))

  // Redis can be used
  const userNameMap = new Map((await listUsers({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey
  })).map(user => [user.primaryEmail, user.name.fullName]))

  const members = AllMembers.map(member => ({
    groupEmail,
    email: member.email,
    memberRelationType: directMembersSet.has(member.email) ? 'DIRECT' : 'INDIRECT',
    memberType: member.type
  }))

  members.forEach(member => {
    switch (member.memberType) {
      case 'GROUP':
        member.name = groupNameMap.get(member.email)
        break
      case 'USER':
        member.name = userNameMap.get(member.email)
        break
      case 'CUSTOM':
        member.name = 'All users in the organization'
        break
    }
  })
  
  const actualKeys = [
    'groupEmail',
    'email',
    'name',
    'memberRelationType',
    'memberType',
  ]

  const displayKeys = [
    'Group Email [Required]',
    'Member Email',
    'Member Name',
    'Member Relation Type',
    'Member Type',
  ]

  return members
}


// broken
async function listUsers({userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey}) {
  const jwtClient = getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)
  let nextPageToken = null // Token to manage pagination
  const users = [] // Container for all users retrieved
  let usersResponse // Response from the API

  // Fetch all users
  do {
    try {
      const directory = google.admin({
        version: 'directory_v1',
        auth: jwtClient,
      })

      usersResponse = await directory.users.list({
        // customer: 'my_customer',
        // maxResults: 200, //max allowed value
        // orderBy: 'email',
        // pageToken: nextPageToken,
        domain: process.env.DOMAIN_TEST,
      })
      // Append the fetched users to the users array
      users.push(...usersResponse.data.users)

      // Store the next page token for pagination
      nextPageToken = groupsResponse.data.nextPageToken
    } catch (error) {
      // Log the error and rethrow it if users fetching fails
      console.error('Error fetching users:', error.message)
      throw error
    }
  } while (nextPageToken) // Continue fetching users while there are more pages

  return users // Return all fetched users
}

module.exports = {
  listGroups,
  getGroupByEmail,
  listGroupMembers,
  getAllGroupsLogs,
  getJoinGroupsLogs,
  listAllMembersInExportFormat
}
