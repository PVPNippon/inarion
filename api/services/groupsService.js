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

    // If there are no groups in the organization, groupsResponse.data does not have the 'groups' property (tested and confirmed)
    // In that case, break this loop and return an empty array
    if (typeof groupsResponse.data.groups === 'undefined') break

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

  const group = await directory.groups.get({ groupKey: groupEmail }) // Get the group details

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

    // If there are no members in the group, memberResponse.data does not have the 'members' property (tested and confirmed)
    // In that case, break this loop and return an empty array
    if (typeof membersResponse.data.members === 'undefined') break

    members.push(...membersResponse.data.members)
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
  const reports = google.admin({
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
    activityResponse = await reports.activities.list(requestObj)
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

/**
 * Retrieves the list of lists of members of specified groups in exportable format.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, `groups` and `client` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to create a list of lists of members of the specified groups in exportable format.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the service account key.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {Object[]} groups - An array of groups.
 *                            Each element should be in the following format:
 *                            {
 *                              "groupEmail": <string: The email address of a group (REQUIRED)>,
 *		                          "includeDerivedMembership": <boolean: whether or not you need all direct and indirect members (OPTIONAL, defaults to false)>,
 *		                          "includeAllColumns": <boolean: whether or not you want to include the group email address of the group in each entry (OPTIONAL, defaults to false)>
 *                            }
 * @param {Object} [client=null] - The JWT client to use to authenticate the API call.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of objects. Each object represents a group and is in the following format:
 *                                {
 *                                  "group": <string: specified group's email address>,
 *                                  "includeDerivedMembership": <boolean: the value you specified for the group>,
 *                                  "includeAllColumns": <boolean: the value you specified for the group>,
 *                                  "members": <array: an array of objects. Each object represents a member of the group and is in the following format:
 *                                    {
 *                                      "email": <string: member's email address>,
 *                                      "role": <string: 'MEMBER', 'MANAGER' or 'OWNER' (Available only if "includeDerivedMembership" is false)>,
 *                                      "type": <string: 'USER' or 'GROUP'>,
 *                                      "name": <string: member's name>,
 *                                      "relationType": <string: 'DIRECT' or 'INDIRECT' (Available only if "includeDerivedMembership" is true)>,
 *                                      "group": <string: group's email (Available only if "includeAllColumns" is true)>
 *                                    }
 *                                  >
 *                                }
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
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

  // Map of all groups in the customer's organization to get group names from group addresses
  // (key, value) = (group email address, group name)
  const groupNameMap = new Map()

  const allGroupsInOrganization = await listGroups({ client: jwtClient })
  allGroupsInOrganization.forEach(group => {
    // Add (key, value) = (primary email address, group name) to the map
    groupNameMap.set(group.email, group.name)
    // For each alias of the group, add (key, value) = (alias, group name) to the map
    group.aliases?.forEach(alias => groupNameMap.set(alias, group.name))
    // For each non-editable alias (e.g. test domain aliases), add (key, value) = (alias, group name) to the map
    group.nonEditableAliases?.forEach(nonEditableAlias => groupNameMap.set(nonEditableAlias, group.name))
  })
  
  // Map of all users in the customer's organization to get user names from user addresses
  // (key, value) = (user email address, user name)
  const userNameMap = new Map()

  // Add (key, value) = (user email (either primary or alias), user name) to the map
  const allUsersInOrganization = await listUsers({ client: jwtClient })
  allUsersInOrganization.forEach(user => user.emails.forEach(({address}) => userNameMap.set(address, user.name.fullName)))

  // Each element of this array is a list of all direct members of each group specified in the 'groups' parameter
  const directMembersArray = await Promise.all(groups.map(({groupEmail}) => listGroupMembers({
    groupEmail,
    includeDerivedMembership: false,
    client: jwtClient
  })))

  // Each element of this array is either:
  // (A) a list of all direct and indirect members of a group, if 'includeDerivedMembership' for the group is true
  // (B) null, if 'includeDerivedMembership' for the group is false
  const allMembersArray = await Promise.all(groups.map(({groupEmail, includeDerivedMembership}) => includeDerivedMembership ?
    listGroupMembers({
      groupEmail,
      includeDerivedMembership,
      client: jwtClient
    }) : null
  ))

  // Each element of this array is a list of members of each group specified in the 'groups' parameter,
  // and each entry of the list, which represents a member, is in one of the 4 possible formats below:
  //
  // (1-a) Both 'includeDerivedMembership' and 'includeAllColumns' are true:
  // {
  //    group: <group's email>
  //    email: <member's email>
	//    name: <member's name>
	//    relationType: <'DIRECT' or 'INDIRECT'>
	//    type: <'USER' or 'GROUP'>
  // }
  //
  // (1-b) 'includeDerivedMembership' is true, and 'includeAllColumns' is false:
  // {
  //    email: <member's email>
	//    name: <member's name>
	//    relationType: <'DIRECT' or 'INDIRECT'>
	//    type: <'USER' or 'GROUP'>
  // }
  //
  // (2-a) 'includeDerivedMembership' is false, and 'includeAllColumns' is true:
  // {
  //    group: <group's email>
  //    email: <member's email>
	//    name: <member's name>
	//    role: <'MEMBER', 'MANAGER' or 'OWNER'>
	//    type: <'USER' or 'GROUP'>
  // }
  //
  // (2-b) Both 'includeDerivedMembership' and 'includeAllColumns' are false:
  // {
  //    email: <member's email>
	//    name: <member's name>
	//    role: <'MEMBER', 'MANAGER' or 'OWNER'>
	//    type: <'USER' or 'GROUP'>
  // }
  //
  return groups.map((group, index) =>  {

    const members = group.includeDerivedMembership ?
      // If 'includeDerivedMembership' of the group is true, the list contains both direct and indirect members
      // Each entry of the list has both 'email' and 'type' properties
      // See (1-a) and (1-b) above
      allMembersArray[index].map(member => ({
        email: member.email,
        type: member.type
      })) :
      // If 'includeDerivedMembership' of the group is false, the list contains only direct members
      // Each entry of the list has 'email', 'role' and 'type' properties
      // See (2-a) and (2-b) above
      directMembersArray[index].map(member => ({
        email: member.email,
        role: member.role,
        type: member.type
      }))

    // Each entry of the list contains 'name' property
    members.forEach(member => {
      switch (member.type) {
        case 'GROUP':
          member.name = groupNameMap.get(member.email) ?? 'Member' // Let us call external groups just 'Member'
          break
        case 'USER':
          member.name = userNameMap.get(member.email) ?? 'Member' // Let us call external users just 'Member'
          break
        case 'CUSTOMER': // Means 'All members in the organization' (https://developers.google.com/admin-sdk/directory/reference/rest/v1/members#Member, https://support.google.com/a/answer/9689259)
          member.name = 'All users in the organization'
          member.email = '' // 'All members in the organization' does not have the 'email' property
          member.type = 'GROUP'
          break
      }
    })

    // If 'includeDerivedMembership' of the group is true, each entry of list has the 'relationType' property
    // See (1-a) and (1-b) above
    if (group.includeDerivedMembership) {
      const directMembersSet = new Set(directMembersArray[index].map(member => member.email)) // Set of all direct members of the group
      members.forEach(member => member.relationType = directMembersSet.has(member.email) ? 'DIRECT' : 'INDIRECT')
    }

    // If 'includeAllColumns' of the group is true, each entry of the list has the 'group' property
    // See (1-a) and (2-a) above
    if (group.includeAllColumns) {
      members.forEach(member => member.group = group.groupEmail)
    }

    return {
      group: group.groupEmail,
      includeDerivedMembership: group.includeDerivedMembership ? true : false,
      includeAllColumns: group.includeAllColumns ? true : false,
      members
    }
  })
}

/**
 * Retrieves the list of all users in the organization.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, and `client` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all users in the organization.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the service account key.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {Object} [client=null] - The JWT client to use to authenticate the API call.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of all users in the organization.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
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

/**
 * Updates group info using Groups Settings API.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Groups Settings API
 * to update group info.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the GCP project.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {string} groupEmail - The email address of the group to be updated.
 * @param {Object} resource - The group info to be updated. See https://developers.google.com/admin-sdk/groups-settings/v1/reference/groups#json for details.
 * @param {Object} [client=null] - The JWT client to use to authenticate the API call.
 * @returns {Promise<Object>} - A promise that resolves to the updated group info.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function updateGroup({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groupEmail,
  resource,
  client
}) {
  // Create a JWT client if 'client' is not specified
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  // Create the Groups Settings API client
  const groupsSettings = google.groupssettings({
    version: 'v1',
    auth: jwtClient,
  })

  const response = await groupsSettings.groups.update({
    groupUniqueId: groupEmail,
    resource
  })

  return response
}

/**
 * Delete a member from a group using Admin Directory API.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to delete a member from a group.
 * 
 * The target group has to belong to the customer's organization, while the target member (either a user or a group) does not.
 * The role of the target member (OWNER, MANAGER or MEMBER) does not matter.
 * The 'whoCanLeaveGroup' setting of the target group does not matter.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the GCP project.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {string} groupEmail - The email address of the group to which the member specified by `memberEmail` belongs.
 * @param {string} memberEmail - The email address of the member who is to be deleted from the group specified by `groupEmail`.
 * @param {Object} [client=null] - The JWT client to use to authenticate the API call.
 * @returns {Promise<Object>} - A promise that resolves to an object which has info about the result of the member deletion.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function deleteMember({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groupEmail,
  memberEmail,
  client
}) {
  // Create a JWT client if 'client' is not specified
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  // Create the Admin Directory API client
  const directory = google.admin({
    version: 'directory_v1',
    auth: jwtClient,
  })

  // If successful, this object has a property 'status' with a value 204.
  // If not, this code will throw an error.
  // error.status can be:
  //
  // - 400, if memberEmail is not a Google account or group. error.message is 'Missing required field: memberKey'.
  //
  // - 403, if memberEmail is either a Google account or group, and (A) groupEmail does not exist in the customer's organization or (B) groupEmail is a user's in the customer's organization.
  // error.message is 'Not Authorized to access this resource/api'.
  //
  // - 404, if groupEmail exists as a group in the customer's organization, and memberEmail is either a Google account or group, and memberEmail does not belong to groupEmail.
  // In this case, error.message is 'Resource Not Found: memberKey'.
  // Or if the domain of groupEmail is the customer's and does not exists, and memberEmail is either a Google account or group.
  // In this case, error.message is 'Resource Not Found: groupKey'.
  //
  // - Other unknown value (maybe 500)
  const response = await directory.members.delete({
    groupKey: groupEmail,
    memberKey: memberEmail
  })
  
  return response
}

/**
 * Delete multiple members from a group using Admin Directory API.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to delete multiple members from a group.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the GCP project.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {string} groupEmail - The email address of the group to which the members specified by `memberEmails` belong.
 * @param {string[]} memberEmails - The email addresses of the members who are to be deleted from the group specified by `groupEmail`.
 * @param {Object} [client=null] - The JWT client to use to authenticate the API call.
 * @returns {Promise<Object>} - A promise that resolves to an object which has 2 arrays, an array of deleted members and an array of not deleted members.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function deleteMembers({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groupEmail,
  memberEmails,
  client
}) {
  // Create a JWT client if 'client' is not specified
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  const deletedMembers = [] // Container for deleted members
  const undeletedMembers = [] // Container for not deleted members

  // Because calling deleteMember() and waiting for the deletion result multiple times takes too much time,
  // we need to use either Promise.all() or Promise.allSettled().
  // The problem of using either Promise.all() or Promise.allSettled() is there is possibility that some API calls may succeed and some API calls may fail.
  // In other words, some members in the 'members' array may be deleted while some members may not.
  // My choice is using Promise.allSettled() to record which members were successfully deleted and which members were not, and returning the record to the caller.
  const responseArray = await Promise.allSettled(memberEmails.map(memberEmail => deleteMember({
    groupEmail,
    memberEmail,
    client: jwtClient
  })))
  
  for (let i = 0; i < memberEmails.length; i++) {
    const memberEmail = memberEmails[i]

    // If the deletion of a member succeeded, put the member email and statusCode (= 204) to the deletedMembers array.
    if (responseArray[i].status === 'fulfilled') {
      deletedMembers.push({
        email: memberEmail,
        statusCode: responseArray[i].value.status
      })
    
    // If the deletion of a member failed, put the member email, statusCode and the error message to the undeletedMembers array.
    } else {
      undeletedMembers.push({
        email: memberEmail,
        statusCode: responseArray[i].reason.status,
        errorMessage: responseArray[i].reason.message
      })
    }
  }

  return { deletedMembers, undeletedMembers }
}

/**
 * Delete multiple members from a group using Admin Directory API.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to delete multiple members from a group.
 * 
 * This function is just a wrapper of deleteMembers().
 * This function restricts concurrent Google API calls to a certain number.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the GCP project.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {string} groupEmail - The email address of the group to which the members specified by `memberEmails` belong.
 * @param {string[]} memberEmails - The email addresses of the members who are to be deleted from the group specified by `groupEmail`.
 * @param {Object} [client=null] - The JWT client to use to authenticate the API call.
 * @returns {Promise<Object>} - A promise that resolves to an object which has 2 arrays, an array of deleted members and an array of not deleted members.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function deleteMembersWithRateLimit({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groupEmail,
  memberEmails,
  client
}) {
  // Create a JWT client if 'client' is not specified
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  // Ref: https://developers.google.com/admin-sdk/directory/v1/limits
  // According to the document, "The default value" of userRateLimitExceeded "set in the Google Cloud console is 2,400 queries per minute per user per Google Cloud project".
  // So I guess 40 (= 2,400 / 60) concurrent API calls are safe.
  const BULK_DELETE_THRESHOLD = 40

  // Let's say BULK_DELETE_THRESHOLD = 40 and members.length = 100.
  // In this case, we should repeat 40 concurrent API calls 2 (= Math.floor(members.length / BULK_DELETE_THRESHOLD)) times
  // and 20 (= members.length % BULK_DELETE_THRESHOLD) concurrent API calls once.
  const numOfBulkAPICalls = Math.floor(memberEmails.length / BULK_DELETE_THRESHOLD)
  const numOfRemainingAPICalls = memberEmails.length % BULK_DELETE_THRESHOLD

  const deletedMembers = []
  const undeletedMembers = []

  for (let i = 0; i < numOfBulkAPICalls; i++) {
    const startIndex = i * BULK_DELETE_THRESHOLD
    const endIndex = startIndex + BULK_DELETE_THRESHOLD

    const response = await deleteMembers({
      groupEmail,
      memberEmails: memberEmails.slice(startIndex, endIndex),
      client: jwtClient
    })

    deletedMembers.push(...response.deletedMembers)
    undeletedMembers.push(...response.undeletedMembers)
  }

  if (numOfRemainingAPICalls > 0) {
    const startIndex = memberEmails.length - numOfRemainingAPICalls

    const response = await deleteMembers({
      groupEmail,
      memberEmails: memberEmails.slice(startIndex),
      client: jwtClient
    })

    deletedMembers.push(...response.deletedMembers)
    undeletedMembers.push(...response.undeletedMembers)
  }

  return { deletedMembers, undeletedMembers }
}

/**
 * Delete a member from multiple groups using Admin Directory API.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to delete a member from multiple groups.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the GCP project.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {string[]} groupEmails - The email addresses of the groups to which the member specified by `memberEmail` belongs.
 * @param {string} memberEmail - The email address of the member who is to be deleted from the groups specified by `groupEmails`.
 * @param {Object} [client=null] - The JWT client to use to authenticate the API call.
 * @returns {Promise<Object>} - A promise that resolves to an object which has 2 arrays, an array of deleted members and an array of not deleted members.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function deleteMemberFromGroups({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groupEmails,
  memberEmail,
  client
}) {
  // Create a JWT client if 'client' is not specified
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  const succeededGroups = [] // Container for groups which the member was successfully deleted from
  const failedGroups = [] // Container for groups which the member failed to be deleted from

  const responseArray = await Promise.allSettled(groupEmails.map(groupEmail => deleteMember({
    groupEmail,
    memberEmail,
    client: jwtClient
  })))

  groupEmails.forEach((groupEmail, index) => {

    // If the deletion succeeded, put the group email and statusCode (= 204) to the succeededGroups array.
    if (responseArray[index].status === 'fulfilled') {
      succeededGroups.push({
        email: groupEmail,
        statusCode: responseArray[index].value.status
      })
    
    // If the deletion failed, put the group email, statusCode and the error message to the failedGroups array.
    } else {
      failedGroups.push({
        email: groupEmail,
        statusCode: responseArray[index].reason.status,
        errorMessage: responseArray[index].reason.message
      })
    }
  })

  return { succeededGroups, failedGroups }
}

async function deleteMemberFromGroupsWithRateLimit({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groupEmails,
  memberEmail,
  client
}) {
  // Create a JWT client if 'client' is not specified
  const jwtClient = client ?? await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  const succeededGroups = [] // Container for groups which the member was successfully deleted from
  const failedGroups = [] // Container for groups which the member failed to be deleted from

  const responseArray = await Promise.allSettled(groupEmails.map(groupEmail => deleteMember({
    groupEmail,
    memberEmail,
    client: jwtClient
  })))

  groupEmails.forEach((groupEmail, index) => {

    // If the deletion succeeded, put the group email and statusCode (= 204) to the succeededGroups array.
    if (responseArray[index].status === 'fulfilled') {
      succeededGroups.push({
        email: groupEmail,
        statusCode: responseArray[index].value.status
      })
    
    // If the deletion failed, put the group email, statusCode and the error message to the failedGroups array.
    } else {
      failedGroups.push({
        email: groupEmail,
        statusCode: responseArray[index].reason.status,
        errorMessage: responseArray[index].reason.message
      })
    }
  })

  return { succeededGroups, failedGroups }
}

module.exports = {
  listGroups,
  getGroupByEmail,
  listGroupMembers,
  getAllGroupsLogs,
  getJoinGroupsLogs,
  listMembersInExportFormat,
  updateGroup,
  deleteMembersWithRateLimit,
}