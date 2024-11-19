const { google } = require('googleapis')
const cacheService = require('../controllers/cacheController')
const ServiceAccountKeys = require('../models/ServiceAccountKeys')
const Users = require('../models/User')
const Projects = require('../models/Project')
const ServiceAccounts = require('../models/ServiceAccount')
const instanceStore = require('..').instanceStore
/**
 * Retrieves and decodes service account credentials from redis or the database.
 *
 * This function fetches the service account email and key using the provided email, decodes the base64-encoded privateKeyData,
 * and parses it to extract the credentials in JSON format. If the service account email and key are not provided, it tries to
 * fetch them from Redis and if not found, fetches it from the database and stores in Redis.
 *
 * @param {string} userEmail - The email address associated with the user.
 * @param {string} serviceAccountEmail - The email address associated with the service account.
 * @param {string} serviceAccountPrivateKey - The private key associated with the service account.
 * @returns {Promise<Object>} - A promise that resolves to the decoded and validated credentials object.
 * @throws Will throw an error if the service account key is not found, the credentials are invalid, or the JSON parsing fails.
 */
async function getCredentials(userEmail) {
  const userDomain = userEmail.split('@')[1] // Get the domain of the user

  const serviceAccountCredentialsKey = userDomain + '_SA_credentials' // Create a Redis key for the service account credentials

  let serviceAccountKeyInDB // Variable to store the service account key retrieved from db or redis
  let serviceAccountPrivateKey

  //First try fetching the service account key from redis
  serviceAccountKeyInDB = (await cacheService.getValueFromRedis(serviceAccountCredentialsKey)) || null

  // If the service account key is not found in Redis, fetch it from the database
  if (!serviceAccountKeyInDB || !serviceAccountKeyInDB.privateKeyData) {
    //TODO: combine 3 queries into 1
    const user = (await Users.findOne({ where: { email: userEmail } })).id
    const projectId = (await Projects.findOne({ where: { userId: user } })).projectId
    const serviceAccountEmail = (await ServiceAccounts.findOne({ where: { projectId: projectId } })).serviceAccountEmail

    if (!serviceAccountEmail) {
      throw new Error(`Service account not found for ${userDomain}`)
    }

    serviceAccountKeyInDB = await ServiceAccountKeys.findOne({
      where: { serviceAccountEmail: serviceAccountEmail },
    })

    // If the service account key is still not found, throw an error
    if (!serviceAccountKeyInDB) {
      throw new Error(`Service account key not found for ${serviceAccountEmail}`)
    }

    // Store the service account key in Redis
    await cacheService.storeDataInRedis(serviceAccountCredentialsKey, {
      serviceAccountEmail: serviceAccountKeyInDB.serviceAccountEmail,
      privateKeyData: serviceAccountKeyInDB.privateKeyData,
    })
  }

  // Update the serviceAccountPrivateKey with the fetched service account key
  serviceAccountPrivateKey = serviceAccountKeyInDB.privateKeyData

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
 * Impersonates a user to access Google Drive, Google Admin Reports, or Google Admin Directory resources on their behalf.
 *
 * This function sets up the Google Auth client to impersonate a specified user, allowing access to the user's resources.
 *
 * @param {string} impersonatedUser - The email address of the user to impersonate.
 * @param {Object} auth - The initialized GoogleAuth client.
 * @param {string} typeOfInstance - The type of Google API client instance to create.
 *                                  Possible values are 'drive', 'reports', or 'directory'.
 * @returns {Promise<Object>} - A promise that resolves to the Google API client instance configured for the impersonated user.
 */
async function impersonateClient(impersonatedUser, auth, typeOfInstance) {
  let service

  // Retrieve the client from the auth instance.
  const authClient = await auth.getClient()
  // Set the subject (user to impersonate) for the auth client.
  authClient.subject = impersonatedUser // Impersonate the specified user

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

/**
 * Retrieves a Google API client instance impersonating a specified user.
 *
 * This function fetches the service account credentials, initializes the Google Auth client,
 * and then impersonates the specified user to access their Google Drive resources.
 *
 * @param {string} impersonatedUser - The email address of the user to impersonate.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} typeOfInstance - The type of Google API client instance to create.
 *                                  Possible values are 'drive', 'reports', or 'directory'.
 * @returns {Promise<Object>} - A promise that resolves to the Google API client instance
 *                              configured for the impersonated user.
 */
async function getImpersonatedClientInstance(impersonatedUser, typeOfInstance) {
  let service
  // Create a unique key for the instance store based on the impersonated user and type of instance
  const instanceStoreKey = `${impersonatedUser}-${typeOfInstance}-impersonatedClient`

  // Check if the instance already exists in the store
  service = instanceStore.get(instanceStoreKey)

  // If the instance already exists in the store, return it
  if (service) return service

  // If the instance doesn't exist in the store, create it
  // Get the service account credentials
  const credentials = await getCredentials(impersonatedUser)

  // Initialize the Google Auth client
  const jwtClient = await initializeGoogleAuth(credentials)

  // Impersonate the specified user
  service = await impersonateClient(impersonatedUser, jwtClient, typeOfInstance)

  // Store the instance in the store
  instanceStore.set(instanceStoreKey, service)

  // Return the impersonated client
  return service
}

module.exports = {
  getCredentials,
  initializeGoogleAuth,
  impersonateClient,
  getImpersonatedClientInstance,
}
