const logger = require('../logger/logger')(__filename, 'Groups')
const groupsService = require('../services/groupsService')
const { getNestedTable, getHierarchy } = require('../services/nestedGroupsService')

/**
 * Retrieves the list of all groups in the organization.
 *
 * @param {Object} req - The request object containing the `userEmail` in the request body.
 * @param {Object} res - The response object used to return the list of groups or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} - Responds with the list of groups or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.listAllGroups = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query
  try {
    // Get an array with all organization's groups
    const groups = await groupsService.listGroups({
      userEmail,
    })

    // Return the list of all organization's groups
    res.locals.data = groups
    logger.debug('Returning list of groups', { storeLocation: 'both' })
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: 'Error fetching groups' }
    logger.error(error)
  }
  next()
}

/**
 * Retrieves the details of a single group by its email address.
 *
 * This function takes the email address of the user to impersonate and the email address of the group to retrieve.
 * It uses these values to make a request to the Google Admin Directory API
 * to retrieve the group's details.
 *
 * @param {Object} req - The request object containing the `userEmail` and `groupEmail` in the request body.
 * @param {Object} res - The response object used to return the group's details or an error message.
 * @param {Function} next - The next middleware function in the application's request-response cycle.
 * @returns {Promise<void>} - Responds with the group's details or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getGroup = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query
  const { groupEmail } = req.params

  try {
    const group = await groupsService.getGroupByEmail({
      userEmail,
      groupEmail,
    })

    res.locals.data = group
  } catch (error) {
    //the reason why 404 and 403 are grouped is:
    //by try and error method I found out that error 404 is returned when query email is not a proper email address(missing @ symbol etc)
    //and error 403 is returned when query email address doesn't exist but looks like a proper email address
    //Probably this is Google's measure to prevent guessing of email addresses by probing
    if (error.status === 404 || error.status === 403) {
      res.locals.statusCode = 404
      res.locals.data = { message: 'Group does not exist or you do not have necessary permissions to see this group' }
    } else {
      res.locals.statusCode = 500
      res.locals.data = { message: 'Error fetching group' }
    }
    logger.error(error)
  }
  next()
}

/**
 * Retrieves the list of direct members of a group.
 *
 * This function takes the `userEmail` and `groupEmail` from the request body.
 * It uses these values to make a request to the Google Admin Directory API
 * to retrieve the list of direct members of the group.
 *
 * @param {Object} req - The request object containing the `userEmail` and `groupEmail` in the request body.
 * @param {Object} res - The response object used to return the list of direct members or an error message.
 * @param {Function} next - The next middleware function in the application's request-response cycle.
 * @returns {Promise<void>} - Responds with the list of direct members or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.listDirectMembers = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }
  
  const { userEmail } = req.query
  const { groupEmail } = req.params

  try {
    const members = await groupsService.listGroupMembers({
      userEmail,
      groupEmail,
      includeDerivedMembership: false, //set derived membership to false
    }) // Get the list of direct members

    res.locals.data = members
  } catch (error) {
    if (error.status === 404 || error.status === 403) {
      res.locals.statusCode = 404
      res.locals.data = { message: 'Group does not exist or you do not have necessary permissions to see this group' }
    } else {
      res.locals.statusCode = 500
      res.locals.data = { message: 'Error fetching members' }
    }
    logger.error(error)
  }
  next()
}

/**
 * Retrieves the list of all members of a group, both direct and indirect.
 *
 * This function takes the `userEmail` and `groupEmail` from the request body.
 * It uses these values to make a request to the Google Admin Directory API
 * to retrieve the list of all members of the group.
 *
 * @param {Object} req - The request object containing the `userEmail` and `groupEmail` in the request body.
 * @param {Object} res - The response object used to return the list of all members or an error message.
 * @param {Function} next - The next middleware function in the application's request-response cycle.
 * @returns {Promise<void>} - Responds with the list of all members or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.listAllMembers = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query
  const { groupEmail } = req.params

  try {
    const descendants = await groupsService.listGroupMembers({
      userEmail,
      groupEmail,
      includeDerivedMembership: true, //set derived membership to true
    }) // Get the list of direct members

    // Return the list of direct members of the group
    res.locals.data = descendants
  } catch (error) {
    if (error.status === 404 || error.status === 403) {
      res.locals.statusCode = 404
      res.locals.data = { message: 'Group does not exist or you do not have necessary permissions to see this group' }
    } else {
      res.locals.statusCode = 500
      res.locals.data = { message: 'Error fetching members' }
    }
    logger.error(error)
  }
  next()
}

/**
 * Retrieves the list of all activities in the organization related to groups.
 *
 * This function takes the `userEmail` from the request body.
 * It uses this value to make a request to the Google Admin Directory API
 * to list all activities related to groups in the organization.
 *
 * @param {Object} req - The request object containing the `userEmail` in the request body.
 * @param {Object} res - The response object used to return the list of activities or an error message.
 * @param {Function} next - The next middleware function in the application's request-response cycle.
 * @returns {Promise<void>} - Responds with the list of activities or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getGroupActivity = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query
  console.log('retrieving group activity: ', userEmail)

  try {
    // Get the list of group activity
    const response = await groupsService.getAllGroupsLogs({
      userEmail,
    })

    res.locals.data = response
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: 'Error fetching group activity' }
    logger.error(error)
  }
  next()
}

/**
 * Retrieves the list of all activities related to joining groups in the organization.
 *
 * This function takes the `userEmail` from the request body.
 * It uses this value to make a request to the Google Admin Directory API
 * to list all activities related to joining groups in the organization.
 *
 * @param {Object} req - The request object containing the `userEmail` in the request body.
 * @param {Object} res - The response object used to return the list of activities or an error message.
 * @param {Function} next - The next middleware function in the application's request-response cycle.
 * @returns {Promise<void>} - Responds with the list of activities or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getGroupJoinedActivity = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query

  try {
    //Return the list of group joined activity in customer organization
    const allActivities = await groupsService.getJoinGroupsLogs({
      userEmail,
    })

    res.locals.data = allActivities
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: 'Error fetching group joined activity' }
    logger.error(error)
  }
  next()
}

/**
 * Retrieves a table of all groups that a given group or user is a member of, either directly or indirectly.
 * The table contains columns for the group email, the type of membership (direct or indirect), and the timestamp
 * of when the membership was created.
 *
 * @param {Object} req - The request object containing the `userEmail` and `queryEmail` in the request body.
 * @param {Object} res - The response object used to return the table of nested membership or an error message.
 * @returns {Promise<void>} - Responds with the table of nested membership or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getNestedMembership = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query
  const { targetEmail } = req.params

  try {
    const nestedTable = await getNestedTable({
      userEmail,
      queryEmail: targetEmail,
    })

    //Return the data with group membership details
    res.locals.data = nestedTable
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: 'Error fetching nested membership' }
    logger.error(error)
  }
  next()
}

/**
 * Retrieves a hierarchical representation of groups for a given email address.
 *
 * This function takes the `userEmail` and `queryEmail` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all nested groups that the group with the given email address is a member of, along with timestamps.
 *
 * If there is only one node in the hierarchy, an empty array is returned.
 * Otherwise, the hierarchy is returned.
 *
 * @param {Object} req - The request object containing the `userEmail` and `queryEmail` in the request body.
 * @param {Object} res - The response object used to return the hierarchy or an error message.
 * @param {Function} next - The next middleware function in the application's request-response cycle.
 * @returns {Promise<void>} - Responds with the hierarchy or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getGroupHierarchy = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail, queryEmail } = req.body

  try {
    //fetch array with nested membership and timestamps
    const groupHierarchy = await getHierarchy({
      userEmail,
      queryEmail,
    })

    //If there is only one node in the hierarchy, return an array
    //otherwise, return the hierarchy
    if (groupHierarchy.nodes.length === 1 && groupHierarchy.edges.length === 0) {
      res.locals.data = []
    } else {
      res.locals.data = groupHierarchy
    }
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: 'Error fetching hierarchy' }
    logger.error(error)
  }
  next()
}

/**
 * Retrieves lists of members for specified groups in an exportable format.
 *
 * This function takes the `userEmail` and `groups` from the request body.
 * It uses these values to make a request to the Google Admin Directory API
 * to generate lists of members for the given groups in a format suitable for export.
 *
 * @param {Object} req - The request object containing the `userEmail` and an array of `groups` in the request body.
 * @param {Object} res - The response object used to return the lists of members or an error message.
 * @param {Function} next - The next middleware function in the application's request-response cycle.
 * @returns {Promise<void>} - Responds with the lists of members or an error message.
 * @throws {Error} - Throws an error if there is an issue with the API call.
 */
exports.listGroupsMembersInExportFormat = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail, groups } = req.body

  try {
    const members = await groupsService.listMembersInExportFormat({
      userEmail,
      groups,
    })

    res.locals.data = members
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: 'Error creating member lists in CSV format' }
    logger.error(error)
  }
  next()
}

/**
 * Updates group's 'whoCanLeaveGroup' setting.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail` and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to update the 'whoCanLeaveGroup' setting of the group
 *
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, `groupEmail` and `whoCanLeaveGroup` in the request body.
 *                       `whoCanLeaveGroup` must be one of 'ALL_MEMBERS_CAN_LEAVE', 'ALL_MANAGERS_CAN_LEAVE' and 'NONE_CAN_LEAVE'.
 * @param {Object} res - The response object used to return the response from the API, or an error message.
 * @returns {Promise<void>} - Responds with the response of the API call, or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.updateWhoCanLeaveGroup = async (req, res) => {
  const { userEmail, groupEmail, whoCanLeaveGroup } = req.body

  if (
    whoCanLeaveGroup !== 'ALL_MEMBERS_CAN_LEAVE' &&
    whoCanLeaveGroup !== 'ALL_MANAGERS_CAN_LEAVE' &&
    whoCanLeaveGroup !== 'NONE_CAN_LEAVE'
  ) {
    return res.status(400).json({
      message:
        "The value of 'whoCanLeaveGroup' must be one of 'ALL_MEMBERS_CAN_LEAVE', 'ALL_MANAGERS_CAN_LEAVE' and 'NONE_CAN_LEAVE'",
    })
  }

  try {
    const response = await groupsService.updateGroup({
      userEmail,
      groupEmail,
      resource: { whoCanLeaveGroup },
    })

    if (response.status === 200) {
      res.status(200).json({ message: `Set the 'whoCanLeaveGroup' of ${groupEmail} to ${whoCanLeaveGroup}` })
      res.locals.groupSettings = response.data
      next()
    } else {
      res.status(500).json({ message: 'The request could not be handled for some reason' })
      // logger.debug(JSON.stringify(response, null, 2))
    }
  } catch (error) {
    logger.error(error)
    res.status(500).json({ message: "Error updating the specified group's 'whoCanLeaveGroup' setting" })
  }
}

/**
 * Delete multiple members from a group.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail` and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to delete multiple members from a group.
 *
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, `groupEmail` and `memberEmails` in the request body.
 *                       `memberEmails` is an array of the email addresses of the target members who are to be deleted from the target group specified by `groupEmail`.
 * @param {Object} res - The response object which has 3 properties, `deletedMembers`, `undeletedMembers` and `message`.
 *                       `deletedMembers` is an array which has the emails of the members who were successfully deleted from the target group with status code (204).
 *                       `undeletedMembers` is an array which has the emails of the members who were not deleted from the target group for some reason.
 *                       The error codes and messages are also included in the array.
 *                       `message` is a brief comment on the result of the entire operation.
 * @returns {Promise<void>} - Responds with the response of the API call, or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.deleteMembers = async (req, res, next) => {
  const { userEmail } = req.query
  const { groupEmail } = req.params
  const { memberEmails } = req.body

  // Eliminate duplicate members if any.
  const uniqueMemberEmails = [...new Set(memberEmails)]

  try {
    const response = await groupsService.deleteMembersWithRateLimit({
      userEmail,
      groupEmail,
      memberEmails: uniqueMemberEmails,
    })

    if (response.undeletedMembers.length === 0) {
      // All requested members were deleted from the group successfully.
      response.message = `Deleted All requested member(s) from ${groupEmail}`
      res.locals.statusCode = 200
    } else if (response.deletedMembers.length > 0) {
      // Some requested members were deleted from the group successfully, but some were not.
      response.message = `${response.undeletedMembers.length} requested member(s) could not be deleted from ${groupEmail}`
      res.locals.statusCode = 207 // Ref for the status code: https://xexeq.jp/blogs/media/it-glossary1206
    } else {
      // No requested members were deleted from the group.
      response.message = `No members were deleted from ${groupEmail}`

      // If one of the status codes are in 500, the status code of the response should be 500 (Internal Server Error).
      // Otherwise it should be 400 (Bad Request).
      res.locals.statusCode = response.undeletedMembers.some(({ statusCode }) => statusCode >= 500 && statusCode < 600)
        ? 500
        : 400
    }

    res.locals.data = response
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: `Error deleting members from ${groupEmail}` }
    logger.error(error)
  }
  next()
}

/**
 * Delete a member from multiple groups.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail` and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to delete a member from multiple groups.
 *
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, `groupEmails` and `memberEmail` in the request body.
 *                       `memberEmail` is the email address of the target member who is to be deleted from the target groups specified by `groupEmails`.
 * @param {Object} res - The response object which has 3 properties, `succeededGroups`, `failedGroups` and `message`.
 *                       `succeededGroups` is an array of the email addresses of the groups from which the target member was successfully deleted with status code (204).
 *                       `failedGroups` is an array of the email addresses of the groups from which the target member failed to be deleted for some reason.
 *                       The error codes and messages are also included in the array.
 *                       `message` is a brief comment on the result of the entire operation.
 * @returns {Promise<void>} - Responds with the response of the API call, or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.deleteMemberFromGroups = async (req, res, next) => {
  const { userEmail } = req.query
  const { memberEmail } = req.params
  const { groupEmails } = req.body

  // Eliminate duplicate groups if any.
  const uniqueGroupEmails = [...new Set(groupEmails)]

  try {
    const response = await groupsService.deleteMemberFromGroupsWithRateLimit({
      userEmail,
      groupEmails: uniqueGroupEmails,
      memberEmail,
    })

    if (response.failedGroups.length === 0) {
      // The member was successfully deleted from all requested groups.
      response.message = `Deleted ${memberEmail} from all requested group(s)`
      res.locals.statusCode = 200
      res.status(200).json(response)
    } else if (response.succeededGroups.length > 0) {
      // The member was deleted from some requested groups, but not from all requested groups.
      response.message = `${memberEmail} could not be deleted from ${response.failedGroups.length} requested group(s)`
      res.locals.statusCode = 207 // Ref for the status code: https://xexeq.jp/blogs/media/it-glossary1206
      res.status(207).json(response)
    } else {
      // The member was not deleted from all requested groups.
      response.message = `${memberEmail} was not deleted from all requested group(s)`

      // If one of the status codes are in 500, the status code of the response should be 500 (Internal Server Error).
      // Otherwise it should be 400 (Bad Request).
      res.locals.statusCode = response.failedGroups.some(({ statusCode }) => statusCode >= 500 && statusCode < 600)
        ? 500
        : 400
    }

    res.locals.data = response
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: `Error deleting ${memberEmail} from the requested group(s)` }
    logger.error(error)
  }
  next()
}
