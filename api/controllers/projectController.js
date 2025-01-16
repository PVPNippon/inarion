const googleService = require('../services/googleService') // Import Google service functions
const oauth2Client = require('../models/googleAuth') // Import OAuth2 client for authentication
const Project = require('../models/Project') // Import Project model
const User = require('../models/User') // Import User model
const ServiceAccount = require('../models/ServiceAccount') // Import ServiceAccount model
const ServiceAccountKeys = require('../models/ServiceAccountKeys') // Import ServiceAccountKeys model
const dataController = require('../controllers/dataController')
const logger = require('../logger/logger')(__filename, 'Project Controller')

// Utility function to retry an async function on failure
async function retryAsync(fn, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i < retries - 1) {
        logger.warn(`Retry ${i + 1}/${retries} failed: ${error.message}. Retrying in ${delay / 1000} seconds...`)
        await new Promise((resolve) => setTimeout(resolve, delay)) // Wait before retrying
      } else {
        throw new Error(`Failed after ${retries} retries: ${error.message}`) // Throw error after all retries fail
      }
    }
  }
}

// Find a user by their email address
const findUserByEmail = async (email, projectName) => {
  const user = await User.findOne({ where: { email } })
  if (!user) {
    throw new Error('User not found') // Error if user is not found
  }
  return user
}

// Get the organization ID from Google Cloud
const getOrganizationId = async () => {
  const organizations = await googleService.listOrganizations(oauth2Client)
  if (!organizations || organizations.length === 0) {
    throw new Error('No organizations found') // Error if no organizations are found
  }
  return organizations[0].name.split('/')[1] // Return the organization ID
}

// Get or create a project in Google Cloud
const getOrCreateProject = async (projectName, organizationId, userId) => {
  const projects = await googleService.listProjects(oauth2Client, organizationId)
  logger.debug('Trying to find if user and projects exists in the db')
  const existingProject = projects.find((project) => project.displayName.trim() === projectName.trim())
  let projectId, project

  if (existingProject) {
    projectId = existingProject.projectId
    project = await Project.findOrCreate({
      where: { projectName, userId },
      defaults: { projectId, organizationId },
    })
  } else {
    projectId = `project-${Date.now()}` // Generate a unique project ID
    const createdProject = await googleService.createProject(oauth2Client, projectId, projectName, organizationId)
    project = await Project.create({
      projectName,
      userId,
      projectId,
      organizationId,
    })
  }

  return { project, projectId } // Return the project and its ID
}

// Route to create a new project
// exports.createProject = async (req, res) => {
//   logger.debug('Entered the create project route')
//   const { tokens, email, projectName } = req.session

//   // Logging the tokens and other parameters for debugging
//   logger.debug(`Tokens used to create project:${JSON.stringify(tokens, null, 2)}`, {})
//   logger.debug(`Email:${email}`)
//   logger.debug(`Project Name:${projectName}`)
//   try {
//     // Set OAuth2 credentials for the Google service
//     googleService.setOauth2Credentials(tokens)

//     // Find the user by email
//     const user = await findUserByEmail(email)
//     const userId = user.id
//     logger.debug(`userId: ${userId}`)

//     // Get the organization ID
//     const organizationId = await getOrganizationId()

//     // Get or create the project
//     const { project, projectId } = await getOrCreateProject(projectName, organizationId, userId)

//     // Retry enabling APIs for the project
//     await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, 'serviceusage.googleapis.com'))
//     await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, 'admin.googleapis.com'))
//     // Enable the Google Drive API programmatically
//     await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, 'drive.googleapis.com'))
//     await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, 'driveactivity.googleapis.com'))

//     // Check for existing service account in Google Cloud
//     const serviceAccountName = email.replace(/[@.]/g, '-')
//     var serviceAccounts = await googleService.listServiceAccounts(oauth2Client, projectId)
//     if (serviceAccounts === undefined) serviceAccounts = []
//     logger.debug(`List of Service accounts: ${JSON.stringify(serviceAccounts, null, 2)}`)

//     // Checking if service account exists in customer's project
//     let serviceAccount = serviceAccounts.find((account) => account.displayName === `${email}'s Service Account`)

//     // Check if the service account already exists in the database
//     let existingServiceAccountInDB = await ServiceAccount.findOne({ where: { projectId: projectId } })

//     if (!existingServiceAccountInDB && !serviceAccount) {
//       logger.debug('Creating service account in Google Cloud and storing it in the database...')
//       serviceAccount = await googleService.createServiceAccount(
//         oauth2Client,
//         projectId,
//         serviceAccountName,
//         `${email}'s Service Account`
//       )
//       await ServiceAccount.create({
//         projectId,
//         serviceAccountEmail: serviceAccount.email,
//       })
//     } else if (serviceAccount && !existingServiceAccountInDB) {
//       logger.debug('Service account exists in Google Cloud but not in the database, storing it...')
//       await ServiceAccount.create({
//         projectId,
//         serviceAccountEmail: serviceAccount.email,
//       })
//     } else if (!serviceAccount && existingServiceAccountInDB) {
//       logger.debug('Service account exists in the database but not in Google Cloud, creating it...')
//       serviceAccount = await googleService.createServiceAccount(
//         oauth2Client,
//         projectId,
//         serviceAccountName,
//         `${email}'s Service Account`
//       )
//       await ServiceAccount.create({
//         projectId,
//         serviceAccountEmail: serviceAccount.email,
//       })
//     }

//     // Check if service account keys already exist in the database
//     let serviceAccountKeyInDB = await ServiceAccountKeys.findOne({
//       where: { serviceAccountEmail: serviceAccount.email },
//     })
//     let serviceAccountKey

//     if (!serviceAccountKeyInDB) {
//       logger.debug('Creating service account key in Google Cloud and storing it in the database...')
//       serviceAccountKey = await googleService.createServiceAccountKey(oauth2Client, projectId, serviceAccount.email)
//       logger.debug(`Created key in GCloud: ${serviceAccountKey} `)
//       const privateKeyId = serviceAccountKey.name.split('/').pop() // Extract the private key ID
//       logger.debug(`privateKeyId ${privateKeyId}`)
//       serviceAccountKeyInDB = await ServiceAccountKeys.create({
//         serviceAccountEmail: serviceAccount.email,
//         privateKeyId: privateKeyId,
//         privateKeyData: serviceAccountKey.privateKeyData,
//         validAfterTime: new Date(serviceAccountKey.validAfterTime),
//         validBeforeTime: new Date(serviceAccountKey.validBeforeTime),
//       })

//       logger.debug(`Created key in DB ${serviceAccountKeyInDB}`)
//     }

//     logger.debug(`existing service account ${serviceAccountKeyInDB}`)

//     // Fetch service account details
//     const serviceAccountEmail = serviceAccount.email
//     const serviceAccountDetails = await googleService.getServiceAccount(oauth2Client, projectId, serviceAccountEmail)
//     const clientId = serviceAccountDetails.oauth2ClientId

//     // Prepare full project data
//     const fullCreateProjectData = {
//       projectId,
//       serviceAccountEmail,
//       serviceAccountKey,
//       clientId,
//       oauth2Client,
//     }

//     req.session.projectData = fullCreateProjectData // Store project data in session

//     const fetch = await import('node-fetch').then((mod) => mod.default) // Dynamic import of node-fetch

//     return res.render('continue', {
//       appUrl: 'http://localhost:3000/home-page', // Pass the app URL to EJS
//     })
//   } catch (err) {
//     // Handle errors
//     res.status(500).send(`Error creating project: ${err.message}`)
//   }
// }

/**
 * Enables the required Google Cloud APIs for the given project ID.
 *
 * This function enables the following APIs:
 * - serviceusage.googleapis.com
 * - admin.googleapis.com
 * - drive.googleapis.com
 * - driveactivity.googleapis.com
 *
 * @param {string} projectId - The ID of the Google Cloud project to enable the APIs for.
 * @throws {Error} - Throws an error if enabling the APIs fails.
 */
const enableRequiredAPIs = async (projectId) => {
  console.log('Enabling required APIs...')
  const apis = [
    'serviceusage.googleapis.com',
    'admin.googleapis.com',
    'drive.googleapis.com',
    'driveactivity.googleapis.com',
  ]
  try {
    await Promise.all(apis.map((api) => retryAsync(() => googleService.enableAPI(oauth2Client, projectId, api))))
    logger.debug('Required APIs enabled successfully.')
  } catch (error) {
    logger.error('Error enabling required APIs:', error.message)
    throw error
  }
}

/**
 * Ensures that a service account with the given email exists in the given Google Cloud project.
 *
 * If the service account does not exist, it creates one with the given email and a display name
 * derived from the email. If the service account already exists, the existing service account is
 * returned. The service account is also stored in the database.
 *
 * @param {string} projectId - The ID of the Google Cloud project to ensure the service account in.
 * @param {string} email - The email address of the service account to ensure.
 * @returns {Promise<Object>} - A promise that resolves to the service account's metadata.
 * @throws {Error} - Throws an error if the API request to list service accounts fails.
 */
const ensureServiceAccount = async (projectId, email) => {
  const serviceAccountName = email.replace(/[@.]/g, '-')
  const displayName = `${email}'s Service Account`

  try {
    const serviceAccounts = (await googleService.listServiceAccounts(oauth2Client, projectId)) || []
    let serviceAccount = serviceAccounts.find((account) => account.displayName === displayName)

    if (!serviceAccount) {
      logger.debug('Creating service account in Google Cloud...')
      serviceAccount = await googleService.createServiceAccount(
        oauth2Client,
        projectId,
        serviceAccountName,
        displayName
      )
    }

    await upsertServiceAccountInDB(projectId, serviceAccount.email)
    return serviceAccount
  } catch (error) {
    logger.error('Error ensuring service account:', error.message)
    throw error
  }
}

/**
 * Ensures that a service account key exists for the specified service account email in the given Google Cloud project.
 *
 * If the key does not exist in the database, this function creates a new service account key
 * using the Google IAM API and stores it in the database. If the key already exists, it returns the existing key.
 *
 * @param {string} projectId - The ID of the Google Cloud project to ensure the service account key in.
 * @param {string} serviceAccountEmail - The email address of the service account to ensure the key for.
 * @returns {Promise<Object>} - A promise that resolves to the service account key's metadata.
 * @throws {Error} - Throws an error if there is an issue ensuring the service account key.
 */

const ensureServiceAccountKey = async (projectId, serviceAccountEmail) => {
  try {
    const existingKey = await ServiceAccountKeys.findOne({ where: { serviceAccountEmail } })

    if (!existingKey) {
      logger.debug('Creating service account key...')
      const key = await googleService.createServiceAccountKey(oauth2Client, projectId, serviceAccountEmail)
      return storeServiceAccountKeyInDB(serviceAccountEmail, key)
    }

    return existingKey
  } catch (error) {
    logger.error('Error ensuring service account key:', error.message)
    throw error
  }
}

/**
 * Stores the specified service account key in the database.
 *
 * @param {string} email - The email address of the service account to store the key for.
 * @param {Object} key - The service account key to store, containing the privateKeyData, validAfterTime, and validBeforeTime.
 * @returns {Promise<Object>} - A promise that resolves to the newly stored service account key.
 * @throws {Error} - Throws an error if the key cannot be stored in the database.
 */
const storeServiceAccountKeyInDB = async (email, key) => {
  const privateKeyId = key.name.split('/').pop()
  const newKey = await ServiceAccountKeys.create({
    serviceAccountEmail: email,
    privateKeyId,
    privateKeyData: key.privateKeyData,
    validAfterTime: new Date(key.validAfterTime),
    validBeforeTime: new Date(key.validBeforeTime),
  })
  logger.debug(`Service account key stored in DB: ${newKey}`)
  return newKey
}

/**
 * Fetches the details of a specific service account from a Google Cloud project.
 *
 * This function interacts with the Google Identity and Access Management (IAM) API
 * to retrieve metadata for a service account within a given Google Cloud project.
 * It logs the fetched details and handles any errors encountered during the process.
 *
 * @param {string} projectId - The ID of the Google Cloud project containing the service account.
 * @param {string} email - The email address of the service account to fetch details for.
 * @returns {Promise<Object>} - A promise that resolves to the service account's metadata.
 * @throws {Error} - Throws an error if fetching the service account details fails.
 */

const fetchServiceAccountDetails = async (projectId, email) => {
  try {
    const details = await googleService.getServiceAccount(oauth2Client, projectId, email)
    logger.debug('Fetched service account details:', details)
    return details
  } catch (error) {
    logger.error('Error fetching service account details:', error.message)
    throw error
  }
}

/**
 * Upserts a service account in the database.
 *
 * This function attempts to find an existing service account record in the database
 * matching the given project ID. If no record exists, it creates a new record with
 * the given project ID and service account email. If a record exists, it does nothing.
 *
 * @param {string} projectId - The ID of the Google Cloud project associated with the service account.
 * @param {string} email - The email address of the service account to upsert.
 * @returns {Promise<void>} - A promise that resolves when the service account record is upserted.
 */
const upsertServiceAccountInDB = async (projectId, email) => {
  const existing = await ServiceAccount.findOne({ where: { projectId } })
  if (!existing) {
    logger.debug('Storing service account in database...')
    await ServiceAccount.create({ projectId, serviceAccountEmail: email })
  }
}

/**
 * Initializes a new project in the Google Cloud ecosystem.
 *
 * This function interacts with the Google IAM and Cloud Resource Manager APIs to
 * create a new project, enable required APIs, and manage service accounts and
 * keys. It logs the progress at each step and handles any errors encountered
 * during the process.
 *
 * @param {Object} tokens - The OAuth2 tokens used to authenticate the Google service.
 * @param {string} email - The email address of the user creating the project.
 * @param {string} projectName - The name of the project to create.
 * @returns {Promise<Object>} - A promise that resolves to the project setup data.
 * @throws {Error} - Throws an error if the project initialization fails.
 */
exports.initProject = async (tokens, email, projectName) => {
  logger.debug('Entered the init project route')
  // const { tokens, email, projectName } = req.session

  // Logging the tokens and other parameters for debugging
  logger.debug(`Tokens used to create project:${JSON.stringify(tokens, null, 2)}`, {})
  logger.debug(`Email:${email}`)
  logger.debug(`Project Name:${projectName}`)
  try {
    // Set OAuth2 credentials for the Google service
    googleService.setOauth2Credentials(tokens)

    // Find the user by email
    const user = await findUserByEmail(email, projectName)
    const userId = user.id
    logger.debug(`userId: ${userId}`)

    // Get the organization ID
    const organizationId = await getOrganizationId()

    // Get or create the project
    const { project, projectId } = await getOrCreateProject(projectName, organizationId, userId)

    // Enable required APIs
    await enableRequiredAPIs(projectId)

    // Manage service accounts and keys
    const serviceAccount = await ensureServiceAccount(projectId, email)
    const serviceAccountKey = await ensureServiceAccountKey(projectId, serviceAccount.email)

    // Fetch additional service account details
    const serviceAccountDetails = await fetchServiceAccountDetails(projectId, serviceAccount.email)

    // Compile project setup data
    const fullProjectData = {
      projectId: projectId,
      serviceAccountEmail: serviceAccount.email,
      serviceAccountKey,
      clientId: serviceAccountDetails.oauth2ClientId,
      oauth2Client,
    }

    // req.session.projectData = fullCreateProjectData // Store project data in session

    const fetch = await import('node-fetch').then((mod) => mod.default) // Dynamic import of node-fetch
    return fullProjectData
    // return res.render('continue', {
    //   appUrl: 'http://localhost:3000/home-page', // Pass the app URL to EJS
    // })
  } catch (err) {
    console.error(err)
    // Handle errors
    // res.status(500).send(`Error creating project: ${err.message}`)
  }
}
// Route to get project data from the session
exports.getProjectData = async (req, res) => {
  const { userEmail } = req.body
  logger.debug(`UserEmailValue: ${userEmail}`)
  let projectData = await dataController.getProjectData(userEmail)
  let serviceAccountData = await dataController.getServiceAccountData(projectData.projectId)
  let serviceAccountKeys = await dataController.getServiceAccountKey(serviceAccountData.serviceAccountEmail)
  if (projectData) {
    res.status(200).json({ projectData, serviceAccountData, serviceAccountKeys })
  } else {
    res.status(404).json({ error: 'No project data found' })
  }
}

// Route to get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll()
    res.status(200).json(projects)
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'An error occurred while fetching projects.' })
  }
}

/**
 * Returns the project ID associated with the given email address.
 *
 * @param {Object} req - Request object containing the email address in the request body.
 * @param {Object} res - Response object used to return the project ID in JSON format.
 *
 * @example
 * {
 *   "email": "user@example.com"
 * }
 *
 * @returns {Object} - Returns the project ID in JSON format.
 *
 * @throws {Error} - Throws an error if the user or project is not found.
 */
exports.getProjectIdByEmail = async (req, res) => {
  try {
    // Extract the email from the request body
    const { email } = req.body

    // Step 1: Find the user by email to get the project name
    const user = await User.findOne({
      where: { email }, // Search by email address
      attributes: ['projectName'], // Only fetch the projectName
    })

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: 'User with the specified email not found' })
    }

    const { projectName } = user

    // Step 2: Find the project by project name to get the project ID
    const project = await Project.findOne({
      where: { projectName },
      attributes: ['projectId'], // Only fetch the projectId
    })

    // Check if the project exists
    if (!project) {
      return res.status(404).json({ error: 'Project not found for the specified project name' })
    }

    // Return the project ID in JSON format
    return res.status(200).json({ projectId: project.projectId })
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while fetching the project ID' })
  }
}
