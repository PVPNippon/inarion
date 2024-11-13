const groupsService = require('../services/groupsService')
const { getNestedTable, getHierarchy } = require('../services/nestedGroupsService')

/**
 * Retrieves the list of all groups in the organization.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all groups in the organization.
 *
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` in the request body.
 * @param {Object} res - The response object used to return the list of groups or an error message.
 * @returns {Promise<void>} - Responds with the list of groups or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.listAllGroups = async (req, res) => {
  const { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey } = req.body
  try {
    // Get an array with all organization's groups
    const groups = await groupsService.listGroups({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
    })

    // Return the list of all organization's groups
    res.status(200).json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    res.status(500).json({ message: 'Error fetching groups' })
  }
}

/**
 * Retrieves a specific group's details.
 *
 * This function takes a group's email address and returns its details, such as its name, email address, and description.
 *
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, and `groupEmail` in the request body.
 * @param {Object} res - The response object used to return the group's details or an error message.
 * @returns {Promise<void>} - Responds with the group's details or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getGroup = async (req, res) => {
  const { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail } = req.body

  try {
    const response = await groupsService.getGroupByEmail({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmail,
    })

    // Return the group's details
    res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching group:', error)
    //the reason why 404 and 403 are grouped is:
    //by try and error method I found out that error 404 is returned when query email is not a proper email address(missing @ symbol etc)
    //and error 403 is returned when query email address doesn't exist but looks like a proper email address
    //Probably this is Google's measure to prevent guessing of email addresses by probing
    if (error.status === 404 || error.status === 403) {
      return res
        .status(404)
        .json({ message: 'Group does not exist or you do not have necessary permissions to see this group' })
    }
    res.status(500).json({ message: 'Error fetching group' })
  }
}

/**
 * Retrieves the list of direct members of a group.
 *
 * This function takes a group's email address and returns its direct members.
 *
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, and `groupEmail` in the request body.
 * @param {Object} res - The response object used to return the list of direct members or an error message.
 * @returns {Promise<void>} - Responds with the list of direct members or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.listDirectMembers = async (req, res) => {
  const { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail } = req.body

  try {
    const response = await groupsService.listGroupMembers({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmail,
      includeDerivedMembership: false, //set derived membership to false
    }) // Get the list of direct members

    // Return the list of direct members of the group
    res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching members:', error)
    if (error.status === 404 || error.status === 403) {
      return res
        .status(404)
        .json({ message: 'Group does not exist or you do not have necessary permissions to see this group' })
    }
    res.status(500).json({ message: 'Error fetching members' })
  }
}

/**
 * Retrieves the list of all members of a group (direct and indirect).
 *
 * This function takes a group's email address and returns a list of its members, including both direct and indirect members.
 *
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, and `groupEmail` in the request body.
 * @param {Object} res - The response object used to return the list of all members or an error message.
 * @returns {Promise<void>} - Responds with the list of all members or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.listAllMembers = async (req, res) => {
  const { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail } = req.body

  try {
    const response = await groupsService.listGroupMembers({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmail,
      includeDerivedMembership: true, //set derived membership to true
    }) // Get the list of direct members

    // Return the list of direct members of the group
    res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching members:', error)
    if (error.status === 404 || error.status === 403) {
      return res
        .status(404)
        .json({ message: 'Group does not exist or you do not have necessary permissions to see this group' })
    }
    res.status(500).json({ message: 'Error fetching members' })
  }
}

/**
 * Retrieves a list of all activities in the organization related to groups.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all activities related to groups in the organization.
 *
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` in the request body.
 * @param {Object} res - The response object used to return the list of activities or an error message.
 * @returns {Promise<void>} - Responds with the list of activities or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getGroupActivity = async (req, res) => {
  const { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey } = req.body

  try {
    // Get the list of group activity
    const response = await groupsService.getAllGroupsLogs({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
    })
    // Return the list of group activity in customer organization
    res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching group activity:', error)
    res.status(500).json({ message: 'Error fetching group activity' })
  }
}

/**
 * Retrieves a list of all activities in the organization related to joining groups.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all activities related to joining groups in the organization.
 *
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, and `serviceAccountPrivateKey` in the request body.
 * @param {Object} res - The response object used to return the list of activities or an error message.
 * @returns {Promise<void>} - Responds with the list of activities or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getGroupJoinedActivity = async (req, res) => {
  const { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey } = req.body

  try {
    //Return the list of group joined activity in customer organization
    const allActivities = await groupsService.getJoinGroupsLogs({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
    })
    res.status(200).json(allActivities)
  } catch (error) {
    console.error('Error fetching group joined activity:', error)
    res.status(500).json({ message: 'Error fetching group joined activity' })
  }
}

/**
 * Retrieves a list of nested groups that the group or user with the given email address is a member of.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, and `queryEmail` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to list all nested groups that the group with the given email address is a member of.
 *
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, and `queryEmail` in the request body.
 * @param {Object} res - The response object used to return the list of nested groups or an error message.
 * @returns {Promise<void>} - Responds with the list of nested groups or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getNestedMembership = async (req, res) => {
  const { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, queryEmail } = req.body
  try {
    const nestedTable = await getNestedTable({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      queryEmail,
    })
    //Return the data with group membership details
    res.status(200).json(nestedTable)
  } catch (error) {
    console.error('Error fetching nested membership:', error)
    res.status(500).json({ message: 'Error fetching nested membership' })
  }
}

/**
 * Retrieves a hierarchical representation of groups for a given email address.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, and `queryEmail` from the request body.
 * It uses these values to fetch a hierarchy of groups that the specified email address belongs to, including nodes and edges.
 *
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, and `queryEmail` in the request body.
 * @param {Object} res - The response object used to return the group hierarchy or an error message.
 * @returns {Promise<void>} - Responds with the group hierarchy or an error message.
 * @throws {Error} - Throws an error if there is an issue with the API call or if the hierarchy cannot be fetched.
 */
exports.getGroupHierarchy = async (req, res) => {
  const { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, queryEmail } = req.body

  //fetch array with nested membership and timestamps
  const groupHierarchy = await getHierarchy({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    queryEmail,
  })

  //if no group hierarchy, return 500
  if (!groupHierarchy) {
    res.status(500).json({ message: 'Error fetching hierarchy' })
    return
  }

  //if hierarchy has only one node and no edges, return 200 with a message
  if (groupHierarchy.nodes.length === 1 && groupHierarchy.edges.length === 0) {
    res.status(200).json({
      message: 'No parent groups or members found. Please check if the email address is correct and try again.',
    })
    return
  }

  //otherwise, return groupHierarchy
  res.status(200).json(groupHierarchy)
}

/**
 * Retrieves the list of lists of members of specified groups in exportable format.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail` and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to create a list of lists of members of the groups specified by `groups` in exportable format.
 *
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey` and `groups` in the request body.
 * @param {Object} res - The response object used to return the list of lists of members of the specified groups in exportable format, or an error message.
 * @returns {Promise<void>} - Responds with the list of lists of members of the specified groups in exportable format, or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.listGroupsMembersInExportFormat = async (req, res) => {
  const { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groups } = req.body

  try {
    const members = await groupsService.listMembersInExportFormat({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groups
    })

    res.status(200).json(members)
  } catch (error) {
    console.error('Error creating member lists in CSV format:', error)
    res.status(500).json({ message: 'Error creating member lists in CSV format' })
  }
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
 * @param {string} res - The response object used to return the response from the API, or an error message.
 * @returns {Promise<void>} - Responds with the response of the API call, or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.updateWhoCanLeaveGroup = async (req, res) => {
  const {userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail, whoCanLeaveGroup} = req.body

  if (whoCanLeaveGroup !== 'ALL_MEMBERS_CAN_LEAVE' && whoCanLeaveGroup !== 'ALL_MANAGERS_CAN_LEAVE' && whoCanLeaveGroup !== 'NONE_CAN_LEAVE') {
    return res.status(400).json({
      message: 'The value of \'whoCanLeaveGroup\' must be one of \'ALL_MEMBERS_CAN_LEAVE\', \'ALL_MANAGERS_CAN_LEAVE\' and \'NONE_CAN_LEAVE\''
    })
  }

  try {
    const response = await groupsService.updateGroup({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmail,
      resource: { whoCanLeaveGroup },
    })

    if (response.status === 200) {
      res.status(200).json({ message: `Set the 'whoCanLeaveGroup' of ${groupEmail} to ${whoCanLeaveGroup}` })
    } else {
      res.status(500).json({ message: 'The request could not be handled for some reason' })
      console.log(response)
    }
  } catch (error) {
    console.log('Error updating the specified group\'s \'whoCanLeaveGroup\' setting:', error)
    res.status(500).json({ message: 'Error updating the specified group\'s \'whoCanLeaveGroup\' setting' })
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
 * @param {string} res - The response object which has 3 properties, `deletedMembers`, `undeletedMembers` and `message`.
 *                       `deletedMembers` is an array which has the emails of the members who were successfully deleted from the target group with status code (204).
 *                       `undeletedMembers` is an array which has the emails of the members who were not deleted from the target group for some reason.
 *                       The error codes and messages are also included in the array.
 *                       `message` is a brief comment on the result of the operation.
 * @returns {Promise<void>} - Responds with the response of the API call, or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.deleteMembers = async (req, res) => {
  const {userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail, memberEmails} = req.body

  // Returns Bad Request if the target group is not specified.
  if (!groupEmail) {
    return res.status(400).json({ message: 'groupEmail is not specified' })
  }

  // Returns Bad Request if members to be deleted are not specified.
  if (!memberEmails || memberEmails.length === 0) {
    return res.status(400).json({ message: 'memberEmails are not specified' })
  }

  // Eliminate duplicate members if any.
  const uniqueMembers = [...new Set(memberEmails)]

  try {
    const response = await groupsService.deleteMembersWithRateLimit({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmail,
      memberEmails: uniqueMembers
    })

    if (response.undeletedMembers.length === 0) { // All requested members were deleted from the group successfully.
      response.message = `Deleted All requested member(s) from ${groupEmail}`
      res.status(200).json(response)
    
    } else if (response.deletedMembers.length > 0) { // Some requested members were deleted from the group successfully, but some were not.
      response.message = `${response.undeletedMembers.length} requested member(s) could not be deleted from ${groupEmail}`
      res.status(207).json(response) // Ref for the status code: https://xexeq.jp/blogs/media/it-glossary1206
    
    } else { // No requested members were deleted from the group.
      response.message = `No members were deleted from ${groupEmail}`

      // If one of the status codes are in 500, the status code of the response should be 500 (Internal Server Error).
      // Otherwise it should be 400 (Bad Request).
      const statusCode = response.undeletedMembers.some(({statusCode}) => statusCode >= 500 && statusCode < 600) ? 500 : 400
      
      res.status(statusCode).json(response)
    }
  } catch (error) {
    console.log('Error deleting members:', error)
    res.status(500).json({ message: `Error deleting members from ${groupEmail}` })
  }
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
 * @param {string} res - The response object which has 3 properties, `succeededGroups`, `failedGroups` and `message`.
 *                       `succeededGroups` is an array of the email addresses of the groups from which the target member was successfully deleted with status code (204).
 *                       `failedGroups` is an array of the email addresses of the groups from which the target member failed to be deleted for some reason.
 *                       The error codes and messages are also included in the array.
 *                       `message` is a brief comment on the result of the entire operation.
 * @returns {Promise<void>} - Responds with the response of the API call, or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.deleteMemberFromGroups = async (req, res) => {
  const {userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmails, memberEmail} = req.body

  // Returns Bad Request if the target groups are not specified.
  if (!groupEmails || groupEmails.length === 0) {
    return res.status(400).json({ message: 'groupEmails are not specified' })
  }

  // Returns Bad Request if a member to be deleted is not specified.
  if (!memberEmail) {
    return res.status(400).json({ message: 'memberEmail is not specified' })
  }

  // Eliminate duplicate groups if any.
  const uniqueGroups = [...new Set(groupEmails)]

  try {
    const response = await groupsService.deleteMemberFromGroupsWithRateLimit({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmails: uniqueGroups,
      memberEmail
    })

    if (response.failedGroups.length === 0) { // The member was successfully deleted from all requested groups.
      response.message = `Deleted ${memberEmail} from all requested group(s)`
      res.status(200).json(response)
    
    } else if (response.succeededGroups.length > 0) { // The member was deleted from some requested groups, but not from all requested groups.
      response.message = `${memberEmail} could not be deleted from ${response.failedGroups.length} requested group(s)`
      res.status(207).json(response) // Ref for the status code: https://xexeq.jp/blogs/media/it-glossary1206
    
    } else { // The member was not deleted from all requested groups.
      response.message = `${memberEmail} was not deleted from all requested group(s)`

      // If one of the status codes are in 500, the status code of the response should be 500 (Internal Server Error).
      // Otherwise it should be 400 (Bad Request).
      const statusCode = response.failedGroups.some(({statusCode}) => statusCode >= 500 && statusCode < 600) ? 500 : 400
      
      res.status(statusCode).json(response)
    }
  } catch (error) {
    console.log('Error deleting member:', error)
    res.status(500).json({ message: `Error deleting ${memberEmail} from the requested group(s)` })
  }
}