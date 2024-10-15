const { google } = require('googleapis')
const oauth2Client = require('../models/googleAuth')
const ServiceAccountKeys = require('../models/ServiceAccountKeys')
const { getCredentials } = require('../config/googleGroupsConfig')
const config = require('../config/config')
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
 * Creates a new JWT client, specifying the user to impersonate, and authorizes it.
 *
 * The client is authorized with the scopes required to read the user's groups and
 * the user's audit logs.
 *
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} privateKey - The private key of the service account.
 * @param {string} userEmail - The email address of the user to impersonate.
 * @returns {Promise<Object>} - A promise that resolves to the authorized client.
 */
async function getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) {
  const keyData = decodePrivateKeyData(serviceAccountPrivateKey) // Decode the private key
  const privateKey = keyData.private_key // Extract the private key
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
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The project ID of the GCP project.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of group objects.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
async function listGroups(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client
  let nextPageToken = null // Token to manage pagination
  let groups = [] // Container for all groups retrieved
  let groupsResponse // Response from the API

  // Fetch all groups
  do {
    try {
      const directory = google.admin({
        version: 'directory_v1',
        auth: jwtClient,
      })
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
    } catch (error) {
      // Log the error and rethrow it if groups fetching fails
      console.error('Error fetching groups:', error.message)
      throw error
    }
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
async function getGroupByEmail(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client
  try {
    const admin = google.admin({ version: 'directory_v1', auth: jwtClient }) // Create the Admin Directory API client
    const response = await admin.groups.get({
      groupKey: groupEmail,
    }) // Get the group details
    return response.data // Return the group details
  } catch (error) {
    console.error('Error fetching group:', error)
    throw error
  }
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
async function listGroupMembers(
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groupEmail,
  includeDerivedMembership
) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) // Create the JWT client
  let nextPageToken = null // Token to manage pagination
  let members = [] // Container for members retrieved
  let membersResponse // Response from the API

  //Fetch members
  do {
    try {
      const directory = google.admin({
        version: 'directory_v1',
        auth: jwtClient,
      })
      membersResponse = await directory.members.list({
        groupKey: groupEmail,
        maxResults: 1, //max allowed value
        includeDerivedMembership: includeDerivedMembership,
        pageToken: nextPageToken,
      })

      if (typeof membersResponse.data.members === 'undefined') {
        return [{ response: 'no members found' }]
      } // Return an array with error messageif no members are found(temporary "error handling")

      // Append the fetched groups to the members array
      members.push(...membersResponse.data.members)

      // Store the next page token for pagination
      nextPageToken = membersResponse.data.nextPageToken
    } catch (error) {
      // Log the error and rethrow it if member fetching fails
      console.error('Error fetching members:', error.message)
      throw error
    }
  } while (nextPageToken) // Continue fetching members while there are more pages

  return members // Return all fetched members
}

//WARNING:
//the logic below is neither optimized nor checked properly.
//Don't look down here for the sake of your sanity.
async function getNestedTable(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, queryEmail) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  try {
    const directory = google.admin({
      version: 'directory_v1',
      auth: jwtClient,
    })
    const theGroup = queryEmail
    const response = await directory.groups.list({
      customer: 'my_customer',
      maxResults: 200, //max allowed value
      orderBy: 'email',
    })

    let groups = response.data.groups
    groups = groups.filter((group) => group.directMembersCount > 0)

    async function getFamily(groups) {
      const promises = []
      const family = []
      groups.forEach(async (group) => {
        const x = new Promise((resolve, reject) => {
          resolve(
            directory.members.list({
              groupKey: group.email,
              maxResults: 200, //max allowed value
              includeDerivedMembership: true,
            })
          )
        })
        promises.push(x)
      })
      await Promise.all(promises).then((values) => {
        values.forEach((value) => {
          family.push(value.data.members)
        })
      })
      return family
    }

    const allMembers = await getFamily(groups)

    const family = []

    allMembers.forEach((members) => {
      members.forEach((member) => {
        if (member.email === theGroup) {
          const index = allMembers.indexOf(members)
          const groupAndAllMembers = {
            group: groups[index],
            members: members,
          }
          family.push(groupAndAllMembers)
        }
      })
    })

    function hasRelation(suspectedParent, indirectParent, family) {
      const indirectParentObj = family.find((group) => group.group.email === indirectParent)
      const directMembers = indirectParentObj.members
      const target = directMembers.filter((member) => member.email === suspectedParent)
      if (target.length > 0) {
        return true
      } else {
        return false
      }
    }
    function getTransitive(family, directMembersArray, theGroup, indirectParent) {
      let directParent = ''
      let fullFamily = family
      for (let i = 0; i < fullFamily.length; i++) {
        fullFamily[i] = Object.assign(fullFamily[i], {
          directMembers: directMembersArray[i],
        })
      }

      do
        fullFamily.forEach((group) => {
          const members = group.directMembers
          const target = members.filter((member) => member.email === theGroup)
          if (target.length > 0 && hasRelation(group.group.email, indirectParent, fullFamily)) {
            directParent = group.group.email
          }
        })
      while (directParent === '')
      return directParent
    }

    async function getTimestamps() {
      try {
        const response = await fetch('http://localhost:4000/groups/get-group-joined-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: userEmail,
            projectId: projectId,
            serviceAccountEmail: serviceAccountEmail,
            serviceAccountPrivateKey: serviceAccountPrivateKey,
          }),
        })
        const data = await response.json()
        return data
      } catch (error) {
        console.log(error)
      }
    }

    function getJoinedTime(allActivities, memberId, groupId) {
      let joinedTime = 'not found'
      allActivities.forEach((activity) => {
        const event = activity.events[0].parameters
        let member_Id
        let group_Id
        if (typeof event[1] === 'undefined') {
          group_Id = event[0].value
          member_Id = activity.actor.email
        } else {
          group_Id = event[1].value
          member_Id = event[0].value
        }

        if (member_Id === memberId && group_Id === groupId) {
          const date = new Date(activity.id.time)
          joinedTime = date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
            timeZoneName: 'short',
            timeZone: 'Asia/Tokyo',
          })

          return joinedTime
        }
      })

      return joinedTime
    }

    async function getTable(family) {
      const table = []
      const promises = []
      const relations = []

      family.forEach(async (group) => {
        const directMembers = new Promise((resolve, reject) => {
          resolve(
            directory.members.list({
              groupKey: group.group.email,
              maxResults: 200, //max allowed value
              includeDerivedMembership: false,
            })
          )
        })
        promises.push(directMembers)
      })
      await Promise.all(promises).then((values) => {
        values.forEach((value) => {
          relations.push(value.data.members)
        })
      })

      relations.forEach((relation) => {
        const index = relations.indexOf(relation)
        const group = family[index]
        const obj = {
          email: group.group.email,
          timestamp: '',
        }

        const targetGroup = relation.filter((member) => member.email === theGroup)

        if (targetGroup.length > 0) {
          obj.membership = 'Direct'
          obj.inherited = ''
        } else {
          const inheritedVia = getTransitive(family, relations, theGroup, group.group.email) || ''
          obj.membership = 'Inherited'
          obj.inherited = inheritedVia
        }
        table.push(obj)
      })

      return table
    }

    const table = await getTable(family)
    async function updateTable(table) {
      const allActivities = await getTimestamps()
      const updatedTable = table

      updatedTable.forEach((member) => {
        let parentEmail
        if (member.membership === 'Inherited') {
          parentEmail = member.inherited
        } else if (member.membership === 'Direct') {
          parentEmail = member.email
        }
        member.timestamp = getJoinedTime(allActivities, theGroup, parentEmail)
      })

      return updatedTable
    }
    const updatedTable = await updateTable(table)
    return updatedTable
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  listGroups,
  getNestedTable,
  getGroupByEmail,
  listGroupMembers,
}
