const googleService = require('../services/googleService') // Import Google service functions
const oauth2Client = require('../models/googleAuth') // Import OAuth2 client for authentication
const Project = require('../models/Project') // Import Project model
const url = require('url') // Import URL module
const User = require('../models/User') // Import User model
const ServiceAccount = require('../models/ServiceAccount') // Import ServiceAccount model
const ServiceAccountKeys = require('../models/ServiceAccountKeys') // Import ServiceAccountKeys model

const express = require('express')
const session = require('express-session')
const cors = require('cors')
const app = express()
const dataController = require('../controllers/dataController')
const logger = require('../logger/logger')(__filename, 'Projects')
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
const findUserByEmail = async (email) => {
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
exports.createProject = async (req, res) => {
  logger.debug('Entered the create project route')
  const { tokens, email, projectName } = req.session

  // Logging the tokens and other parameters for debugging
  logger.debug(`Tokens used to create project:${JSON.stringify(tokens, null, 2)}`, {})
  logger.debug(`Email:${email}`)
  logger.debug(`Project Name:${projectName}`)
  try {
    // Set OAuth2 credentials for the Google service
    googleService.setOauth2Credentials(tokens)

    // Find the user by email
    const user = await findUserByEmail(email)
    const userId = user.id
    logger.debug(`userId: ${userId}`)

    // Get the organization ID
    const organizationId = await getOrganizationId()

    // Get or create the project
    const { project, projectId } = await getOrCreateProject(projectName, organizationId, userId)

    // Retry enabling APIs for the project
    await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, 'serviceusage.googleapis.com'))
    await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, 'admin.googleapis.com'))
    // Enable the Google Drive API programmatically
    await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, 'drive.googleapis.com'))
    await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, 'driveactivity.googleapis.com'))

    // Check for existing service account in Google Cloud
    const serviceAccountName = email.replace(/[@.]/g, '-')
    var serviceAccounts = await googleService.listServiceAccounts(oauth2Client, projectId)
    if (serviceAccounts === undefined) serviceAccounts = []
    logger.debug(`List of Service accounts: ${JSON.stringify(serviceAccounts, null, 2)}`)

    // Checking if service account exists in customer's project
    let serviceAccount = serviceAccounts.find((account) => account.displayName === `${email}'s Service Account`)

    // Check if the service account already exists in the database
    let existingServiceAccountInDB = await ServiceAccount.findOne({ where: { projectId: projectId } })

    if (!existingServiceAccountInDB && !serviceAccount) {
      logger.debug('Creating service account in Google Cloud and storing it in the database...')
      serviceAccount = await googleService.createServiceAccount(
        oauth2Client,
        projectId,
        serviceAccountName,
        `${email}'s Service Account`
      )
      await ServiceAccount.create({
        projectId,
        serviceAccountEmail: serviceAccount.email,
      })
    } else if (serviceAccount && !existingServiceAccountInDB) {
      logger.debug('Service account exists in Google Cloud but not in the database, storing it...')
      await ServiceAccount.create({
        projectId,
        serviceAccountEmail: serviceAccount.email,
      })
    } else if (!serviceAccount && existingServiceAccountInDB) {
      logger.debug('Service account exists in the database but not in Google Cloud, creating it...')
      serviceAccount = await googleService.createServiceAccount(
        oauth2Client,
        projectId,
        serviceAccountName,
        `${email}'s Service Account`
      )
      await ServiceAccount.create({
        projectId,
        serviceAccountEmail: serviceAccount.email,
      })
    }

    // Check if service account keys already exist in the database
    let serviceAccountKeyInDB = await ServiceAccountKeys.findOne({
      where: { serviceAccountEmail: serviceAccount.email },
    })
    let serviceAccountKey

    if (!serviceAccountKeyInDB) {
      logger.debug('Creating service account key in Google Cloud and storing it in the database...')
      serviceAccountKey = await googleService.createServiceAccountKey(oauth2Client, projectId, serviceAccount.email)
      logger.debug(`Created key in GCloud: ${serviceAccountKey} `)
      const privateKeyId = serviceAccountKey.name.split('/').pop() // Extract the private key ID
      logger.debug(`privateKeyId ${privateKeyId}`)
      serviceAccountKeyInDB = await ServiceAccountKeys.create({
        serviceAccountEmail: serviceAccount.email,
        privateKeyId: privateKeyId,
        privateKeyData: serviceAccountKey.privateKeyData,
        validAfterTime: new Date(serviceAccountKey.validAfterTime),
        validBeforeTime: new Date(serviceAccountKey.validBeforeTime),
      })

      logger.debug(`Created key in DB ${serviceAccountKeyInDB}`)
    }

    logger.debug(`existing service account ${serviceAccountKeyInDB}`)

    // Fetch service account details
    const serviceAccountEmail = serviceAccount.email
    const serviceAccountDetails = await googleService.getServiceAccount(oauth2Client, projectId, serviceAccountEmail)
    const clientId = serviceAccountDetails.oauth2ClientId

    // Prepare full project data
    const fullCreateProjectData = {
      projectId,
      serviceAccountEmail,
      serviceAccountKey,
      clientId,
      oauth2Client,
    }

    req.session.projectData = fullCreateProjectData // Store project data in session

    const fetch = await import('node-fetch').then((mod) => mod.default) // Dynamic import of node-fetch

    return res.render('continue', {
      appUrl: 'http://localhost:3000/home-page', // Pass the app URL to EJS
    })
  } catch (err) {
    // Handle errors
    res.status(500).send(`Error creating project: ${err.message}`)
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
    logger.error(`Error fetching projects:${error}`)
    res.status(500).json({ error: 'An error occurred while fetching projects.' })
  }
}

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
