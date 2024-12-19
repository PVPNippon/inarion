const { google } = require('googleapis')
const oauth2Client = require('../models/googleAuth')
const logger = require('../logger/logger')(__filename, 'Google Service')

/**
 * Sets OAuth2 credentials for the OAuth2 client using the provided tokens.
 *
 * This function checks if valid tokens are provided, specifically an `access_token`, and
 * sets the OAuth2 credentials for future API requests. If the tokens are invalid or missing,
 * it throws an error.
 *
 * @param {Object} tokens - The OAuth2 tokens object, which should contain an `access_token`.
 * @throws {Error} - Throws an error if the `access_token` is missing or invalid.
 */
const setOauth2Credentials = (tokens) => {
  if (!tokens || !tokens.access_token) {
    throw new Error('No access token provided') // Error if no access token is present
  }
  oauth2Client.setCredentials(tokens) // Set credentials on the OAuth2 client
}

/**
 * Retrieves a list of organizations accessible to the authenticated user from Google Cloud Resource Manager.
 *
 * This function interacts with the Google Cloud Resource Manager API to search for and retrieve a list of
 * organizations associated with the authenticated user. The function uses the provided `authClient` for
 * authentication. In case of an error during the API call, it logs the error and throws it for further handling.
 *
 * @param {Object} authClient - The authentication client (e.g., OAuth2 or JWT client) used to authenticate the request.
 * @returns {Promise<Array>} - A promise that resolves to an array of organizations if the request is successful.
 * @throws {Error} - Throws an error if the API request fails.
 */
const listOrganizations = async (authClient) => {
  // logger.debug(authClient);
  const cloudResourceManager = google.cloudresourcemanager('v3')
  try {
    // Make the API call to search for organizations using the authClient
    const response = await cloudResourceManager.organizations.search({
      auth: authClient,
    })
    // Return the list of organizations from the response
    return response.data.organizations
  } catch (error) {
    // Log and throw the error if the API request fails
    logger.error(error)
    throw error
  }
}

/**
 * Creates a new Google Cloud project under the specified organization using the provided OAuth2 credentials.
 *
 * This function interacts with the Google Cloud Resource Manager API to create a new project under the authenticated
 * user's organization. It takes in the `oauth2Client` for authentication, along with the project ID, project name,
 * and organization ID. The function constructs a request to create a project and returns the created project's metadata.
 *
 * @param {Object} oauth2Client - The OAuth2 client used to authenticate the request.
 * @param {string} projectId - The unique ID for the new project.
 * @param {string} projectName - The display name of the new project.
 * @param {string} organizationId - (Optional) The ID of the organization under which the project will be created.
 * @returns {Promise<Object>} - A promise that resolves to the metadata of the created project.
 * @throws {Error} - Throws an error if the API request to create the project fails.
 */
const createProject = async (oauth2Client, projectId, projectName, organizationId) => {
  const cloudResourceManager = google.cloudresourcemanager('v3') // Initialize the Cloud Resource Manager API client
  // const resourcemanagerClient = new ProjectsClient();
  const request = {
    requestBody: {
      projectId: projectId, // The unique ID of the project
      displayName: projectName, // The display name of the project
    },
    auth: oauth2Client, // OAuth2 client for authentication
  }

  // Send the request to create the project and return the project data
  const response = await cloudResourceManager.projects.create(request)
  return response.data
}

/**
 * Lists all Google Cloud projects accessible by the authenticated user.
 *
 * This function interacts with the Google Cloud Resource Manager API to retrieve a list of projects
 * associated with the authenticated user. It uses the provided `authClient` to authenticate the request.
 * The projects can belong to any organization accessible by the authenticated user.
 *
 * @param {Object} authClient - The authentication client (e.g., OAuth2 or JWT client) used to authenticate the request.
 * @param {string} organizationId - (Optional) The ID of the organization under which to search for projects (not currently used).
 * @returns {Promise<Array>} - A promise that resolves to an array of projects.
 * @throws {Error} - Throws an error if the API request to list projects fails.
 */
const listProjects = async (authClient, organizationId) => {
  const cloudResourceManager = google.cloudresourcemanager('v3') // Initialize the Cloud Resource Manager API client
  try {
    const response = await cloudResourceManager.projects.search({
      auth: authClient,
    })
    // Return the list of projects from the response
    return response.data.projects
  } catch (error) {
    // Log and throw the error if the API request fails
    logger.error(error)
    throw error
  }
}

/**
 * Enables a specified API for a given Google Cloud project.
 *
 * This function uses the Google Service Usage API to enable a specific API (service) for the given
 * Google Cloud project. The API is identified by its name (e.g., `compute.googleapis.com`), and
 * the function requires an authenticated client to authorize the request.
 *
 * @param {Object} authClient - The authentication client (e.g., OAuth2 or JWT client) used to authenticate the request.
 * @param {string} projectId - The ID of the Google Cloud project where the API will be enabled.
 * @param {string} apiName - The name of the API (service) to enable (e.g., 'compute.googleapis.com').
 * @returns {Promise<Object>} - A promise that resolves to the response data of the API enabling request.
 * @throws {Error} - Throws an error if the API enabling request fails.
 */
const enableAPI = async (authClient, projectId, apiName) => {
  // Initialize the Google Service Usage API client
  const serviceUsage = google.serviceusage({ version: 'v1', auth: authClient })
  const request = {
    name: `projects/${projectId}/services/${apiName}`,
  }
  // Send the request to enable the specified API for the project
  const response = await serviceUsage.services.enable(request)
  // Return the response data from the API call
  return response.data
}

/**
 * Creates a new service account in the specified Google Cloud project.
 *
 * This function interacts with the Google Identity and Access Management (IAM) API to create a new service account
 * within a given Google Cloud project. It accepts an authentication client for authorization, a project ID, an account ID,
 * and a display name for the service account. The `accountId` is adjusted to ensure it meets Google's length requirements.
 *
 * @param {Object} authClient - The authentication client (e.g., OAuth2 or JWT client) used to authenticate the request.
 * @param {string} projectId - The ID of the Google Cloud project where the service account will be created.
 * @param {string} accountId - The desired ID for the service account. The function ensures it is between 6 and 30 characters long.
 * @param {string} displayName - The display name for the new service account.
 * @returns {Promise<Object>} - A promise that resolves to the created service account's metadata.
 * @throws {Error} - Throws an error if the API request to create the service account fails.
 */
const createServiceAccount = async (authClient, projectId, accountId, displayName) => {
  const iam = google.iam('v1') // Initialize the IAM API client

  // Ensure accountId meets Google's requirements: minimum length 6, maximum length 30
  if (accountId.length < 6) {
    accountId = accountId.padEnd(6, '0') // If too short, pad with zeros
  } else if (accountId.length > 30) {
    accountId = accountId.substring(0, 30) // If too long, truncate to 30 characters
  }

  // Construct the request payload for creating a service account
  const request = {
    name: `projects/${projectId}`, // Specify the project where the service account will be created
    resource: {
      accountId: accountId, // The desired account ID
      serviceAccount: {
        displayName: displayName, // The display name for the service account
      },
    },
    auth: authClient, // Provide the authenticated client
  }

  // Send the request to create the service account and return the response
  const response = await iam.projects.serviceAccounts.create(request)
  return response.data
}

/**
 * Creates a new key for a specified service account in a Google Cloud project.
 *
 * This function interacts with the Google Identity and Access Management (IAM) API to generate a new key
 * for a service account within a given Google Cloud project. The function requires an authentication client,
 * the project ID, and the email address of the service account. The created key can be used to authenticate
 * applications or services with Google APIs.
 *
 * @param {Object} authClient - The authentication client (e.g., OAuth2 or JWT client) used to authenticate the request.
 * @param {string} projectId - The ID of the Google Cloud project where the service account exists.
 * @param {string} serviceAccountEmail - The email address of the service account for which a key will be created.
 * @returns {Promise<Object>} - A promise that resolves to the newly created service account key's metadata and private key.
 * @throws {Error} - Throws an error if the API request to create the service account key fails.
 */
const createServiceAccountKey = async (authClient, projectId, serviceAccountEmail) => {
  const iam = google.iam('v1') // Initialize the IAM API client
  const request = {
    name: `projects/${projectId}/serviceAccounts/${serviceAccountEmail}`, // Specify the service account
    auth: authClient, // Provide the authenticated client
    resource: {}, // The resource body (can contain options for key creation)
  }

  // Send the request to create the service account key and return the response data
  const response = await iam.projects.serviceAccounts.keys.create(request)
  return response.data
}

/**
 * Retrieves details of a specific service account in a Google Cloud project.
 *
 * This function interacts with the Google Identity and Access Management (IAM) API to fetch metadata
 * for a service account within a given Google Cloud project. It requires an authentication client,
 * the project ID, and the email address of the service account.
 *
 * @param {Object} authClient - The authentication client (e.g., OAuth2 or JWT client) used to authenticate the request.
 * @param {string} projectId - The ID of the Google Cloud project where the service account exists.
 * @param {string} serviceAccountEmail - The email address of the service account to retrieve.
 * @returns {Promise<Object>} - A promise that resolves to the service account's metadata.
 * @throws {Error} - Throws an error if the API request to retrieve the service account fails.
 */
const getServiceAccount = async (authClient, projectId, serviceAccountEmail) => {
  const service = google.iam('v1') // Initialize the IAM API client

  // Make the API request to retrieve the service account's details
  const res = await service.projects.serviceAccounts.get({
    name: `projects/${projectId}/serviceAccounts/${serviceAccountEmail}`,
    auth: authClient,
  })

  // Return the service account metadata
  return res.data
}

/**
 * Lists all service accounts for a specific Google Cloud project.
 *
 * This function interacts with the Google Identity and Access Management (IAM) API to retrieve a list
 * of all service accounts within a given Google Cloud project. It requires an authentication client
 * and the project ID.
 *
 * @param {Object} authClient - The authentication client (e.g., OAuth2 or JWT client) used to authenticate the request.
 * @param {string} projectId - The ID of the Google Cloud project for which the service accounts will be listed.
 * @returns {Promise<Array>} - A promise that resolves to an array of service accounts in the project.
 * @throws {Error} - Throws an error if the API request to list service accounts fails.
 */
const listServiceAccounts = async (authClient, projectId) => {
  const service = google.iam('v1') // Initialize the IAM API client

  // Make the API request to list the service accounts in the specified project
  const res = await service.projects.serviceAccounts.list({
    name: `projects/${projectId}`, // Specify the project where the service accounts exist
    auth: authClient, // Provide the authenticated client
  })

  // Log the list of service accounts (for debugging)
  // logger.debug(`Service accounts: ${JSON.stringify(res.data.accounts, null, 2)}`)
  // Return the list of service accounts, or an empty array if none are found
  return res.data.accounts
}

// Initialize the Google Workspace Activity API service
const getActivityService = async (auth) => {
  return google.appsactivity({
    version: 'v2',
    auth,
  })
}

/**
 * Exports a set of functions related to Google Cloud project and service account management.
 *
 * This module includes functions for setting OAuth2 credentials, listing organizations, creating projects,
 * managing Google Cloud APIs, and managing service accounts. These functions allow interaction with various
 * Google Cloud APIs, such as Identity and Access Management (IAM) and Cloud Resource Manager, using authenticated
 * requests.
 *
 * Exported functions:
 * - setOauth2Credentials: Sets OAuth2 credentials for the OAuth2 client.
 * - listOrganizations: Lists organizations associated with the authenticated user.
 * - createProject: Creates a new Google Cloud project under the authenticated user's organization.
 * - listProjects: Lists all Google Cloud projects accessible by the authenticated user.
 * - enableAPI: Enables a specified API for a given Google Cloud project.
 * - createServiceAccount: Creates a new service account in a specified Google Cloud project.
 * - createServiceAccountKey: Creates a new key for a specific service account in a Google Cloud project.
 * - getServiceAccount: Retrieves details of a specific service account in a Google Cloud project.
 * - listServiceAccounts: Lists all service accounts for a specific Google Cloud project.
 */
module.exports = {
  setOauth2Credentials,
  listOrganizations,
  createProject,
  listProjects,
  enableAPI,
  createServiceAccount,
  createServiceAccountKey,
  getServiceAccount,
  listServiceAccounts,
}
