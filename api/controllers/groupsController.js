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
      serviceAccountPrivateKey
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
      groupEmail
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
      includeDerivedMembership: false
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
      includeDerivedMembership: true
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
      serviceAccountPrivateKey
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
      serviceAccountPrivateKey
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

  //fetch array with nested membership and timestamps
  const nestedTable = await getNestedTable(
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    queryEmail
  )

  //if nestedTable is null, return 404
  if (nestedTable === null) return res.status(404).json({ message: 'Group or user not found' })

  //if nestedTable is empty, return 200 with empty array
  if (nestedTable.length === 0) return res.status(200).json([])

  //return nestedTable
  if (!nestedTable) res.status(500).json({ message: 'Error fetching nested membership' })

  //return nestedTable
  res.status(200).json(nestedTable)
}

exports.getGroupHierarchy = async (req, res) => {
  const { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, queryEmail } = req.body

  //fetch array with nested membership and timestamps
  const groupHierarchy = await getHierarchy(
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    queryEmail
  )

  if (!groupHierarchy) {
    res.status(500).json({ message: 'Error fetching hierarchy' })
    return
  }

  if (groupHierarchy.nodes.length === 1 && groupHierarchy.edges.length === 0) {
    res.status(200).json({
      message: 'No parent groups or members found. Please check if the email address is correct and try again.',
    })
    return
  }

  res.status(200).json(groupHierarchy)
}

/**
 * Retrieves the list of lists of members of specified groups in exportable format.
 *
 * This function takes the `userEmail`, `projectId`, `serviceAccountEmail` and `serviceAccountPrivateKey` from the request body.
 * It uses these values to authorize a JWT client, which it then uses to make a request to the Google Admin Directory API
 * to create a list of lists of members of the specified groups in exportable format.
 *
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey` and `groups` in the request body.
 * @param {string} res - The response object used to return the list of lists of members of the specified groups in exportable format, or an error message.
 * @returns {Promise<void>} - Responds with the list of lists of members of the specified groups in exportable format, or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.listGroupsMembersInExportFormat = async (req, res) => {
  const {userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groups} = req.body

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
 * @param {Object} req - The request object containing the `userEmail`, `projectId`, `serviceAccountEmail`, `serviceAccountPrivateKey`, `groupEmail` and `whoCanLeave` in the request body.
 * @param {string} res - The response object used to return the response from the API, or an error message.
 * @returns {Promise<void>} - Responds with the response of the API call, or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.updateWhoCanLeaveGroup = async (req, res) => {
  const {userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail, whoCanLeave} = req.body

  let whoCanLeaveGroup
  switch (whoCanLeave) {
    case 'managers':
      whoCanLeaveGroup = 'ALL_MANAGERS_CAN_LEAVE'
      break
    case 'none':
      whoCanLeaveGroup = 'NONE_CAN_LEAVE'
      break
    default:
      whoCanLeaveGroup = 'ALL_MEMBERS_CAN_LEAVE'
  }

  try {
    await groupsService.updateGroup({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmail,
      resource: {whoCanLeaveGroup},
    })

    res.status(200).json({ message: `Set the 'whoCanLeaveGroup' of ${groupEmail} to ${whoCanLeaveGroup}` })
  } catch (error) {
    console.log('Error updating the specified group\'s \'whoCanLeaveGroup\' setting:', error)
    res.status(500).json({ message: 'Error updating the specified group\'s \'whoCanLeaveGroup\' setting' })
  }
}