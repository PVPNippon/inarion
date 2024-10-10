//NOT IN USE NOW
//I just copied it from drive config in hope of using it later
const { google } = require('googleapis')
const ServiceAccountKeys = require('../models/ServiceAccountKeys')

/**
 * Retrieves and decodes service account credentials from the database.
 *
 * This function fetches the service account credentials using the provided email, decodes the base64-encoded privateKeyData,
 * and parses it to extract the credentials in JSON format.
 *
 * @param {string} serviceAccountEmail - The email address associated with the service account.
 * @returns {Promise<Object>} - A promise that resolves to the decoded and validated credentials object.
 * @throws Will throw an error if the service account key is not found, the credentials are invalid, or the JSON parsing fails.
 */
async function getCredentials(serviceAccountEmail) {
  // Fetch the service account key from the database using the provided email.
  let serviceAccountKeyInDB = await ServiceAccountKeys.findOne({ where: { serviceAccountEmail: serviceAccountEmail } })

  // If the service account key is not found, throw an error to indicate the issue.
  if (!serviceAccountKeyInDB) {
    throw new Error(`Service account key not found for ${serviceAccountEmail}`)
  }

  // Decode the base64-encoded privateKeyData to get the actual JSON credentials.
  const decodedCredentials = Buffer.from(serviceAccountKeyInDB.privateKeyData, 'base64').toString('utf8')

  let credentials
  try {
    // Parse the decoded JSON string to extract the credentials.
    credentials = JSON.parse(decodedCredentials)
  } catch (error) {
    // If there is an error in parsing, log the error and throw a new error indicating invalid credentials format.
    console.error('Error parsing the credentials JSON:', error)
    throw new Error('Invalid credentials format')
  }

  // Ensure the parsed credentials contain the necessary fields: client_email, private_key, and token_uri.
  if (!credentials.client_email || !credentials.private_key || !credentials.token_uri) {
    throw new Error('Invalid or incomplete credentials')
  }

  // Return the validated credentials to be used in further operations.
  return credentials
}

/**
 * Initializes the Google Auth client.
 *
 * This function sets up the Google Auth client using the provided credentials and configures it with the necessary scopes for accessing the Google Drive API.
 *
 * @param {Object} credentials - The credentials object containing the client_email, private_key, and token_uri.
 * @returns {Promise<Object>} - A promise that resolves to the initialized GoogleAuth client.
 */
async function initializeGoogleAuth(credentials) {
  const auth = new google.auth.GoogleAuth({
    // Provide the credentials to the GoogleAuth client.
    credentials: credentials,
    // Specify the required scopes for Admin Directory API access.
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.group',
      'https://www.googleapis.com/auth/admin.reports.audit.readonly',
    ],
  })

  // Return the initialized auth client.
  console.log(auth)
  return auth
}
