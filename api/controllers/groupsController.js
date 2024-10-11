const { google } = require('googleapis')
const oauth2Client = require('../models/googleAuth')
const ServiceAccountKeys = require('../models/ServiceAccountKeys')
const { getCredentials } = require('../config/googleGroupsConfig')
const config = require('../config/config')
const { listGroups } = require('../services/groupsService')
require('dotenv').config()

// exports.listAllGroups = async (req, res) => {
//   try {
//     let { email, emailToImpersonate, projectId, serviceAccountEmail, serviceAccountPrivateKey } = req.body
//     const groups = await listGroups(email, emailToImpersonate, projectId, serviceAccountEmail, serviceAccountPrivateKey)
//     res.status(200).json(groups)
//     console.log(groups)
//   } catch (error) {
//     console.error('Error fetching groups:', error)
//     res.status(500).json({ message: 'Error fetching groups' })
//   }
// }

function decodePrivateKeyData(privateKeyData) {
  const decodedData = Buffer.from(privateKeyData, 'base64').toString('utf8')
  return JSON.parse(decodedData)
}

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

exports.listAllGroups = async (req, res) => {
  let { email, userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey } = req.body // Extract the email and userEmail from the request body
  console.log('Type of projectData:', typeof serviceAccountEmail)
  console.log(`ProjectID: ${projectId}`)
  console.log(`Privvvv key: ${serviceAccountPrivateKey}`)
  const keyData = decodePrivateKeyData(serviceAccountPrivateKey)
  console.log(keyData)
  const privateKey = keyData.private_key

  try {
    const jwtClient = await getClient(serviceAccountEmail, privateKey, userEmail)
    const admin = google.admin({ version: 'directory_v1', auth: jwtClient })

    const response = await admin.groups.list({
      customer: 'my_customer',
      maxResults: 200, //max allowed value
      orderBy: 'email',
      // useDomainAdminAccess: true,
      // domain: process.env.DOMAIN_TEST,
    })
    console.log(response.data)

    // Return the list of users as the response
    res.status(200).json(response.data)
  } catch (error) {
    console.error('Error fetching groups:', error)
    res.status(500).json({ message: 'Error fetching groups' })
  }
}

exports.getGroup = async (req, res) => {
  let { email, userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, groupEmail } = req.body // Extract the email and userEmail from the request body
  console.log('Type of projectData:', typeof serviceAccountEmail)
  console.log(`ProjectID: ${projectId}`)
  console.log(`Privvvv key: ${serviceAccountPrivateKey}`)
  const keyData = decodePrivateKeyData(serviceAccountPrivateKey)
  console.log(keyData)
  const privateKey = keyData.private_key

  try {
    const jwtClient = await getClient(serviceAccountEmail, privateKey, userEmail)
    const admin = google.admin({ version: 'directory_v1', auth: jwtClient })
    const response = await admin.groups.get({
      groupKey: groupEmail,
      domain: process.env.DOMAIN_TEST,
    })
    console.log(response)
    if (response.status === 404) {
      res.status(404).json({ message: 'Group not found' })
    }
    // Return the list of users as the response
    res.status(200).json(response.data)
  } catch (error) {
    console.error('Error fetching group:', error)
    res.status(500).json({ message: 'Error fetching group' })
  }
}
