const { google } = require('googleapis')
const cacheService = require('../controllers/cacheController')
const ServiceAccountKeys = require('../models/ServiceAccountKeys')
const Users = require('../models/User')
const Projects = require('../models/Project')
const ServiceAccounts = require('../models/ServiceAccount')
const instanceStore = require('..').instanceStore

/**
 * Retrieves and decodes service account credentials from the database.
 *
 * This function fetches the service account credentials using the provided email, decodes the base64-encoded privateKeyData,
 * and parses it to extract the credentials in JSON format.
 *
 * @param {string} userEmail - The email address associated with the service account.
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

    // If the service account email is not found, throw an error
    if (!serviceAccountEmail) {
      throw new Error(`Service account not found for ${userDomain}`)
    }

    // Fetch the service account key from the database
    serviceAccountKeyInDB = await ServiceAccountKeys.findOne({
      where: { serviceAccountEmail: serviceAccountEmail },
    })

    // If the service account key is still not found, throw an error
    if (!serviceAccountKeyInDB) {
      throw new Error(`Service account key not found for ${serviceAccountEmail}`)
    }

    // Store the service account email and key in Redis
    cacheService.storeDataInRedis(serviceAccountCredentialsKey, {
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
  let auth
  try {
    // Initialize the GoogleAuth client using the provided credentials
    auth = new google.auth.GoogleAuth({
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
  } catch (error) {
    console.error('Error initializing the GoogleAuth client:', error)
    throw new Error('Error initializing the GoogleAuth clients')
  }

  // Return the initialized auth client.
  return auth
}

/**
 * Retrieves a Google API client instance based on the type of instance specified.
 *
 * This function takes a JWT client instance and a type of instance as parameters.
 * It returns a promise that resolves to the Google API client instance configured for the impersonated user.
 * The type of instance can be 'drive', 'reports', or 'directory', and it determines which Google API client instance is created.
 *
 * @param {Object} jwtClient - The JWT client instance to use for authentication.
 * @param {string} typeOfInstance - The type of Google API client instance to create.
 * @returns {Promise<Object>} - A promise that resolves to the Google API client instance configured for the impersonated user.
 */
async function getInstance(jwtClient, typeOfInstance) {
  let service
  //Return the auth client instance configured with the impersonated user
  switch (typeOfInstance) {
    case 'drive':
      service = google.drive({ version: 'v3', auth: jwtClient })
      break
    case 'reports':
      service = google.admin({ version: 'reports_v1', auth: jwtClient })
      break
    case 'directory':
      service = google.admin({ version: 'directory_v1', auth: jwtClient })
      break
    case 'groups':
      service = google.groupssettings({ version: 'v1', auth: jwtClient })
      break
    default:
      service = google.admin({ version: 'directory_v1', auth: jwtClient })
  }
  return service
}

/**
 * Impersonates a user to access Google Workspace resources on their behalf.
 *
 * This function configures the Google Auth client to impersonate a specified user, allowing access to the user's resources.
 *
 * @param {string} impersonatedUser - The email address of the user to impersonate.
 * @param {Object} auth - The initialized GoogleAuth client.
 * @param {string} typeOfInstance - The type of Google API client instance to create.
 *                                  Possible values are 'drive', 'reports', or 'directory'.
 * @param {string} instanceStoreKey - The key used in the in-memory instance store.
 * @returns {Promise<Object>} - A promise that resolves to the Google Drive client instance configured for the impersonated user.
 */
async function impersonateClient(impersonatedUser, auth, typeOfInstance, instanceStoreKey) {
  let jwtClient
  let service

  try {
    // Retrieve the client from the auth instance.
    //the variable is named jwtClient is because actually Google returns a JWT client in our case
    jwtClient = await auth.getClient()

    // Set the subject (user to impersonate) for the auth client.
    jwtClient.subject = impersonatedUser

    service = await getInstance(jwtClient, typeOfInstance) //return the auth client instance configured with the impersonated user

    //Retrieve the expiry date using the 'on' method
    //https://github.com/googleapis/google-auth-library-nodejs?tab=readme-ov-file#handling-token-events
    //I'm storing the client and expiry date in in-memory store inside this function because everywhere else the expiry date was either undefinded or
    //it returned the whole jwtClient instead of the expiry date
    await jwtClient.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        //if the access token is present, retrieve its expiry date and store it together with the impersonated client in in-memory store
        //FYI the expiry period is 1 hour
        instanceStore.set(`${instanceStoreKey}`, {
          expiryDate: tokens.expiry_date,
          service: service,
        })
      }
    })
  } catch (error) {
    console.error('Error retrieving a JWT client:', error)
    throw new Error('Could not obtain a JWT client')
  }

  return service
}

/**
 * Retrieves a Google API client instance impersonating a user from an in-memory store.
 *
 * If the instance already exists in the store and has an expiration time more than 5 minutes in the future,
 * the existing instance is returned. Otherwise, the instance is created by impersonating the user and
 * stored in the in-memory store.
 *
 * @param {string} impersonatedUser - The email address of the user to impersonate.
 * @param {string} typeOfInstance - The type of Google API client instance to create.
 *                                  Possible values are 'drive', 'reports', or 'directory'.
 * @returns {Promise<Object>} - A promise that resolves to the Google API client instance configured for the impersonated user.
 */
async function getImpersonatedClientInstance(impersonatedUser, typeOfInstance) {
  let service
  // Create a unique key for the instance store based on the impersonated user and type of instance
  const instanceStoreKey = `${impersonatedUser}-${typeOfInstance}-impersonatedClient`

  // Check if the instance already exists in the store
  service = await instanceStore.get(instanceStoreKey)
  console.log('SERVICE HERE', service)

  // Get the current time
  const timeNow = new Date().getTime()

  // If the instance already exists in the in-memory store and expiration time is more than 5 minutes, return it
  if (service && service.expiryDate - timeNow > 300000) return service.service

  // If the instance doesn't exist in the store or the expiry time is less than 5 minutes, create create the new instance
  // Get the service account credentials
  const credentials = await getCredentials(impersonatedUser)

  // Initialize the Google Auth client
  const authClient = await initializeGoogleAuth(credentials)

  // Impersonate the specified user
  service = await impersonateClient(impersonatedUser, authClient, typeOfInstance, instanceStoreKey)

  return service
}

module.exports = {
  getCredentials,
  initializeGoogleAuth,
  impersonateClient,
  getImpersonatedClientInstance,
}
