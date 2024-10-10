const { google } = require('googleapis')
const oauth2Client = require('../models/googleAuth')
const ServiceAccountKeys = require('../models/ServiceAccountKeys')
const { getCredentials } = require('../config/googleGroupsConfig')
const config = require('../config/config')
require('dotenv').config()

function decodePrivateKeyData(privateKeyData) {
  const decodedData = Buffer.from(privateKeyData, 'base64').toString('utf8')
  return JSON.parse(decodedData)
}
async function listGroups(email, userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey) {
  const keyData = decodePrivateKeyData(serviceAccountPrivateKey)
  const privateKey = keyData.private_key
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
  const token = await jwtClient.authorize()

  try {
    const directory = google.admin({
      version: 'directory_v1',
      auth: jwtClient,
    })
    const response = await directory.groups.list({
      // customer: 'my_customer',
      // maxResults: 200, //max allowed value
      orderBy: 'email',
      // useDomainAdminAccess: true,
      domain: process.env.DOMAIN_TEST,
    })

    console.log(response.data)

    return response.data
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  listGroups,
}
