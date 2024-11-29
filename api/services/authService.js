const { google } = require('googleapis')
const cacheService = require('../controllers/cacheController')
const ServiceAccountKeys = require('../models/ServiceAccountKeys')
const Users = require('../models/User')
const Projects = require('../models/Project')
const ServiceAccounts = require('../models/ServiceAccount')
const instanceStore = require('..').instanceStore
const logger = require('../logger')(__filename, 'AuthModule')

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
  // Error handling of userEmail
  if (!userEmail) {
    logger.error(`Unable to retrieve Service account credentials because NO user email provided.`)
    // Logger if userEmail contains 0 or 2 or more @
  } else if (userEmail.match(/@/g) === null || userEmail.match(/@/g).length >= 2) {
    logger.error(`Unable to retrieve Service account credentials because INVALID user email provided.`)
    // Logger if a service account email address is passed instead of a userEmail
  } else if (userEmail.match(/^[a-zA-Z0-9._%+-]+@(.*\.)?gserviceaccount\.com$/) !== null) {
    logger.error(
      `Unable to retrieve Service account credentials because service account email is passed instead of user email`
    )
  } else {
    logger.debug(`Service account credentials retrieved successfully by valid user email: ${userEmail}`)
  }

  const userDomain = userEmail.split('@')[1] // Get the domain of the user
  // Error handling of userDomain
  if (userDomain) {
    logger.debug(`Domain retrieved successfully: ${userDomain}`)
  } else if (!userDomain) {
    logger.error(`Unable to retrieve domain from user email.`)
  }

  const serviceAccountCredentialsKey = userDomain + '_SA_credentials' // Create a Redis key for the service account credentials
  // Error handling of serviceAccountCredentialsKey
  if (serviceAccountCredentialsKey) {
    logger.debug(`Service Account Credentials Key for Redis created successfully: ${serviceAccountCredentialsKey}`)
  } else if (!serviceAccountCredentialsKey) {
    logger.error(`Unable to retrieve Service Account Credentials Key from user domain.`)
  }

  let serviceAccountKeyInDB // Variable to store the service account key retrieved from db or redis
  let serviceAccountPrivateKey

  //First try fetching the service account key from redis
  serviceAccountKeyInDB = (await cacheService.getValueFromRedis(serviceAccountCredentialsKey)) || null
  if (serviceAccountKeyInDB) {
    logger.debug(`Service Account Credentials retrieved from Redis successfully: ${serviceAccountCredentialsKey}`)
  }

  // If the service account key is not found in Redis, fetch it from the database
  if (!serviceAccountKeyInDB || !serviceAccountKeyInDB.privateKeyData) {
    logger.debug(`Service Account Credentials Key is not found in Redis.`)
    // Q: is better to add try catch after 3 queries is combined ?
    //TODO: combine 3 queries into 1
    const user = (await Users.findOne({ where: { email: userEmail } })).id
    const projectId = (await Projects.findOne({ where: { userId: user } })).projectId
    const serviceAccountEmail = (await ServiceAccounts.findOne({ where: { projectId: projectId } })).serviceAccountEmail
    logger.debug(`Trying to fetch Service Account Email from DB`)

    // If the service account email is not found, throw an error
    if (!serviceAccountEmail) {
      logger.error(`Service account Email for ${userDomain} was not found.`)
    }

    // Fetch the service account key from the database
    serviceAccountKeyInDB = await ServiceAccountKeys.findOne({
      where: { serviceAccountEmail: serviceAccountEmail },
    })
    logger.debug(
      `Service account credentials Key fetched from DB successfully: ${JSON.stringify(serviceAccountKeyInDB, null, 2)}` // need to be checked if this data can be contained in the log
    )

    // If the service account key is still not found, throw an error
    if (!serviceAccountKeyInDB) {
      logger.error(`Service account key for ${serviceAccountEmail} was not found.`)
      throw new Error(`Service account key not found for ${serviceAccountEmail}`)
    }

    try {
      // Store the service account email and key in Redis
      cacheService.storeDataInRedis(serviceAccountCredentialsKey, {
        serviceAccountEmail: serviceAccountKeyInDB.serviceAccountEmail,
        privateKeyData: serviceAccountKeyInDB.privateKeyData,
      })
    } catch (error) {
      logger.error(`Unable to store Service Account Email and Key in Redis: ${error.message} ${error.stack}`)
    }
  }

  try {
    // Update the serviceAccountPrivateKey with the fetched service account key
    serviceAccountPrivateKey = serviceAccountKeyInDB.privateKeyData
    logger.debug(
      `Service Account Private Key updated successfully: ${JSON.stringify(serviceAccountPrivateKey, null, 2)}`
    )
  } catch (error) {
    logger.error(`Unable to update Service Account Private Key: ${error.message} ${error.stack}`)
  }
  //Decode the base64-encoded privateKeyData to get the actual JSON credentials.
  const decodedCredentials = Buffer.from(serviceAccountPrivateKey, 'base64').toString('utf8')
  logger.debug(`Private key data decoded successfully.`)

  let credentials
  try {
    // Parse the decoded JSON string to extract the credentials.
    credentials = JSON.parse(decodedCredentials)
    logger.debug(`Credentials JSON parsed successfully.`)
  } catch (error) {
    // If there is an error in parsing, log the error and throw a new error indicating invalid credentials format.
    logger.error(`Error parsing the credentials JSON: ${error.message} ${error.stack}`)
    throw new Error('Invalid credentials format')
  }

  // Ensure the parsed credentials contain the necessary fields: client_email, private_key, and token_uri.
  if (!credentials.client_email || !credentials.private_key || !credentials.token_uri) {
    logger.error('Parsed credentials do not contain required fields (client_email, private_key, token_uri):', {
      error: err.message,
      stack: err.stack,
    })
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
    logger.debug(`GoogleAuth client initialized successfully.`)
  } catch (error) {
    logger.error(`Error initializing the GoogleAuth client: ${error.message} ${error.stack}`)
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
  // async 消す
  let service
  //Return the auth client instance configured with the impersonated user
  switch (typeOfInstance) {
    case 'drive':
      service = google.drive({ version: 'v3', auth: jwtClient })
      logger.debug(`Drive API client returned.`)
      break
    case 'reports':
      service = google.admin({ version: 'reports_v1', auth: jwtClient })
      logger.debug(`Reports API client returned.`)
      break
    case 'directory':
      service = google.admin({ version: 'directory_v1', auth: jwtClient })
      logger.debug(`Directory API client returned.`)
      break
    case 'groups':
      service = google.groupssettings({ version: 'v1', auth: jwtClient })
      logger.debug(`Group Settings API client returned.`)
      break
    default:
      service = google.admin({ version: 'directory_v1', auth: jwtClient })
      logger.debug(`Directory API client returned as default.`)
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
    logger.debug(`JWT client retrieved successfully: ${JSON.stringify(jwtClient, null, 2)}`)
    // Set the subject (user to impersonate) for the auth client.
    jwtClient.subject = impersonatedUser
    logger.debug(
      `Impersonated user set as Subject successfully.\nUser Email: ${JSON.stringify(jwtClient.subject, null, 2)}`
    )
    service = await getInstance(jwtClient, typeOfInstance) //return the auth client instance configured with the impersonated user
    logger.debug(
      `Impersonated user client retrieved successfully.\nService Account Email: ${JSON.stringify(
        service.context._options.auth.email,
        null,
        2
      )}`
    ) // Log only service account email since the auth instance is huge

    //Retrieve the expiry date using the 'on' method
    //https://github.com/googleapis/google-auth-library-nodejs?tab=readme-ov-file#handling-token-events
    //I'm storing the client and expiry date in in-memory store inside this function because everywhere else the expiry date was either undefinded or
    //it returned the whole jwtClient instead of the expiry date
    await jwtClient.on('tokens', async function storeClientExpiryDate(tokens) {
      if (tokens.access_token) {
        //if the access token is present, retrieve its expiry date and store it together with the impersonated client in in-memory store
        //FYI the expiry period is 1 hour
        instanceStore.set(`${instanceStoreKey}`, {
          expiryDate: tokens.expiry_date,
          service: service,
        })
        logger.debug(
          `Expiry Date of Access Token stored in in-memory store successfully: ${JSON.stringify(
            tokens.expiry_date,
            null,
            2
          )}`
        )
        logger.debug(
          `Impersonated client stored in in-memory store successfully.\nService Account Email: ${JSON.stringify(
            service.context._options.auth.email,
            null,
            2
          )}\nExpires At: ${JSON.stringify(service.context._options.auth.gtoken.expiresAt, null, 2)}`
        ) // Log only "email" and "expiresAt"
      }
    })
  } catch (error) {
    logger.error(`Error retrieving a impersonated client: ${error.message} ${error.stack}`)
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
 *                                  Possible values are 'drive', 'reports', 'directory' or 'groups'.
 * @returns {Promise<Object>} - A promise that resolves to the Google API client instance configured for the impersonated user.
 */
async function getImpersonatedClientInstance(impersonatedUser, typeOfInstance) {
  let service
  const instanceArray = ['drive', 'reports', 'directory', 'groups'] // Need to be updated if the type of Auth client changed
  // Error handling of impersonatedUser
  if (typeof impersonatedUser === 'undefined') {
    logger.error(`Impersonated user is Undefined:`)
    throw new Error(`Impersonated user is Undefined.`)
    // Error handling of typeOfInstance
  } else if (!instanceArray.includes(typeOfInstance)) {
    logger.error(`Unexpected type of instance:`)
    throw new Error(`Unexpected type of instance.`)
  } else {
    // Create a unique key for the instance store based on the impersonated user and type of instance
    // TODO: Prepare another function for instanceStoreKey
    const instanceStoreKey = `${impersonatedUser}-${typeOfInstance}-impersonatedClient`
    logger.debug(`Instance store key created successfully: ${instanceStoreKey}`)
    // Check if the instance already exists in the store
    service = await instanceStore.get(instanceStoreKey)
    if (typeof service === 'undefined') {
      logger.info(`Instance does not exist in store`)
    } else {
      logger.debug(
        `Impersonated client retrieved from in-memory store.\nExpiry Date: ${JSON.stringify(
          service.expiryDate,
          null,
          2
        )}\nProject ID: ${JSON.stringify(
          service.service.context?._options.auth.projectId,
          null,
          2
        )}\nService Account Email: ${JSON.stringify(
          service.service.context?._options.auth.email,
          null,
          2
        )}\nUser Email: ${JSON.stringify(service.service.context?._options.auth.subject, null, 2)}`
      )
    }
    // Get the current time
    const timeNow = new Date().getTime()
    logger.debug(`Current time retrieved successfully: ${timeNow}`)

    // If the instance already exists in the in-memory store and expiration time is more than 5 minutes, return it
    if (service && service.expiryDate - timeNow > 300000) return service.service

    // If the instance doesn't exist in the store or the expiry time is less than 5 minutes, create create the new instance
    // Get the service account credentials
    const credentials = await getCredentials(impersonatedUser)
    logger.debug(`Credentials retrieved successfully: ${JSON.stringify(credentials, null, 2)}`)

    // Initialize the Google Auth client
    const authClient = await initializeGoogleAuth(credentials)
    logger.debug(
      `Auth client retrieved successfully.\nService Account Email: ${JSON.stringify(
        authClient.jsonContent.client_email,
        null,
        2
      )}`
    )

    // Impersonate the specified user
    service = await impersonateClient(impersonatedUser, authClient, typeOfInstance, instanceStoreKey)
    // Error handling for impersonated instance
    if (typeof service === 'undefined') {
      logger.error(`Instance does not exist in store`)
    } else {
      // logger.debug(`SERVICE INSTANCE HERE: ${JSON.stringify(service, null, 2)}`)
      logger.debug(
        `User impersonated successfully.\nProject ID: ${JSON.stringify(
          service.context._options.auth.projectId,
          null,
          2
        )}\nService Account Email: ${JSON.stringify(
          service.context._options.auth.email,
          null,
          2
        )}\nUser Email: ${JSON.stringify(service.context._options.auth.subject, null, 2)}`
      )
    }
  }

  return service
}

module.exports = {
  getCredentials,
  initializeGoogleAuth,
  impersonateClient,
  getImpersonatedClientInstance,
}
