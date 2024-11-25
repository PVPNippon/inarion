const { google } = require('googleapis')
const ServiceAccountKeys = require('../models/ServiceAccountKeys')
const logger = require('../logger')(__filename)

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
async function getCredentials(serviceAccountEmail, serviceAccountPrivateKey) {
  let serviceAccountKeyInDB = ''
  if (!serviceAccountPrivateKey) {
    // Fetch the service account key from the database using the provided email.
    serviceAccountKeyInDB = await ServiceAccountKeys.findOne({ where: { serviceAccountEmail: serviceAccountEmail } })
    // If the service account key is not found, throw an error to indicate the issue.
    if (!serviceAccountKeyInDB) {
      throw new Error(`Service account key not found for ${serviceAccountEmail}`)
    }
    serviceAccountPrivateKey = serviceAccountKeyInDB
  }

  // Decode the base64-encoded privateKeyData to get the actual JSON credentials.
  const decodedCredentials = Buffer.from(serviceAccountPrivateKey, 'base64').toString('utf8')

  let credentials
  try {
    // Parse the decoded JSON string to extract the credentials.
    credentials = JSON.parse(decodedCredentials)
  } catch (error) {
    // If there is an error in parsing, log the error and throw a new error indicating invalid credentials format.
    logger.error(`Error parsing the credentials JSON:${error}`, {
      functionName: 'getCredentials',
      module: 'Google Drive',
    })
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
    // Specify the required scopes for Google Drive API access.
    scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.metadata.readonly'],
  })

  // Return the initialized auth client.
  return auth
}

/**
 * Impersonates a user to access Google Drive resources on their behalf.
 *
 * This function configures the Google Auth client to impersonate a specified user, allowing access to the user's Google Drive resources.
 *
 * @param {string} impersonatedUser - The email address of the user to impersonate.
 * @param {Object} auth - The initialized GoogleAuth client.
 * @returns {Promise<Object>} - A promise that resolves to the Google Drive client instance configured for the impersonated user.
 */
async function impersonateClient(impersonatedUser, auth) {
  // Retrieve the client from the auth instance.
  const authClient = await auth.getClient()
  // Set the subject (user to impersonate) for the auth client.
  authClient.subject = impersonatedUser // Impersonate the specified user
  // Return the Google Drive client instance configured with the impersonated user.
  return google.drive({ version: 'v3', auth: authClient })
}

module.exports = {
  getCredentials,
  initializeGoogleAuth,
  impersonateClient,
}
