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
async function listGroups({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  client
}) {
  // Create a JWT client if 'client' is not specified
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  // Create the Admin Directory API client
  const directory = google.admin({
    version: 'directory_v1',
    auth: jwtClient,
  })

  // Request parameters
  const requestObj = {
    customer: 'my_customer',
    maxResults: 200, //max allowed value
    orderBy: 'email',
  }

  const groups = [] // Container for all groups retrieved
  let groupsResponse // Response from the API

  // Fetch all groups
  do {
    groupsResponse = await directory.groups.list(requestObj)
    groups.push(...groupsResponse.data.groups)
  } while (requestObj.pageToken = groupsResponse.data.nextPageToken) // Continue fetching groups while there are more pages

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
async function getGroupByEmail({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groupEmail,
  client
}) {
  // Create a JWT client if 'client' is not specified
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  // Create the Admin Directory API client
  const directory = google.admin({
    version: 'directory_v1',
    auth: jwtClient,
  })

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
  includeDerivedMembership,
  client
}) {
  // Create a JWT client if 'client' is not specified
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  // Create the Admin Directory API client
  const directory = google.admin({
    version: 'directory_v1',
    auth: jwtClient,
  })

  // Request parameters
  const requestObj = {
    groupKey: groupEmail,
    maxResults: 200, //max allowed value
    includeDerivedMembership,
  }
  
  const members = [] // Container for members retrieved
  let membersResponse // Response from the API

  // Fetch members
  do {
    membersResponse = await directory.members.list(requestObj)
    if (membersResponse.data.members) {
      members.push(...membersResponse.data.members)
    }
  } while (requestObj.pageToken = membersResponse.data.nextPageToken) // Continue fetching members while there are more pages

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

  // Create a JWT client if 'client' is not specified
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  // Create the Admin Reports API client
  const directory = google.admin({
    version: 'reports_v1',
    auth: jwtClient,
  })

  // Request parameters
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

  const activityLogs = [] // Container for activity logs retrieved
  let activityResponse // Response from the API

  // Fetch activity logs
  do {
    activityResponse = await directory.activities.list(requestObj)
    if (activityResponse.data.items) {
      activityLogs.push(...activityResponse.data.items)
    }
  } while (requestObj.pageToken = activityResponse.data.nextPageToken) // Continue fetching activity logs while there are more pages

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
async function getJoinGroupsLogs({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  client
}) {
  // Create a JWT client if 'client' is not specified
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  //Fetch activity logs
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
          getAllGroupsLogs({
            userEmail,
            projectId,
            serviceAccountEmail,
            serviceAccountPrivateKey,
            appName,
            activityName,
            jwtClient
          })
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



async function listMembersInExportFormat({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groups,
  client
}) {
  // Create a JWT client if 'client' is not specified
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  // Redis can be used
  // Need all groups in the customer's organization to get group names from group addresses
  const groupNameMap = new Map()

  const allGroupsInOrganization = await listGroups({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    client: jwtClient
  })

  allGroupsInOrganization.forEach(group => {
    groupNameMap.set(group.email, group.name)

    group.aliases?.forEach(alias => groupNameMap.set(alias, group.name))

    group.nonEditableAliases?.forEach(nonEditableAlias => groupNameMap.set(nonEditableAlias, group.name))
  })
  
  // Redis can be used
  // Need all users in the customer's organization to get user names from user addresses
  const userNameMap = new Map()

  const allUsersInOrganization = await listUsers({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    client: jwtClient
  })

  allUsersInOrganization.forEach(user => user.emails.forEach(({address}) => userNameMap.set(address, user.name.fullName)))


  const results = []

  for (const {groupEmail, includeDerivedMembership, includeAllColumns} of groups) {
    // All direct and indirect members of the group if includeDerivedMembership is true,
    // Otherwise all direct members of the group
    const members = await listGroupMembers({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmail,
      includeDerivedMembership,
      client: jwtClient
    })

    // Set 'Member Email' as 'email', 'Member Type' as 'type' and 'Member Role' as 'role'
    const result = members.map(member => ({
      email: member.email ?? "",
      type: member.type,
      role: member.role
    }))

    // Set 'Member Name' as 'name'
    // Let the name of external users or groups 'Member'
    result.forEach(member => {
      switch (member.type) {
        case 'GROUP':
          member.name = groupNameMap.get(member.email) ?? 'Member'
          break
        case 'USER':
          member.name = userNameMap.get(member.email) ?? 'Member'
          break
        case 'CUSTOMER':
          member.name = 'All users in the organization'
          member.type = 'GROUP'
          break
      }
    })

    // Set 'Group Email [Required]' as 'group' if includedAllColumns is true
    if (includeAllColumns) {
      result.forEach(member => member.group = groupEmail)
    }

    // Remove 'Member Role' and set 'Member Relation Type' as 'relationType' if includeDerivedMembership is true
    if (includeDerivedMembership) {
      const directMembers = await listGroupMembers({
        userEmail,
        projectId,
        serviceAccountEmail,
        serviceAccountPrivateKey,
        groupEmail,
        includeDerivedMembership: false,
        client: jwtClient
      })
      
      const directMembersSet = new Set(directMembers.map(member => member.email))

      result.forEach(member => {
        delete member.role
        member.relationType = directMembersSet.has(member.email) ? 'DIRECT' : 'INDIRECT'
      })
    }

    results.push({
      group: groupEmail,
      includeDerivedMembership: includeDerivedMembership ? true : false,
      includeAllColumns: includeAllColumns ? true : false,
      members: result
    })
  }

  return results
}

async function listUsers({userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, client}) {
  // Create a JWT client if 'client' is not specified
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  // Create the Admin Directory API client
  const directory = google.admin({
    version: 'directory_v1',
    auth: jwtClient,
  })

  // Request parameters
  const requestObj = {
    customer: 'my_customer',
    maxResults: 500, //max allowed value
    orderBy: 'email',
  }

  const users = [] // Container for all users retrieved
  let usersResponse // Response from the API

  // Fetch all users
  do {
    usersResponse = await directory.users.list(requestObj)
    users.push(...usersResponse.data.users)
  } while (requestObj.pageToken = usersResponse.data.nextPageToken) // Continue fetching users while there are more pages

  return users // Return all fetched users
}

module.exports = {
  listGroups,
  getGroupByEmail,
  listGroupMembers,
  getAllGroupsLogs,
  getJoinGroupsLogs,
  listMembersInExportFormat,
  listUsers,
}
