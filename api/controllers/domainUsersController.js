// Function to decrypt the private key
const oauth2Client = require('../models/googleAuth')
const { google } = require('googleapis') // Google APIs client library
const ServiceAccountKeys = require('../models/ServiceAccountKeys')
const crypto = require('crypto')
const dataController = require('../controllers/dataController')
const encryptionKey = 'my-hardcoded-secret-key'
const config = require('../config/config')
const logger = require('../logger/logger')(__filename, 'Domain Users')
require('dotenv').config()

function decodePrivateKeyData(privateKeyData) {
  const decodedData = Buffer.from(privateKeyData, 'base64').toString('utf8')
  return JSON.parse(decodedData)
}

/**
 * Retrieves a list of users from the specified domain using Google Admin SDK.
 *
 * This function interacts with the Google Admin Directory API to list all users within a specified domain.
 * It retrieves the service account data and key for the domain, uses JWT authentication to impersonate a user,
 * and makes the API request to list the domain users. The function requires the service account email, private key,
 * and the email of the user to impersonate.
 *
 * @param {Object} req - The request object containing the `email` and `userEmail` in the request body.
 * @param {Object} res - The response object used to return the list of users or an error.
 * @returns {Promise<void>} - Responds with the list of users in the domain or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getDomainUsersList = async (req, res) => {
  let { email, userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey } = req.body // Extract the email and userEmail from the request body

  logger.debug(`Type of projectData:${typeof serviceAccountEmail}`)
  // Retrieve project data using the user email
  // let projectData = await dataController.getProjectData(userEmail);
  // if(projectId === undefined){
  //   logger.info('Came in here');
  //   projectId = projectData.projectId;
  // }
  // logger.info(`ProjectID: ${projectId}`);

  // Retrieve service account data using the project ID
  // let serviceAccountData = await dataController.getServiceAccountData(projectId);
  // let serviceAccountEmail = serviceAccountData.serviceAccountEmail;

  // Retrieve the service account key using the service account email
  // let serviceAccountKey = await dataController.getServiceAccountKey(serviceAccountEmail);

  // If the service account key is not found, return a 404 error
  // if (!serviceAccountKey) {
  //   return res.status(404).json({ message: 'Service account key not found' });
  // }

  // Extract the private key data
  // const privateKey = serviceAccountKey.privateKeyData;
  // logger.info(privateKey);

  // Decode the private key data for the service account
  // const keyData = decodePrivateKeyData(serviceAccountKey.privateKeyData);
  logger.debug(`Privvvv key: ${serviceAccountPrivateKey}`)
  const keyData = decodePrivateKeyData(serviceAccountPrivateKey)
  logger.debug(JSON.stringify(keyData, null, 2))
  const privateKey = keyData.private_key

  // Create a new JWT client, specifying the user to impersonate
  const jwtClient = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
    subject: userEmail, // Impersonating this user
  })

  // Authorize the client
  await jwtClient.authorize()

  const admin = google.admin({ version: 'directory_v1', auth: jwtClient })

  const response = await admin.users.list({
    // customer: 'my_customer', // Use 'my_customer' to list users in the entire domain
    // domain: 'pvp-test-domain2.com',
    domain: process.env.DOMAIN_TEST,
  })

  // Return the list of users as the response
  res.status(200).json(response.data.users)
}

exports.listAllDriveFiles = async (req, res) => {
  const { userEmail } = req.body // The admin user's email for impersonation

  try {
    // Fetch all the Drive files for all users
    const allUserDriveFiles = await getDriveFilesForAllUsers(userEmail)

    // Return the result in the response
    res.status(200).json(allUserDriveFiles)
  } catch (error) {
    logger.error(`Error listing Drive files for all users:${error}`)
    res.status(500).json({ message: 'Error listing Drive files for users' })
  }
}
