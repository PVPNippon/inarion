const { google } = require('googleapis')
const redisCacheService = require('../services/redisCacheService')
const ServiceAccountKeys = require('../models/ServiceAccountKeys')
const Users = require('../models/User')
const Projects = require('../models/Project')
const ServiceAccounts = require('../models/ServiceAccount')
const instanceStore = require('..').instanceStore
const logger = require('../logger/logger')(__filename, 'AuthModule')
const instanceArray = ['drive', 'reports', 'directory', 'groups'] // Needs to be updated every time a new instance type is added to the getInstance function

/**
 * Retrieves the service account credentials for a given user email.
 *
 * This function attempts to fetch the service account credentials from Redis cache first.
 * If not found, it queries the database for the user's associated project and service account email.
 * It handles various errors related to invalid user email and missing credentials, logs the events,
 * and throws appropriate error messages. The credentials are decoded and parsed to ensure they
 * contain the required fields before being returned.
 *
 * @param {string} userEmail - The email address of the user(SuperAdmin) whose service account credentials are being retrieved.
 * @returns {Promise<Object>} - A promise that resolves to the decoded and validated credentials object.
 * @throws Will throw an error if there are issues with the user email, domain retrieval,
 * service account email retrieval, decoding, or parsing of credentials.
 */
async function getCredentials(userEmail) {
  // Error handling of userEmail
  if (!userEmail) {
    logger.error(`Unable to retrieve Service account credentials because NO user email provided.`)
    throw new Error('Unable to retrieve Service account credentials because NO user email provided.') //Throw error to stop the function execution because without a valid userEmail, no service account credentials can be retrieved
    // Logger if userEmail contains 0 or 2 or more @
  } else if (userEmail.match(/@/g) === null || userEmail.match(/@/g).length >= 2) {
    logger.error(`Unable to retrieve Service account credentials because INVALID user email provided.`)
    throw new Error('Unable to retrieve Service account credentials because INVALID user email provided.')
    // Logger if a service account email address is passed instead of a userEmail
  } else if (userEmail.match(/^[a-zA-Z0-9._%+-]+@(.*\.)?gserviceaccount\.com$/) !== null) {
    logger.error(
      `Unable to retrieve Service account credentials because service account email is passed instead of user email`
    )
    throw new Error(
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
    throw new Error('Unable to retrieve domain from user email.') //Throw error to stop the function execution because without a valid userDomain, no service account credentials can be retrieved
  }

  const serviceAccountCredentialsKey = userDomain + '_SA_credentials' // Create a Redis key for the service account credentials
  // Error handling of serviceAccountCredentialsKey
  if (serviceAccountCredentialsKey) {
    logger.debug(`Service Account Credentials Key for Redis created successfully: ${serviceAccountCredentialsKey}`)
  } else if (!serviceAccountCredentialsKey) {
    logger.error(`Unable to retrieve Service Account Credentials Key from user domain.`)
    throw new Error('Unable to retrieve Service Account Credentials Key from user domain.') //Throw error to stop the function execution because without a valid serviceAccountCredentialsKey, no service account credentials can be retrieved
  }

  let serviceAccountKeyInDB // Variable to store the service account key retrieved from db or redis
  let serviceAccountPrivateKey // Variable to store the service account private key

  //First try fetching the service account key from redis
  serviceAccountKeyInDB = (await redisCacheService.getJsonFromRedis(serviceAccountCredentialsKey)) || null
  if (serviceAccountKeyInDB) {
    logger.debug(`Service Account Credentials retrieved from Redis successfully: ${serviceAccountCredentialsKey}`)
  }

  // If the service account key is not found in Redis, fetch it from the database
  if (!serviceAccountKeyInDB || !serviceAccountKeyInDB.privateKeyData) {
    logger.debug(`Service Account Credentials Key is not found in Redis.`)

    //TODO: combine 3 queries into 1(postponed till when DB schema is updated to support associations)
    //I'm not adding detailed logs for queries since there will be detailed logging on the database side
    logger.debug(`Trying to fetch Service Account Email from DB`)
    const user = (await Users.findOne({ where: { email: userEmail } })).id
    const projectId = (await Projects.findOne({ where: { userId: user } })).projectId
    const serviceAccountEmail = (await ServiceAccounts.findOne({ where: { projectId: projectId } })).serviceAccountEmail

    // If the service account email is not found, throw an error
    if (!serviceAccountEmail) {
      logger.error(`Service account Email for ${userDomain} was not found.`)
      throw new Error(`Service account Email not found for ${userDomain}`) //Throw error to stop the function execution because without a valid service account email, no service account credentials can be retrieved
    }

    // Fetch the service account key from the database
    serviceAccountKeyInDB = await ServiceAccountKeys.findOne({
      where: { serviceAccountEmail: serviceAccountEmail },
    })

    // If the service account key is still not found, throw an error
    if (!serviceAccountKeyInDB) {
      logger.error(`Service account key for ${serviceAccountEmail} was not found.`)
      throw new Error(`Service account key not found for ${serviceAccountEmail}`)
    }

    logger.debug(
      `Service account credentials Key fetched from DB successfully.\nID: ${JSON.stringify(
        serviceAccountKeyInDB.id,
        null,
        2
      )}\nPrivate key ID: ${JSON.stringify(
        serviceAccountKeyInDB.privateKeyId,
        null,
        2
      )}\nService account email: ${JSON.stringify(serviceAccountKeyInDB.serviceAccountEmail, null, 2)}`
    )

    try {
      // Store the service account email and key in Redis
      redisCacheService.setJsonInRedis(serviceAccountCredentialsKey, {
        serviceAccountEmail: serviceAccountKeyInDB.serviceAccountEmail,
        privateKeyData: serviceAccountKeyInDB.privateKeyData,
      })
    } catch (error) {
      logger.error(error)
    }
  }

  try {
    // Update the serviceAccountPrivateKey with the fetched service account key
    //this try and catch block is for cases when there is a service account key record in DB, but the privateKeyData is null for some reason
    serviceAccountPrivateKey = serviceAccountKeyInDB.privateKeyData
    logger.debug(`Service Account Private Key updated successfully.`)
  } catch (error) {
    logger.error(error)
    throw new Error('Unable to update Service Account Private Key')
  }

  //Decode the base64-encoded privateKeyData to get the actual JSON credentials.
  let decodedCredentials
  try {
    decodedCredentials = Buffer.from(serviceAccountPrivateKey, 'base64').toString('utf8')
    logger.debug(`Private key data decoded successfully.`)
  } catch (error) {
    logger.error(error)
    throw new Error('Unable to decode private key data')
  }

  let credentials
  try {
    // Parse the decoded JSON string to extract the credentials.
    credentials = JSON.parse(decodedCredentials)
    logger.debug(`Credentials JSON parsed successfully.`)
  } catch (error) {
    // If there is an error in parsing, log the error and throw a new error indicating invalid credentials format.
    logger.error(error)
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
 * This function sets up the Google Auth client using the provided service accountcredentials and configures it with the necessary scopes for accessing Google APIs.
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
    logger.error(error)
    throw new Error('Error initializing the GoogleAuth clients')
  }

  // Return the initialized auth client.
  return auth
}

/**
 * Configures and returns a Google API client instance, configured for the specified type of instance.
 *
 * This function creates a Google API client instance for the specified type of instance.
 * It requires a JWT client, which is a JWT client configured for the impersonated user.
 *
 * @param {Object} jwtClient - The JWT client configured for the impersonated user.
 * @param {string} typeOfInstance - The type of Google API client instance to create (e.g., 'drive', 'reports').
 * @returns {Promise<Object>} - A promise that resolves to the Google API client instance.
 * @throws {Error} - Throws an error if the JWT client or type of instance is invalid.
 */
function getInstance(jwtClient, typeOfInstance) {
  //Throw error if jwtClient is not provided
  if (!jwtClient) {
    logger.error('Unale to create Google API client instance because JWT is not provided.')
    throw new Error('Unale to create Google API client instance because JWT is not provided.')
  }

  //Throw error if typeOfInstance is not provided
  if (!typeOfInstance) {
    logger.error('Unable to create Google API client instance because type of instance is not provided.')
    throw new Error('Unable to create Google API client instance because type of instance is not provided.')
  }

  //Throw error if an invalid typeOfInstance has been provided by the caller function
  if (!instanceArray.includes(typeOfInstance)) {
    logger.error(`Unexpected type of instance: ${typeOfInstance}.`)
    throw new Error(`Unexpected type of instance.`)
  }

  let service
  //Return the auth client instance configured with the impersonated user
  //I have removed the default case because it will make troubleshooting more difficult if an unsupported typeOfInstance is passed
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
  }
  return service
}

/**
 * Creates a key for the instance store based on the impersonated user and type of instance.
 *
 * @param {string} impersonatedUser - The email address of the user to impersonate.
 * @param {string} typeOfInstance - The type of Google API client instance to create.
 * @returns {string} - The key for the instance store.
 */
function createInstanceStoreKey(impersonatedUser, typeOfInstance) {
  return `${impersonatedUser}-${typeOfInstance}-impersonatedClient`
}

/**
 * Impersonates a user to access Google Workspace resources on their behalf.
 *
 * This function takes the email address of the user to impersonate, an initialized GoogleAuth client, and the type of instance to create as parameters.
 * It returns a promise that resolves to the impersonated client, which is a JWT client configured for the impersonated user.
 *
 * @param {string} impersonatedUser - The email address of the user to impersonate.
 * @param {Object} auth - The initialized GoogleAuth client.
 * @param {string} typeOfInstance - The type of Google API client instance to create.
 * @returns {Promise<Object>} - A promise that resolves to the impersonated client.
 */
async function impersonateClient(impersonatedUser, auth, typeOfInstance) {
  // Create a unique key for the instance store based on the impersonated user and type of instance
  const instanceStoreKey = createInstanceStoreKey(impersonatedUser, typeOfInstance)

  let jwtClient
  let service

  try {
    // Retrieve the client from the auth instance.
    //the variable is named jwtClient is because actually Google returns a JWT client in our case
    jwtClient = await auth.getClient()
    logger.debug(
      `JWT client retrieved successfully.\nProject ID: ${JSON.stringify(
        jwtClient.projectId,
        null,
        2
      )}\nEmail: ${JSON.stringify(jwtClient.email, null, 2)}\nKey ID: ${JSON.stringify(
        jwtClient.keyId,
        null,
        2
      )}\nScopes: ${JSON.stringify(jwtClient.scopes, null, 2)}`
    )

    // Set the subject (user to impersonate) for the auth client.
    jwtClient.subject = impersonatedUser
    logger.debug(
      `Impersonated user set as Subject successfully.\nUser Email: ${JSON.stringify(jwtClient.subject, null, 2)}`
    )

    service = await getInstance(jwtClient, typeOfInstance) //get the auth client instance configured with the impersonated user
    logger.debug(
      `Impersonated user client retrieved successfully.\nService Account Email: ${JSON.stringify(
        service.context._options.auth.email,
        null,
        2
      )}`
    ) // Log only service account email since the auth instance is huge

    //Retrieve the expiry date using the 'on' method(AI says it's a listener)
    //https://github.com/googleapis/google-auth-library-nodejs?tab=readme-ov-file#handling-token-events
    //I'm storing the client and expiry date in in-memory store inside this function because everywhere else the expiry date was either undefinded or
    //it returned the whole jwtClient instead of the expiry date
    await jwtClient.on('tokens', async function storeClientExpiryDate(tokens) {
      if (tokens.access_token) {
        //if the access token is present, retrieve its expiry date and store it together with the impersonated client in in-memory store
        //FYI the expiry period is 1 hour
        //FYI2 the "on" method does not return a refresh_token in our case, so we don't store it and don't refresh the access_token
        //Instead we retrieve the expiry date and store it together with the impersonated client. If expiry period is over or nearing, a whole new client will be obtained
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
    logger.error(error)
    throw new Error(`Error retrieving an impersonated client: ${error.message} ${error.stack}`)
  }

  return service
}

/**
 * Retrieves or creates an impersonated Google API client instance for a given user(currently logged-in SuperAdmin) and instance type.
 *
 * This function checks if an impersonated client instance for a given user and instance type
 * already exists in the in-memory store. If so, it returns the existing instance if its expiration
 * is more than 5 minutes away. Otherwise, it fetches the credentials, initializes the Google Auth client,
 * and impersonates the specified user to create a new instance.
 *
 * @param {string} impersonatedUser - The email address of the user to impersonate.
 * @param {string} typeOfInstance - The type of Google API client instance to create (e.g., 'drive', 'reports').
 * @returns {Promise<Object>} - A promise that resolves to the impersonated client instance.
 * @throws {Error} - Throws an error if the impersonated user or type of instance is invalid.
 */
async function getImpersonatedClientInstanceForAdmin(impersonatedUser, typeOfInstance) {
  // Error handling of impersonatedUser
  if (!impersonatedUser) {
    logger.error(`Impersonated user has not been provided.`)
    throw new Error(`Impersonated user has not been provided.`)
  }

  // Error handling of typeOfInstance
  // Throw error if typeOfInstance has not been provided by the caller function
  if (!typeOfInstance) {
    logger.error(`Type of instance has not been provided.`)
    throw new Error(`Type of instance has not been provided.`)
  }

  // Throw error if an invalid typeOfInstance has been provided by the caller function
  if (!instanceArray.includes(typeOfInstance)) {
    logger.error(`Unexpected type of instance:${typeOfInstance}.`)
    throw new Error(`Unexpected type of instance.`)
  }

  // Create a unique key for the instance store based on the impersonated user and type of instance
  const instanceStoreKey = createInstanceStoreKey(impersonatedUser, typeOfInstance)
  logger.debug(`Instance store key created successfully: ${instanceStoreKey}`)

  let service
  // Check if the instance already exists in the store
  service = await instanceStore.get(instanceStoreKey)

  if (!service) {
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

    // Get the current time
    const timeNow = new Date().getTime()
    logger.debug(`Current time retrieved successfully: ${timeNow}`)

    // If the instance already exists in the in-memory store and expiration time is more than 5 minutes, return it
    if (service && service.expiryDate - timeNow > 300000) {
      logger.debug(
        `Reusing the instance from in-memory store. The client will expire in about ${Math.floor(
          (service.expiryDate - timeNow) / 60000
        )} minutes.`
      )
      return service.service
    } else {
      logger.debug(`Instance is going to expire soon. Creating a new instance.`)
    }
  }

  // If the instance doesn't exist in the store or the expiry time is less than 5 minutes, create the new instance
  // Get the service account credentials
  const credentials = await getCredentials(impersonatedUser)
  logger.debug(
    `Credentials retrieved successfully.\nProject ID: ${JSON.stringify(
      credentials.project_id,
      null,
      2
    )}\nPrivate key ID: ${JSON.stringify(credentials.private_key_id, null, 2)}\nClient ID: ${JSON.stringify(
      credentials.client_id,
      null,
      2
    )}`
  )

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
  service = await impersonateClient(impersonatedUser, authClient, typeOfInstance)

  // Error handling for impersonated instance
  if (!service) {
    logger.error(`Failed to obtain the impersonated ${typeOfInstance} instance for ${impersonatedUser}`)
    throw new Error(`Failed to obtain the impersonated ${typeOfInstance} instance for ${impersonatedUser}`)
  }

  logger.debug(
    `User impersonated successfully.\nProject ID: ${JSON.stringify(
      service.context?._options.auth.projectId,
      null,
      2
    )}\nService Account Email: ${JSON.stringify(
      service.context?._options.auth.email,
      null,
      2
    )}\nUser Email: ${JSON.stringify(service.context?._options.auth.subject, null, 2)}`
  )
  return service
}

/**
 * Retrieves or creates an impersonated Google API client instance for a given user and instance type.
 * This function is meant for cases when authentication user(currently logged-in SuperAdmin) and user to impersotate are different.
 * This function takes impersonatedUser, typeOfInstance, auth client(optional) and adminEmail(optional) as parameters.
 * It returns a promise that resolves to the Google API client instance configured for the impersonated user.
 * The type of instance can be 'drive', 'reports', 'groups' or 'directory', and it determines which Google API client instance is created.
 * If the auth is provided, it will be used to impersonate the user.
 * If the adminEmail is provided, it will be used to get the credentials and then impersonate the user.
 *
 * @param {string} impersonatedUser - The email address of the user to impersonate.
 * @param {string} typeOfInstance - The type of Google API client instance to create.
 * @param {Object} auth - The initialized GoogleAuth client.
 * @param {string} adminEmail - The email address of the currently logged-in SuperAdmin which is used to obtain the credentials for the service account(the only valid option as of now, but we definitely need something more stable in the future).
 * @returns {Promise<Object>} - A promise that resolves to the Google API client instance configured for the impersonated user.
 */
async function getImpersonatedClientInstanceForUser({ impersonatedUser, typeOfInstance, auth, adminEmail }) {
  //impersonatedUser and typeOfInstance are required to be provided by the caller function

  // Error handling of impersonatedUser
  if (!impersonatedUser) {
    logger.error(`Impersonated user has not been provided.`)
    throw new Error(`Impersonated user has not been provided.`)
  }

  // Error handling of typeOfInstance
  // Throw error if typeOfInstance has not been provided by the caller function
  if (!typeOfInstance) {
    logger.error(`Type of instance has not been provided.`)
    throw new Error(`Type of instance has not been provided.`)
  }

  // Throw error if an invalid typeOfInstance has been provided by the caller function
  if (!instanceArray.includes(typeOfInstance)) {
    logger.error(`Unexpected type of instance:${typeOfInstance}.`)
    throw new Error(`Unexpected type of instance.`)
  }

  // Create a unique key for the instance store based on the impersonated user and type of instance
  const instanceStoreKey = createInstanceStoreKey(impersonatedUser, typeOfInstance)
  logger.debug(`Instance store key created successfully: ${instanceStoreKey}`)

  let service

  // Check if the instance already exists in the store
  service = await instanceStore.get(instanceStoreKey)

  if (!service) {
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

    // Get the current time
    const timeNow = new Date().getTime()
    logger.debug(`Current time retrieved successfully: ${timeNow}`)

    // If the instance already exists in the in-memory store and expiration time is more than 5 minutes, return it
    if (service && service.expiryDate - timeNow > 300000) {
      logger.debug(
        `Reusing the instance from in-memory store. The client will expire in about ${Math.floor(
          (service.expiryDate - timeNow) / 60000
        )} minutes.`
      )
      return service.service
    } else {
      logger.debug(`Instance is going to expire soon. Creating a new instance.`)
    }
  }

  // If the instance doesn't exist in the store or the expiry time is less than 5 minutes, check if auth is provided.
  // By "auth" I mean the auth instance returned by the initializeGoogleAuth function.
  // You may have obtained the auth somewhere earlier in your logic, so you can provide it to skip getCredentials and initializeGoogleAuth steps.
  if (auth) {
    service = await impersonateClient(impersonatedUser, auth, typeOfInstance)
    if (!service) {
      logger.error(`Unable to create an impersonated instance.`)
      //not throwing an error here because if admin email is provided, we can get the credentials and then impersonate the user.
    } else {
      logger.debug(
        `Instance retrieved from auth successfully.\nProject ID: ${JSON.stringify(
          service.context?._options.auth.projectId,
          null,
          2
        )}\nService Account Email: ${JSON.stringify(
          service.context?._options.auth.email,
          null,
          2
        )}\nUser Email: ${JSON.stringify(service.context?._options.auth.subject, null, 2)}`
      )
    }
    return service
  }

  //Check if adminEmail is provided.
  //If you have not provided auth, you can provide adminEmail instead to get the impersonated instance.
  //The reason we need adminEmail is to get the credentials for the service account(the only valid option as of now, but we definitely need something more stable in the future).
  if (adminEmail) {
    // Get the service account credentials
    const credentials = await getCredentials(adminEmail)
    // Initialize the Google Auth client
    const authClient = await initializeGoogleAuth(credentials)
    // Impersonate the specified user
    service = await impersonateClient(impersonatedUser, authClient, typeOfInstance)

    if (!service) {
      logger.error(`Unable to retrieve ${typeOfInstance} instance for ${impersonatedUser}.`)
      throw new Error(`Unable to retrieve ${typeOfInstance} instance for ${impersonatedUser}.`)
    } else {
      logger.debug(
        `Instance retrieved successfully.\nProject ID: ${JSON.stringify(
          service.context?._options.auth.projectId,
          null,
          2
        )}\nService Account Email: ${JSON.stringify(
          service.context?._options.auth.email,
          null,
          2
        )}\nUser Email: ${JSON.stringify(service.context?._options.auth.subject, null, 2)}`
      )
      return service
    }
  } else {
    logger.error(
      `Unable to retrieve ${typeOfInstance} instance for ${impersonatedUser} because neither auth nor admin email have been provided.`
    )
    throw new Error(
      `Unable to retrieve ${typeOfInstance} instance for ${impersonatedUser} because neither auth nor admin email have been provided.`
    )
  }
}

module.exports = {
  getCredentials,
  initializeGoogleAuth,
  impersonateClient,
  getImpersonatedClientInstanceForAdmin,
  getImpersonatedClientInstanceForUser,
}
