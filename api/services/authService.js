const { google } = require('googleapis')
const cacheService = require('../controllers/cacheController')
const ServiceAccountKeys = require('../models/ServiceAccountKeys')

/**
 * Retrieves and decodes service account credentials from the database.
 *
 * This function fetches the service account credentials using the provided email, decodes the base64-encoded privateKeyData,
 * and parses it to extract the credentials in JSON format.
 *
 * If the service account key is not found in the redis, it is fetched from DB and stored in redis.
 * If the service account key is still not found, an error is thrown.
 *
 * @param {string} serviceAccountEmail - The email address associated with the service account.
 * @param {string} [serviceAccountPrivateKey] - The private key of the service account. If not provided, it is fetched from the database.
 * @returns {Promise<Object>} - A promise that resolves to the decoded and validated credentials object.
 * @throws Will throw an error if the service account key is not found, the credentials are invalid, or the JSON parsing fails.
 */
async function getCredentials(userEmail, serviceAccountEmail, serviceAccountPrivateKey) {
  //I'm using userEmail instead of serviceAccountEmail here,
  //because we are planning to stop passine serviceAccountEmail from front-end too
  //probably, it will be better to create the key with domain only, not the full email address
  const redisKey = userEmail + '_SA_private_key'
  //prepare service account key placeholder
  let serviceAccountKeyInDB

  // Fetch the service account key from the database using the provided email
  if (!serviceAccountPrivateKey) {
    //First try fetching the service account key from redis
    serviceAccountKeyInDB = (await cacheService.getValueFromRedis(redisKey)) || null

    // If the service account key is not found in Redis, fetch it from the database
    if (!serviceAccountKeyInDB || !serviceAccountKeyInDB.privateKeyData) {
      serviceAccountKeyInDB = await ServiceAccountKeys.findOne({ where: { serviceAccountEmail: serviceAccountEmail } })

      // If the service account key is still not found, throw an error
      if (!serviceAccountKeyInDB) {
        throw new Error(`Service account key not found for ${serviceAccountEmail}`)
      }

      // Store the service account key in Redis
      await cacheService.storeDataInRedis(redisKey, {
        privateKeyData: serviceAccountKeyInDB.privateKeyData,
      })
    }

    // Update the serviceAccountPrivateKey with the fetched service account key
    serviceAccountPrivateKey = serviceAccountKeyInDB.privateKeyData
  }

  //Decode the base64-encoded privateKeyData to get the actual JSON credentials.
  const decodedCredentials = Buffer.from(serviceAccountPrivateKey, 'base64').toString('utf8')

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
  // Initialize the GoogleAuth client using the provided credentials
  const auth = new google.auth.GoogleAuth({
    // Provide the credentials to the GoogleAuth client.
    credentials: credentials,
    // Specify the required scopes API access.
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/admin.directory.group',
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
      'https://www.googleapis.com/auth/admin.reports.audit.readonly',
      'https://www.googleapis.com/auth/apps.groups.settings',
    ],
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
async function impersonateClient(impersonatedUser, auth, typeOfInstance) {
  // Retrieve the client from the auth instance.
  let authClient = await auth.getClient()
  // Set the subject (user to impersonate) for the auth client.
  authClient.subject = impersonatedUser // Impersonate the specified user

  let service
  switch (typeOfInstance) {
    case 'drive':
      service = google.drive({ version: 'v3', auth: authClient })
      break
    case 'reports':
      service = google.admin({ version: 'reports_v1', auth: authClient })
      break
    case 'directory':
      service = google.admin({ version: 'directory_v1', auth: authClient })
      break
    default:
      service = google.admin({ version: 'directory_v1', auth: authClient })
  }
  return service
}

async function getImpersonatedClientInstance(impersonatedUser, serviceAccountEmail, typeOfInstance) {
  const credentials = await getCredentials(impersonatedUser, serviceAccountEmail)

  const jwtClient = await initializeGoogleAuth(credentials)

  const service = await impersonateClient(impersonatedUser, jwtClient, typeOfInstance)
  return service
}

module.exports = {
  getCredentials,
  initializeGoogleAuth,
  impersonateClient,
  getImpersonatedClientInstance,
}
