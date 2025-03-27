const logger = require('../logger/logger')(__filename, 'Groups')
const groupsService = require('../services/groupsService')
const { getNestedTable, getHierarchy } = require('../services/nestedGroupsService')

/**
 * Retrieves the list of all groups in the organization.
 *
 * @param {Object} req - The request object containing `userEmail` in the query parameter.
 * @param {Object} res - The response object used to return the list of groups or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the list of groups or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.listAllGroups = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query
  try {
    // Fetch an array with all organization's groups
    const groups = await groupsService.listGroups({
      userEmail,
    })

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
 * @param {Object} req - The request object containing `userEmail` in the query parameter and `groupEmail` in the path parameter.
 * @param {Object} res - The response object used to return the group's details or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the group's details or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
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
 * @param {Object} req - The request object containing `userEmail` in the query parameter and `groupEmail` in the path parameter.
 * @param {Object} res - The response object used to return the list of direct members or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the list of direct members or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.listMembers = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query
  const { groupEmail } = req.params

  try {
    // Fetch an array of direct members
    const members = await groupsService.listGroupMembers({
      userEmail,
      groupEmail,
      includeDerivedMembership: res.locals.includeDerivedMembership,
    })

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
 * Retrieves the list of all activities in the organization related to groups.
 *
 * @param {Object} req - The request object containing `userEmail` in the query parameter.
 * @param {Object} res - The response object used to return the list of activities or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the list of activities or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getGroupActivity = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query
  const applicationName = req.query.applicationName ?? 'groups_enterprise'
  const eventName = req.query.eventName
  console.log('retrieving group activity: ', userEmail)

  try {
    // Fetch the list of group activity
    const response = await groupsService.getActivityLogs({
      userEmail,
      applicationName,
      eventName,
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
 * @param {Object} req - The request object containing `userEmail` in the query parameter.
 * @param {Object} res - The response object used to return the list of activities or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the list of activities or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getGroupJoinedActivity = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query

  try {
    // Fetch the list of group joined activity in customer organization
    const response = await groupsService.getGroupJoinLogs({
      userEmail,
    })

    res.locals.data = response
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: 'Error fetching group joined activity' }
    logger.error(error)
  }
  next()
}

// DEPRECATED
/**
 * Retrieves a table of all groups that a given group or user is a member of, either directly or indirectly.
 * The table contains columns for the group email, the type of membership (direct or indirect), and the timestamp
 * of when the membership was created.
 *
 * @param {Object} req - The request object containing `userEmail` in the query parameter, and `targetEmail` in the path parameter.
 * @param {Object} res - The response object used to return the table of nested membership or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the table of nested membership or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
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
 * This function takes `userEmail` and `targetEmail` from the request.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all nested groups that the group with the given email address is a member of, along with timestamps.
 *
 * If there is only one node in the hierarchy, an empty array is returned.
 * Otherwise, the hierarchy is returned.
 *
 * @param {Object} req - The request object containing `userEmail` in the query parameter, and `targetEmail` in the path parameter.
 * @param {Object} res - The response object used to return the hierarchy or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the hierarchy or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getGroupHierarchy = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query
  const { targetEmail } = req.params

  try {
    //fetch array with nested membership and timestamps
    const groupHierarchy = await getHierarchy({
      userEmail,
      queryEmail: targetEmail,
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
 * @param {Object} req - The request object containing `userEmail` in the query parameter, and `groups` in the request body.
 * @param {Object} res - The response object used to return the lists of members or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the lists of members or an error message.
 * @throws {Error} Throws an error if there is an issue with the API call.
 */
exports.listGroupsMembersInExportFormat = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query
  const { groups } = req.body

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
 * Updates a group's settings.
 *
 * @param {Object} req - The request object containing `userEmail` in the query parameter, `groupEmail` in the path parameter,and `resource` in the request body.
 *                       The `resource` is a JSON object containing the settings to be updated.
 *                       See {@link https://developers.google.com/admin-sdk/groups-settings/v1/reference/groups#resource}.
 * @param {Object} res - The response object used to return the response from the API, or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the response of the API call, or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.updateGroupSettings = async (req, res, next) => {
  const { userEmail } = req.query
  const { groupEmail } = req.params
  const resource = req.body

  try {
    const response = await groupsService.updateGroupSettings({
      userEmail,
      groupEmail,
      resource,
    })

    res.locals.data = response.data
  } catch (error) {
    // If `resource` is invalid (e.g. some settings' names or values are incorrect), `error.status` will be 400
    // Else if a group which has `groupEmail` as its email address (primary or alias) does not exist in the customer's organization, `error.status` will be 404
    // I would set 500 as a default error status code
    res.locals.statusCode = error.status ?? 500
    res.locals.data = { message: "Error updating the specified group's settings" }
    logger.error(error)
  }
  next()
}

/**
 * Delete multiple members from a group.
 *
 * @param {Object} req - The request object containing `userEmail` in the query parameter, `groupEmail` in the path parameter, and `memberEmails` in the request body.
 *                       `memberEmails` is an array of the email addresses of the target members who are to be deleted from the target group specified by `groupEmail`.
 * @param {Object} res - The response object which has 3 properties, `deletedMembers`, `undeletedMembers` and `message`.
 *                       `deletedMembers` is an array which has the emails of the members who were successfully deleted from the target group with status code (204).
 *                       `undeletedMembers` is an array which has the emails of the members who were not deleted from the target group for some reason.
 *                       The error codes and messages are also included in the array.
 *                       `message` is a brief comment on the result of the entire operation.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the response of the API call, or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
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
 * @param {Object} req - The request object containing `userEmail` in the query parameter, `memberEmail` in the path parameter, and `groupEmails` in the request body.
 *                       `memberEmail` is the email address of the target member who is to be deleted from the target groups specified by `groupEmails`.
 * @param {Object} res - The response object which has 3 properties, `succeededGroups`, `failedGroups` and `message`.
 *                       `succeededGroups` is an array of the email addresses of the groups from which the target member was successfully deleted with status code (204).
 *                       `failedGroups` is an array of the email addresses of the groups from which the target member failed to be deleted for some reason.
 *                       The error codes and messages are also included in the array.
 *                       `message` is a brief comment on the result of the entire operation.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the response of the API call, or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
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
    } else if (response.succeededGroups.length > 0) {
      // The member was deleted from some requested groups, but not from all requested groups.
      response.message = `${memberEmail} could not be deleted from ${response.failedGroups.length} requested group(s)`
      res.locals.statusCode = 207 // Ref for the status code: https://xexeq.jp/blogs/media/it-glossary1206
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

/**
 * Creates a group.
 *
 * @param {Object} req - The request object containing `userEmail` in the query parameter and `groupEmail` in the request body.
 * @param {Object} res - The response object used to return the response from the API, or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the response of the API call, or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
 */
//N.B. I haven't added the 401 error code because it's returned to FE before this function is called.
//It happens when jwt token is expired or invalid.
//The 401 error should be addressed directly in FE.
exports.createGroup = async (req, res, next) => {
  const { userEmail } = req.query
  const { groupEmail } = req.body

  try {
    const response = await groupsService.createGroup({
      userEmail,
      groupEmail,
    })

    res.locals.data = response
  } catch (error) {
    if (error.status === 409) {
      res.locals.statusCode = 409
      res.locals.data = { message: `Group with email address ${groupEmail} already exists` }
    } else if (error.status === 403 || error.status === 404) {
      //the reason why 404 and 403 are grouped is:
      //google returns 403 if a user is trying to create a group with existing domain but they don't have necessary permissions
      //google returns 404 if a user is trying to create a group with non existing domain
      //I hope we can filter out these in FE by validation so that request doesn't reach here
      res.locals.statusCode = 403
      res.locals.data = {
        message: `You do not have necessary permissions to create a group with email address ${groupEmail}`,
      }
    } else if (error.status === 400) {
      //I hope we can filter out these in FE by validation so that request doesn't reach here
      res.locals.statusCode = 400
      res.locals.data = { message: `Group email address is empty or invalid` }
    } else {
      res.locals.statusCode = 500
      res.locals.data = { message: `Error creating group with email address ${groupEmail}` }
    }

    logger.error(error)
  }
  next()
}

exports.createGroups = async (req, res, next) => {
  const { userEmail } = req.query
  const { groupEmails } = req.body

  // Eliminate duplicate group emails if any.
  const uniqueGroupEmails = [...new Set(groupEmails)]

  try {
    const response = await groupsService.createGroups({
      userEmail,
      groupEmails: uniqueGroupEmails,
    })

    if (response.uncreatedGroups.length === 0) {
      // All requested groups were created successfully.
      response.message = 'Created all requested groups successfully'
      res.locals.statusCode = 200
    } else if (response.uncreatedGroups.length > 0) {
      // Some requested groups were created successfully, but some were not.
      response.message = `${response.uncreatedGroups.length} groups were not created.`
      res.locals.statusCode = 207
    } else {
      // No requested members were added to the group.
      response.message = 'Failed to create requested groups.'

      // If one of the status codes are in 500, the status code of the response should be 500 (Internal Server Error).
      // Otherwise it should be 400 (Bad Request).
      res.locals.statusCode = response.uncreatedGroups.some(({ statusCode }) => statusCode >= 500 && statusCode < 600)
        ? 500
        : 400
    }

    res.locals.data = response
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: 'Error creating groups.' }
    logger.error(error)
  }
  next()
}

/**
 * Retrieves a group's settings.
 *
 * @param {Object} req - The request object containing `userEmail` in the query parameter and `groupEmail` in the path parameter.
 * @param {Object} res - The response object used to return the response from the API, or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the response of the API call, or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getSettings = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query
  const { groupEmail } = req.params

  try {
    const response = await groupsService.getSettings({
      userEmail,
      groupEmail,
    })

    res.locals.data = response.data
  } catch (error) {
    res.locals.statusCode = error.status ?? 500
    res.locals.data = { message: "Error getting the specified group's settings" }
    logger.error(error)
  }
  next()
}

/**
 * Adds members to a group.
 *
 * @param {Object} req - The request object containing `userEmail` in the query parameter, `groupEmail` in the path parameter, and `memberEmails` in the request body.
 * @param {Object} res - The response object used to return the response from the API, or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the response of the API call, or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
 */
//Warning: copied from deleteMembers almost as is. If you need to implement this method for the actual use in the project, please give at some thought and update if necessary.
exports.addMembers = async (req, res, next) => {
  const { userEmail } = req.query
  const { groupEmail } = req.params
  const { memberEmails } = req.body

  // Eliminate duplicate members if any.
  const uniqueMemberEmails = [...new Set(memberEmails)]

  try {
    const response = await groupsService.addMembers({
      userEmail,
      groupEmail,
      memberEmails: uniqueMemberEmails,
    })

    if (response.unaddedMembers.length === 0) {
      // All requested members were added the group successfully.
      response.message = `Added all requested member(s) to ${groupEmail}`
      res.locals.statusCode = 200
    } else if (response.unaddedMembers.length > 0) {
      // Some requested members were added successfully, but some were not.
      response.message = `${response.unaddedMembers.length} requested member(s) could not be added to ${groupEmail}`
      res.locals.statusCode = 207
    } else {
      // No requested members were added to the group.
      response.message = `No members were added to ${groupEmail}`

      // If one of the status codes are in 500, the status code of the response should be 500 (Internal Server Error).
      // Otherwise it should be 400 (Bad Request).
      res.locals.statusCode = response.unaddedMembers.some(({ statusCode }) => statusCode >= 500 && statusCode < 600)
        ? 500
        : 400
    }

    res.locals.data = response
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: `Error adding members to ${groupEmail}` }
    logger.error(error)
  }
  next()
}

/**
 * Retrieves a table of all groups that a given group or user is a member of, either directly or indirectly.
 * The table contains columns for the group email, the type of membership (direct or indirect), and the timestamp
 * of when the membership was created.
 *
 * @param {Object} req - The request object containing `userEmail` and `type` in the query parameter, and `targetEmail` in the path parameter.
 * @param {Object} res - The response object used to return the table of nested membership or an error message.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Responds with the table of nested membership or an error message.
 * @throws {Error} Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getNestedTable = async (req, res, next) => {
  if (res.locals.cached) {
    return next()
  }

  const { userEmail } = req.query
  const { targetEmail } = req.params
  const targetType = res.locals.targetType
  
  try {
    const result = await groupsService.getNestedTables({
      userEmail,
      targetEmail,
      targetType,
    })

    res.locals.data = result.table
    res.locals.id = result.id
    res.locals.tables = result.tables
  } catch (error) {
    res.locals.statusCode = 500
    res.locals.data = { message: 'Error fetching a nested table' }
    logger.error(error)
  }
  next()
}
