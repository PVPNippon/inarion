const { getImpersonatedClientInstanceForAdmin } = require('./authService')

/**
 * Retrieves the list of all groups in the organization.
 *
 * This function takes the `userEmail` and optional `client` and `query` from the request body.
 * It uses these values to make a request to the Google Admin Directory API
 * to list all groups in the organization. If `query` is given, it filters the groups based on the query.
 *
 * @param {Object} params - The object containing the `userEmail` and optional `client` and `query` in the request body.
 * @param {string} params.userEmail - The email address of the user performing the action.
 * @param {Object} [params.client] - The pre-authorized client to use for the API call.
 * @param {string} [params.query] - The filter to apply to the groups list.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of objects containing the groups' details.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function listGroups({ userEmail, client, query }) {
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))
  const groups = [] // Container for all groups retrieved
  let groupsResponse // Response from the API

  // create request object
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
 * Retrieves the details of a single group by its email address.
 *
 * This function takes the email address of the user to impersonate, the email address of the group to retrieve,
 * and optionally an existing impersonated auth client for Directory API.
 * It uses these values to make a request to the Google Admin Directory API
 * to retrieve the group's details.
 *
 * @param {Object} options - An object containing the following properties:
 *   - {string} userEmail - The email address of the user to impersonate.
 *   - {string} groupEmail - The email address of the group to retrieve.
 *   - {Object} [client] - An existing impersonated auth client for Directory API.
 * @returns {Promise<Object>} - A promise that resolves to the group's details or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function getGroupByEmail({ userEmail, groupEmail, client }) {
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  // Get the group details
  const response = await directory.groups.get({
    groupKey: groupEmail,
  })

  return response.data // Return the group details
}

/**
 * Retrieves the list of members of a group.
 *
 * This function takes the email address of the user to impersonate, the email address of the group to retrieve,
 * a boolean indicating whether to include indirect members, and optionally an existing impersonated auth client for Directory API.
 * It uses these values to authorize make a request to the Google Admin Directory API
 * to retrieve the list of members of the group.
 *
 * @param {Object} options - An object containing the following properties:
 *   - {string} userEmail - The email address of the user to impersonate.
 *   - {string} groupEmail - The email address of the group to retrieve.
 *   - {boolean} includeDerivedMembership - Whether to include indirect members in the list.
 *   - {Object} [client] - An existing impersonated auth client for Directory API.
 * @returns {Promise<Object[]>} - A promise that resolves to the list of members of the group or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function listGroupMembers({ userEmail, groupEmail, includeDerivedMembership, client }) {
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  // Create the request object
  const requestObj = {
    groupKey: groupEmail,
    maxResults: 200, //max allowed value
    includeDerivedMembership,
  }

  const members = [] // Container for members retrieved
  let membersResponse // Response from the API

  do {
    // Fetch members
    membersResponse = await directory.members.list(requestObj)

    // If there are no members in the group, return an empty array
    if (typeof membersResponse.data.members === 'undefined') break

    // Append the fetched groups to the members array
    members.push(...membersResponse.data.members)
  } while ((requestObj.pageToken = membersResponse.data.nextPageToken)) // Continue fetching users while there are more pages

  return members // Return all fetched members
}

/**
 * Retrieves the list of activity logs for a given application name and type of logs.
 *
 * This function takes the `userEmail`, `applicationName`, `eventName` and optional `client` from the argument object `params`.
 * It uses these values to make a request to the Google Admin Reports API
 * to retrieve the list of activity logs for the given application name and type of logs.
 *
 * @param {Object} params - The parameters needed to retrieve activity logs.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {string} params.applicationName - The application name to retrieve activity logs for.
 * @param {string} params.eventName - The type of logs to retrieve.      
 * @param {Object} [params.client=null] - An existing impersonated auth client for Reports API.
 * @returns {Promise<Object[]>} - A promise that resolves to the list of activity logs or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
//I'm only keeping this function in case it can be reused in the future(we might need some groups logs other than joining logs)
//If no such future comes, it should be merged or replaced by the getJoinGroupsLogs function
async function getActivityLogs({ userEmail, applicationName, eventName, client }) {
  // Retrieve an impersonated auth client for Reports API or create it if it's not specified
  const reports = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'reports'))

  const requestObj = {
    customerId: 'my_customer',
    userKey: 'all',
    applicationName,
    eventName,
    maxResults: 1000, //max allowed value
  }

  const activityLogs = [] // Container for activity logs retrieved
  let activitiesResponse // Response from the API

  do {
    activitiesResponse = await reports.activities.list(requestObj)

    if (typeof activitiesResponse.data.items === 'undefined') {
      break
    }
    
    activityLogs.push(...activitiesResponse.data.items)
  } while ((requestObj.pageToken = activitiesResponse.data.nextPageToken))

  return activityLogs
}

/**
 * Retrieves a list of all activities in the organization related to joining groups.
 *
 * This function takes the `userEmail` and an optional `client` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Reports API
 * to list all activities related to joining groups in the organization.
 *
 * @param {Object} options - An object containing the following properties:
 *   - {string} userEmail - The email address of the user to impersonate.
 *   - {Object} [client] - An existing impersonated auth client for Reports API.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of activity logs related to joining groups.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function getJoinGroupsLogs({ userEmail, client }) {
  // Retrieve an impersonated auth client or create it if it's not specified
  const reportsClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'reports'))
  const promises = []
  let allActivities = []

  //Get all activities related to joining groups
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
          getActivityLogs({
            userEmail,
            applicationName: appName,
            eventName: activityName,
            client: reportsClient,
          })
        )
      })
      promises.push(x)
    })
  })

  //Iterate through the promises array and concat the results
  await Promise.all(promises).then((results) => {
    results.forEach((result) => {
      if (!result) return
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
 * This function takes the `userEmail`, `groups`, and an optional `client` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to create a list of lists of members of the specified groups in exportable format.
 *
 * @param {Object} params - The parameters needed to list the lists of members in exportable format.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {Object[]} params.groups - An array of groups to be exported.
 *                                   Each element should be in the following format:
 *                                   {
 *                                     "groupEmail": <string: The email address of a group (REQUIRED)>,
 *		                                 "includeDerivedMembership": <boolean: whether or not you need all direct and indirect members (OPTIONAL, defaults to false)>,
 *		                                 "includeAllColumns": <boolean: whether or not you want to include the group email address of the group in each entry (OPTIONAL, defaults to false)>
 *                                   }
 * @param {Object} [params.client=null] - The JWT client to use to authenticate the API call.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of objects. Each object represents a group and is in the following format:
 *                                {
 *                                  "group": <string: specified group's email address>,
 *                                  "includeDerivedMembership": <boolean: the value you specified for the group>,
 *                                  "includeAllColumns": <boolean: the value you specified for the group>,
 *                                  "members": <Object[]: each element of this array represents a member of the group and is in the following format:
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
async function listMembersInExportFormat({ userEmail, groups, client }) {
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directoryClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  // Map of all groups in the customer's organization to get group names from group addresses
  // (key, value) = (group email address, group name)
  const groupNameMap = new Map()

  // Map of all users in the customer's organization to get user names from user addresses
  // (key, value) = (user email address, user name)
  const userNameMap = new Map()

  const [allGroupsInOrganization, allUsersInOrganization] = await Promise.all([
    listGroups({ userEmail, client: directoryClient }),
    listUsers({ userEmail, client: directoryClient }),
  ])

  // Building groupNameMap
  allGroupsInOrganization.forEach((group) => {
    // Add (key, value) = (group's primary email address, group name) to the map
    groupNameMap.set(group.email, group.name)

    // Add (key, value) = (group's alias, group name) to the map
    group.aliases?.forEach((alias) => groupNameMap.set(alias, group.name))

    // Add (key, value) = (group's non-editable alias (e.g. test domain aliases), group name) to the map
    group.nonEditableAliases?.forEach((nonEditableAlias) => groupNameMap.set(nonEditableAlias, group.name))
  })

  // Building userNameMap
  // Add (key, value) = (user's email address (either primary or alias), user name) to the map
  allUsersInOrganization.forEach((user) => {
    user.emails.forEach(({ address }) => userNameMap.set(address, user.name.fullName))
  })

  // Each element of this array is a list of all direct members of each group specified in the 'groups' parameter
  const directMembersArray = await Promise.all(
    groups.map(({ groupEmail }) =>
      listGroupMembers({
        groupEmail,
        includeDerivedMembership: false,
        client: directoryClient,
      })
    )
  )

  // Each element of this array is either:
  // (A) a list of all direct and indirect members of a group, if 'includeDerivedMembership' for the group is true
  // (B) null, if 'includeDerivedMembership' for the group is false
  const allMembersArray = await Promise.all(
    groups.map(({ groupEmail, includeDerivedMembership }) =>
      includeDerivedMembership
        ? listGroupMembers({
            groupEmail,
            includeDerivedMembership,
            client: directoryClient,
          })
        : null
    )
  )

  // Return an array each element of which is a list of members of each group specified in the 'groups' parameter,
  // and each entry of the list, which represents a member, is an object in one of the following 4 possible formats:
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
  return groups.map((group, index) => {
    const members = group.includeDerivedMembership
      ? // If 'includeDerivedMembership' of the group is true, the list contains both direct and indirect members
        // Each entry of the list has both 'email' and 'type' properties
        // See (1-a) and (1-b) above
        allMembersArray[index].map((member) => ({
          email: member.email,
          type: member.type,
        }))
      : // If 'includeDerivedMembership' of the group is false, the list contains only direct members
        // Each entry of the list has 'email', 'role' and 'type' properties
        // See (2-a) and (2-b) above
        directMembersArray[index].map((member) => ({
          email: member.email,
          role: member.role,
          type: member.type,
        }))

    // Each entry of the list contains 'name' property
    members.forEach((member) => {
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
      const directMembersSet = new Set(directMembersArray[index].map((member) => member.email)) // Set of all direct members of the group
      members.forEach((member) => (member.relationType = directMembersSet.has(member.email) ? 'DIRECT' : 'INDIRECT'))
    }

    // If 'includeAllColumns' of the group is true, each entry of the list has the 'group' property
    // See (1-a) and (2-a) above
    if (group.includeAllColumns) {
      members.forEach((member) => (member.group = group.groupEmail))
    }

    return {
      group: group.groupEmail,
      includeDerivedMembership: group.includeDerivedMembership ? true : false,
      includeAllColumns: group.includeAllColumns ? true : false,
      members,
    }
  })
}

/**
 * Retrieves a list of all users in the organization.
 *
 * This function takes the email address of the user to impersonate and an optional existing impersonated auth client.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all users in the organization.
 *
 * @param {Object} params - An object containing the following properties:
 *   - {string} userEmail - The email address of the user to impersonate.
 *   - {Object} [client] - An existing impersonated auth client for Directory API.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of user objects, each containing user details.
 */
async function listUsers({ userEmail, client }) {
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  // Create the request object
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
  } while ((requestObj.pageToken = usersResponse.data.nextPageToken)) // Continue fetching users while there are more pages

  return users // Return all fetched users
}

/**
 * Updates a group's settings using Groups Settings API.
 *
 * This function takes the `userEmail`, `projectId`, `resourse` and optional `client` from the argument object `params`.
 * It uses these values to make a request to the Google Groups Settings API
 * to update the info of a group specified by `groupEmail`.
 *
 * @param {Object} params - The parameters needed to update group info.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {string} params.groupEmail - The email address of the group to be updated.
 * @param {Object} params.resource - The group info to be updated. See https://developers.google.com/admin-sdk/groups-settings/v1/reference/groups#json for details.
 * @param {Object} [params.client=null] - An impersonated with userEmail auth client instance for GroupsSettings API. NOTE: you cannot pass any other client (like Directory, Drive etc) here.
 * @returns {Promise<Object>} - A promise that resolves to the updated group info.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function updateGroupSettings({ userEmail, groupEmail, resource, client }) {
  //Retrieve an existing impersonated auth client for GroupsSettings API or create a new one
  const groupsSettings = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'groups'))

  const response = await groupsSettings.groups.update({
    groupUniqueId: groupEmail,
    resource,
  })

  return response
}

/**
 * Delete a member from a group using Admin Directory API.
 *
 * This function takes the `userEmail`, `groupEmail` and `memberEmail` from the argument object `params`.
 * It uses these values to make a request to the Google Admin Directory API
 * to delete a member from a group.
 *
 * The target group has to belong to the customer's organization, while the target member (either a user or a group) does not.
 * The role of the target member (OWNER, MANAGER or MEMBER) does not matter.
 * The 'whoCanLeaveGroup' setting of the target group does not matter.
 *
 * @param {Object} params - The parameters needed to delete a member from a group.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {string} params.groupEmail - The email address of the group to which the member specified by `memberEmail` belongs.
 * @param {string} params.memberEmail - The email address of the member who is to be deleted from the group specified by `groupEmail`.
 * @param {Object} [params.client=null] - An impersonated with userEmail auth client instance for Directory API.
 * @returns {Promise<Object>} - A promise that resolves to an object which has info about the result of the member deletion.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function deleteMember({ userEmail, groupEmail, memberEmail, client }) {
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  // If successful, this object has a property 'status' with a value 204.
  // If not, this code will throw an error.
  // error.status can be:
  //
  // - 400
  // When Google does not know the memberKey, in other words, the memberKey is not an address of a Google user, a Google group or an unclaimed account.
  // The error message is always 'Missing required field: memberKey'.
  //
  // - 403
  // When Google knows the memberKey, and either (A) or (B) is fulfilled:
  // (A) The groupKey is an address of an internal user.
  // (B) The groupKey is an external address (whether or not it really exists does not matter).
  // The error message is always 'Not Authorized to access this resource/api'.
  //
  // - 404
  // When the groupKey is an internal address, Google knows the memberKey, and the memberKey does not belong to the group of the groupKey.
  // The error message is either (A) or (B):
  // (A) If the groupKey is an address of an internal group, it will be 'Resource Not Found: memberKey'.
  // (B) If the groupKey is an internal address but a corresponding user or group does not exist, it will be 'Resource Not Found: groupKey'.
  //
  // - Other unknown value (maybe 500)
  const response = await directory.members.delete({
    groupKey: groupEmail,
    memberKey: memberEmail,
  })

  return response
}

/**
 * Delete multiple members from a group using Admin Directory API.
 *
 * This function takes the `userEmail`, `groupEmail`, `memberEmails` and optional client from the argument object `params`.
 * It uses these values to make a request to the Google Admin Directory API.
 * to delete multiple members from a group.
 *
 * @param {Object} params - The parameters needed to delete members from a group.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {string} params.groupEmail - The email address of the group to which the members specified by `memberEmails` belong.
 * @param {string[]} params.memberEmails - The email addresses of the members who are to be deleted from the group specified by `groupEmail`.
 * @param {Object} [params.client=null] - The impersonated auth client configured for Directory API used to authenticate the API call.
 * @returns {Promise<Object>} - A promise that resolves to an object which has 2 arrays, an array of deleted members and an array of not deleted members.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function deleteMembers({ userEmail, groupEmail, memberEmails, client }) {
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directoryClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  const deletedMembers = [] // Container for deleted members
  const undeletedMembers = [] // Container for not deleted members

  // Because calling deleteMember() and waiting for the deletion result multiple times takes too much time,
  // we need to use either Promise.all() or Promise.allSettled().
  // The problem of using either Promise.all() or Promise.allSettled() is there is possibility that some API calls may succeed and some API calls may fail.
  // In other words, some members in the 'memberEmails' array may be deleted while some members may not.
  // My choice is using Promise.allSettled() to record which members were successfully deleted and which members were not, and returning the record to the caller.
  const responseArray = await Promise.allSettled(
    memberEmails.map((memberEmail) =>
      deleteMember({
        groupEmail,
        memberEmail,
        client: directoryClient,
      })
    )
  )

  memberEmails.forEach((memberEmail, index) => {
    // If the deletion of a member succeeded, put the member email and statusCode (= 204) to the deletedMembers array.
    if (responseArray[index].status === 'fulfilled') {
      deletedMembers.push({
        email: memberEmail,
        statusCode: responseArray[index].value.status,
      })

      // If the deletion of a member failed, put the member email, statusCode and the error message to the undeletedMembers array.
    } else {
      undeletedMembers.push({
        email: memberEmail,
        statusCode: responseArray[index].reason.status,
        errorMessage: responseArray[index].reason.message,
      })
    }
  })

  return { deletedMembers, undeletedMembers }
}

/**
 * Delete multiple members from a group using Admin Directory API.
 *
 * This function takes the `userEmail`, `groupEmail`, `memberEmails` and optional client from the argument object `params`.
 * It uses these values to make a request to the Google Admin Directory API
 * to delete multiple members from a group.
 *
 * This function is just a wrapper of deleteMembers().
 * This function restricts concurrent Google API calls to a certain number.
 *
 * @param {Object} params - The parameters needed to delete members from a group.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {string} params.groupEmail - The email address of the group to which the members specified by `memberEmails` belong.
 * @param {string[]} params.memberEmails - The email addresses of the members who are to be deleted from the group specified by `groupEmail`.
 * @param {Object} [params.client=null] - The JWT client to use to authenticate the API call.
 * @returns {Promise<Object>} - A promise that resolves to an object which has 2 arrays, an array of deleted members and an array of not deleted members.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function deleteMembersWithRateLimit({ userEmail, groupEmail, memberEmails, client }) {
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directoryClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

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
      client: directoryClient,
    })

    deletedMembers.push(...response.deletedMembers)
    undeletedMembers.push(...response.undeletedMembers)
  }

  if (numOfRemainingAPICalls > 0) {
    const startIndex = memberEmails.length - numOfRemainingAPICalls

    const response = await deleteMembers({
      groupEmail,
      memberEmails: memberEmails.slice(startIndex),
      client: directoryClient,
    })

    deletedMembers.push(...response.deletedMembers)
    undeletedMembers.push(...response.undeletedMembers)
  }

  return { deletedMembers, undeletedMembers }
}

/**
 * Delete a member from multiple groups using Admin Directory API.
 *
 * This function takes the `userEmail`, `groupEmails`, `memberEmail` and optional client from the argument object `params`.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to delete a member from multiple groups.
 *
 * @param {Object} params - The parameters needed to delete a member from groups.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {string[]} params.groupEmails - The email addresses of the groups to which the member specified by `memberEmail` belongs.
 * @param {string} params.memberEmail - The email address of the member who is to be deleted from the groups specified by `groupEmails`.
 * @param {Object} [params.client=null] - The impersonated auth client configured for Directory API used to authenticate the API call.
 * @returns {Promise<Object>} - A promise that resolves to an object which has 2 arrays, an array of groups for which the operation succeeded and an array of groups for which the operation failed.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function deleteMemberFromGroups({ userEmail, groupEmails, memberEmail, client }) {
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directoryClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  const succeededGroups = [] // Container for groups which the member was successfully deleted from
  const failedGroups = [] // Container for groups which the member failed to be deleted from

  const responseArray = await Promise.allSettled(
    groupEmails.map((groupEmail) =>
      deleteMember({
        groupEmail,
        memberEmail,
        client: directoryClient,
      })
    )
  )

  groupEmails.forEach((groupEmail, index) => {
    // If the deletion succeeded, put the group email and statusCode (= 204) to the succeededGroups array.
    if (responseArray[index].status === 'fulfilled') {
      succeededGroups.push({
        email: groupEmail,
        statusCode: responseArray[index].value.status,
      })

      // If the deletion failed, put the group email, statusCode and the error message to the failedGroups array.
    } else {
      failedGroups.push({
        email: groupEmail,
        statusCode: responseArray[index].reason.status,
        errorMessage: responseArray[index].reason.message,
      })
    }
  })

  return { succeededGroups, failedGroups }
}

/**
 * Delete a member from multiple groups using Admin Directory API.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail` and `serviceAccountPrivateKey` from the argument object `params`.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to delete a member from multiple groups.
 *
 * This function is just a wrapper of deleteMemberFromGroups().
 * This function restricts concurrent Google API calls to a certain number.
 *
 * @param {Object} params - The parameters needed to delete a member from groups.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {string[]} params.groupEmails - The email addresses of the groups to which the member specified by `memberEmail` belongs.
 * @param {string} params.memberEmail - The email address of the member who is to be deleted from the groups specified by `groupEmails`.
 * @param {Object} [client=null] - The impersonated auth client configured for Directory API used to authenticate the API call.
 * @returns {Promise<Object>} - A promise that resolves to an object which has 2 arrays, an array of groups for which the operation succeeded and an array of groups for which the operation failed.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function deleteMemberFromGroupsWithRateLimit({ userEmail, groupEmails, memberEmail, client }) {
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directoryClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  // Ref: https://developers.google.com/admin-sdk/directory/v1/limits
  // According to the document, "The default value" of userRateLimitExceeded "set in the Google Cloud console is 2,400 queries per minute per user per Google Cloud project".
  // So I guess 40 (= 2,400 / 60) concurrent API calls are safe.
  const BULK_DELETE_THRESHOLD = 40

  // Let's say BULK_DELETE_THRESHOLD = 40 and groupEmails.length = 100.
  // In this case, we should repeat 40 concurrent API calls 2 (= Math.floor(groupEmails.length / BULK_DELETE_THRESHOLD)) times
  // and 20 (= groupEmails.length % BULK_DELETE_THRESHOLD) concurrent API calls once.
  const numOfBulkAPICalls = Math.floor(groupEmails.length / BULK_DELETE_THRESHOLD)
  const numOfRemainingAPICalls = groupEmails.length % BULK_DELETE_THRESHOLD

  const succeededGroups = [] // Container for groups which the member was successfully deleted from
  const failedGroups = [] // Container for groups which the member failed to be deleted from

  for (let i = 0; i < numOfBulkAPICalls; i++) {
    const startIndex = i * BULK_DELETE_THRESHOLD
    const endIndex = startIndex + BULK_DELETE_THRESHOLD

    const response = await deleteMemberFromGroups({
      groupEmails: groupEmails.slice(startIndex, endIndex),
      memberEmail,
      client: directoryClient,
    })

    succeededGroups.push(...response.succeededGroups)
    failedGroups.push(...response.failedGroups)
  }

  if (numOfRemainingAPICalls > 0) {
    const startIndex = groupEmails.length - numOfRemainingAPICalls

    const response = await deleteMemberFromGroups({
      groupEmails: groupEmails.slice(startIndex),
      memberEmail,
      client: directoryClient,
    })

    succeededGroups.push(...response.succeededGroups)
    failedGroups.push(...response.failedGroups)
  }

  return { succeededGroups, failedGroups }
}

/**
 * Creates a new group using the Google Admin Directory API.
 *
 * This function takes the `userEmail`, `groupEmail`, and an optional `client` from the argument object.
 * It uses these values to make an API call to create a new group with the specified email address.
 *
 * @param {Object} params - The parameters needed to create a new group.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {string} params.groupEmail - The email address of the group to be created.
 * @param {Object} [params.client=null] - An existing impersonated auth client for Directory API.
 * @returns {Promise<Object>} - A promise that resolves to the response from the API call.
 * @throws {Error} - Throws an error if there is an issue with the API call or if the client is incorrect.
 */

async function createGroup({ userEmail, groupEmail, client }) {
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  //If a wrong client instance type is provided (i.e. "drive" instead of "directory") or something is wrong with the client,
  //the "directory.groups.insert" method will return an error like "Cannot read properties of undefined (reading 'insert')"
  //We catch the error in the corresponding groupsController function.
  //If you are calling this function directly, you should catch the error yourself from wherever you call it.
  const response = await directory.groups.insert({
    resource: {
      email: groupEmail,
    },
  })

  return response
}

/**
 * Retrieves the settings of a group using the Google Groups Settings API.
 *
 * @param {Object} params - The parameters needed to retrieve group settings.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {string} params.groupEmail - The email address of the group to retrieve settings for.
 * @param {Object} [params.client=null] - An existing impersonated auth client for GroupsSettings API.
 * @returns {Promise<Object>} - A promise that resolves to the group settings or an error message.
 * @throws {Error} - Throws an error if there is an issue with the API call or if the client is incorrect.
 */
//Note: if you have a client instance already, you can pass it to this function.
//Only "groups" type of instance can be used, otherwise the authModule will return an error:
//cannot read properties of undefined (reading 'get')
async function getSettings({ userEmail, groupEmail, client }) {
  //Retrieve an existing impersonated auth client for GroupsSettings API or create a new one
  const groupsSettings = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'groups'))

  const response = await groupsSettings.groups.get({
    groupUniqueId: groupEmail,
    alt: 'json', //need to specify json, because default data format is xml (just why, google..)
  })

  return response
}

/**
 * Adds a member to a group using the Google Admin Directory API.
 *
 * This function takes the `userEmail`, `groupEmail`, `memberEmail`, and an optional `client` from the argument object `params`.
 * It uses these values to make an API call to add the member to the group.
 *
 * @param {Object} params - The parameters needed to add a member to a group.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {string} params.groupEmail - The email address of the group to which the member is to be added.
 * @param {string} params.memberEmail - The email address of the member who is to be added to the group specified by `groupEmail`.
 * @param {Object} [params.client=null] - An existing impersonated auth client for Directory API.
 * @returns {Promise<Object>} - A promise that resolves to the response from the API call.
 * @throws {Error} - Throws an error if there is an issue with the API call or if the client is incorrect.
 */
//Warning: copied and pasted from deleteMember almost as is.
//If you need to implement this method for the actual use at the project, please give it some thought and change if necessary.
async function addMember({ userEmail, groupEmail, memberEmail, client }) {
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  const response = await directory.members.insert({
    groupKey: groupEmail,
    resource: {
      email: memberEmail,
    },
  })

  return response
}

/**
 * Adds multiple members to a group using the Google Admin Directory API.
 *
 * This function takes the `userEmail`, `groupEmail`, `memberEmails` and optional `client` from the argument object `params`.
 * It uses these values to make multiple API calls to add the members to the group.
 *
 * @param {Object} params - The parameters needed to add members to a group.
 * @param {string} params.userEmail - The email address of the user to impersonate.
 * @param {string} params.groupEmail - The email address of the group to which the members are to be added.
 * @param {string[]} params.memberEmails - The email addresses of the members who are to be added to the group specified by `groupEmail`.
 * @param {Object} [params.client=null] - An existing impersonated auth client for Directory API.
 * @returns {Promise<Object>} - A promise that resolves to an object which has 2 arrays, an array of added members and an array of not added members.
 * @throws {Error} - Throws an error if there is an issue with the API call or if the client is incorrect.
 */
//Warning: copied and pasted from deleteMembers almost as is.
//If you need to implement this method for the actual use at the project, please give it some thought and change if necessary.
async function addMembers({ userEmail, groupEmail, memberEmails, client }) {
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directoryClient = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))

  const addedMembers = [] // Container for successfully added members
  const unaddedMembers = [] // Container for failed members

  // Add members in parallel
  const responseArray = await Promise.allSettled(
    memberEmails.map((memberEmail) =>
      addMember({
        groupEmail,
        memberEmail,
        client: directoryClient,
      })
    )
  )

  memberEmails.forEach((memberEmail, index) => {
    // If the adding of a member succeeded, put the member email and statusCode (= 200) to the addedMembers array.
    if (responseArray[index].status === 'fulfilled') {
      addedMembers.push({
        email: memberEmail,
        statusCode: responseArray[index].value.status,
      })

      // If the adding of a member failed, put the member email, statusCode and the error message to the unaddedMembers array.
    } else {
      unaddedMembers.push({
        email: memberEmail,
        statusCode: responseArray[index].reason.status,
        errorMessage: responseArray[index].reason.message,
      })
    }
  })

  return { addedMembers, unaddedMembers }
}

module.exports = {
  listGroups,
  getGroupByEmail,
  listGroupMembers,
  getActivityLogs,
  getJoinGroupsLogs,
  listMembersInExportFormat,
  updateGroupSettings,
  deleteMembersWithRateLimit,
  deleteMemberFromGroupsWithRateLimit,
  createGroup,
  getSettings,
  addMembers,
}
