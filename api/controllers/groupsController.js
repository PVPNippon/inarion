const { google } = require('googleapis')
const oauth2Client = require('../models/googleAuth')
const ServiceAccountKeys = require('../models/ServiceAccountKeys')
const { getCredentials } = require('../config/googleGroupsConfig')
const config = require('../config/config')
const {
  listGroups,
  getGroupByEmail,
  listGroupMembers,
  getAllGroupsLogs,
  getNestedTable,
} = require('../services/groupsService')
require('dotenv').config()

/**
 * Decodes the base64-encoded privateKeyData and parses it as JSON.
 *
 * @param {string} privateKeyData - The base64-encoded private key data.
 * @returns {Object} - The decoded and parsed JSON object containing the credentials.
 */
function decodePrivateKeyData(privateKeyData) {
  const decodedData = Buffer.from(privateKeyData, 'base64').toString('utf8')
  return JSON.parse(decodedData)
}

/**
 * Creates a new JWT client, specifying the user to impersonate and authorizes it.
 *
 * The client is authorized with the scopes required to read the user's groups and
 * the user's audit logs.
 *
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} privateKey - The private key of the service account.
 * @param {string} userEmail - The email address of the user to impersonate.
 * @returns {Promise<Object>} - A promise that resolves to the authorized client.
 */
async function getClient(serviceAccountEmail, privateKey, userEmail) {
  // Create a new JWT client, specifying the user to impersonate
  const jwtClient = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.group',
      'https://www.googleapis.com/auth/admin.reports.audit.readonly',
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
    ],
    subject: userEmail, // Impersonating this user
  })

  // Authorize the client
  await jwtClient.authorize()
  return jwtClient
}

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
  let { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey } = req.body
  try {
    // Get an array with all organization's groups
    const groups = await listGroups(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey)

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
  let { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail } = req.body

  try {
    const response = await getGroupByEmail(
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmail
    )

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
  let { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail } = req.body

  try {
    const response = await listGroupMembers(
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmail,
      false //set derived membership to false
    ) // Get the list of direct members

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
  let { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail } = req.body

  try {
    const response = await listGroupMembers(
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmail,
      true //set derived membership to true
    ) // Get the list of direct members

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
  let { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey } = req.body

  try {
    // Get the list of group activity
    const response = await getAllGroupsLogs(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey)
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
  let { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey } = req.body
  const keyData = decodePrivateKeyData(serviceAccountPrivateKey)
  const privateKey = keyData.private_key

  try {
    const promises = []
    let allActivities = []

    const jwtClient = await getClient(serviceAccountEmail, privateKey, userEmail)
    const admin = google.admin({ version: 'reports_v1', auth: jwtClient })

    // Get all activities related to joining groups(could identify 2 by now, could be more)
    // Could not find a way to specify multiple activities in the eventName field
    // => fetch each eventName separately and concat the results
    const activityNames = ['add_member', 'accept_invitation']

    activityNames.forEach(async (activityName) => {
      const x = new Promise((resolve, reject) => {
        resolve(
          admin.activities.list({
            customerId: 'my_customer',
            userKey: 'all',
            applicationName: 'groups_enterprise',
            maxResults: 1000, //max allowed value, need to add pagination logic(TODO)
            eventName: activityName,
          })
        )
      })
      promises.push(x)
    })

    await Promise.all(promises).then((results) => {
      results.forEach((result) => {
        allActivities = allActivities.concat(result.data.items)
      })
    })

    //Return the list of group joined activity in customer organization
    res.status(200).json(allActivities)
  } catch (error) {
    console.error('Error fetching group joined activity:', error)
    res.status(500).json({ message: 'Error fetching group joined activity' })
  }
}

exports.getNestedMembership = async (req, res) => {
  let { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, queryEmail } = req.body

  const nestedTable = await getNestedTable(
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    queryEmail
  )
  res.status(200).json(nestedTable)
}
