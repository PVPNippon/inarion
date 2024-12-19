// Import necessary configurations and utility functions
const { getCredentials, initializeGoogleAuth, impersonateClient } = require('../config/googleDriveConfig')
const logger = require('../logger/logger')(__filename, 'Drive')

/**
 * Initializes the Google Drive instance for a specified user.
 *
 * This function sets up the Google Drive API client by impersonating a user within the client's domain.
 * It retrieves the credentials, initializes the Google Auth client, and then impersonates the given user.
 *
 * @param {string} user - The email address of the user to impersonate.
 * @returns {Promise<Object>} - A promise that resolves to the Google Drive client instance.
 * @throws Will throw an error if there is an issue initializing the Google Drive instance.
 */
async function getDriveInstance(user, serviceAccountEmail, serviceAccountPrivateKey) {
  try {
    // Fetch the service account credentials from the database and decode them.
    const credentials = await getCredentials(serviceAccountEmail, serviceAccountPrivateKey)

    // Initialize the Google Auth client using the retrieved credentials.
    const auth = await initializeGoogleAuth(credentials)

    // Impersonate the specified user (the one provided in the function argument) to access their Google Drive.
    return impersonateClient(user, auth)
  } catch (error) {
    // Log and throw a descriptive error if there's an issue initializing the Google Drive instance.
    throw new Error(`Failed to initialize Google Drive for user ${user}: ${error.message}`)
  }
}

async function fetchAllSharedDrives(userEmail, serviceAccountEmail, serviceAccountPrivateKey) {
  try {
    // Get Google Drive instance as super admin
    const drive = await getDriveInstance(userEmail, serviceAccountEmail, serviceAccountPrivateKey)
    // Fetch all shared drives
    const drivesResponse = await drive.drives.list()
    return drivesResponse.data.drives || []
  } catch (error) {
    logger.debug('Faced error when trying to fetch the list of shared drives', error.message)
  }
}

async function fetchFilesFromDrive(userEmail, serviceAccountEmail, serviceAccountPrivateKey, driveId = null) {
  // Get Google Drive instance as super admin
  const drive = await getDriveInstance(userEmail, serviceAccountEmail, serviceAccountPrivateKey)

  let nextPageToken = null // Token to manage pagination
  let files = [] // Container for all files retrieved
  let filesResponse // Response from the API
  let query = ''
  // Add userEmail filter, if provided
  // if (userEmail) {
  //   query += `'${userEmail}' in owners`;
  // } // query = `('testadmin@pvp-test-domain2.com' in  owners)`
  // logger.debug('Generated query:', query)
  // Log the query for debugging

  do {
    try {
      // Define the common options for drive.files.list
      const listOptions = {
        corpora: driveId ? 'drive' : 'user',
        fields: '*',
        pageToken: nextPageToken,
        includeItemsFromAllDrives: !!driveId,
        supportsAllDrives: !!driveId,
        includePermissionsForView: 'published',
      }

      // Add driveId only if it is a shared drive
      if (driveId) {
        listOptions.driveId = driveId
      }
      // Conditionally add the query if it has a value
      // if (query) {
      //   listOptions.q = query;
      // }

      filesResponse = await drive.files.list(listOptions)

      // Append the fetched files to the files array
      files.push(...filesResponse.data.files)

      // Update nextPageToken for pagination
      nextPageToken = filesResponse.data.nextPageToken
    } catch (error) {
      logger.error(error)
      throw error
    }
  } while (nextPageToken) // Continue fetching files while there are more pages

  // // Process the files once all pages are fetched
  // const filters = createFiltersForRedis(files) // Create filters for all files
  // await storeFiltersInRedis(filters) // Store filters in Redis

  return files // Return all fetched files
}

/**
 * Fetches metadata of a specific file from the Google Drive of an impersonated user.
 *
 * This function impersonates a user using their email and a service account private key,
 * then retrieves the metadata of the specified file from their Google Drive. It leverages
 * Google's Drive API for file operations.
 *
 * @param {string} emailToImpersonate - The email address of the user to impersonate in Google Drive.
 * @param {string} fileId - The ID of the file for which metadata is being fetched.
 * @param {string} privateKey - The private key for the service account used to authenticate the request.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the file's metadata.
 * @throws Will throw an error if there is an issue with impersonating the user or fetching the file metadata.
 */
const fetchFilesDetailsData = async (emailToImpersonate, fileId, serviceAccountEmail, serviceAccountPrivateKey) => {
  // Get the Google Drive instance using the impersonated user's email.
  let drive = await getDriveInstance(emailToImpersonate, serviceAccountEmail, serviceAccountPrivateKey)

  // Get the metadata of the file identified by the fileId from the user's Google Drive.
  // 'fields: *' retrieves all available fields for the file metadata
  const fileData = await drive.files.get({
    fileId: fileId,
    fields: '*', // We can specify specific fields you want to retrieve
  }) // Return the file's metadata.

  return fileData.data
}

// Fetch items shared with a specific user
const fetchItemsSharedWithUser = async (userEmail, emailToImpersonate, serviceAccountEmail) => {
  try {
    // Get the Google Drive instance using the impersonated user's email.
    let drive = await getDriveInstance(emailToImpersonate, serviceAccountEmail)

    const response = await drive.files.list({
      q: `'${userEmail}' in writers or '${userEmail}' in readers or '${userEmail}' in owners`,
      fields: 'files(id, name, permissions(id, emailAddress, role))',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })

    // Filter the permissions for the specified userEmail
    const filesSharedWithUser = response.data.files
      .map((file) => {
        // Ensure permissions property exists and is an array before using find
        const userPermission = Array.isArray(file.permissions)
          ? file.permissions.find((permission) => permission.emailAddress === userEmail)
          : null

        return {
          id: file.id,
          name: file.name,
          permissionId: userPermission ? userPermission.id : null,
          role: userPermission ? userPermission.role : null,
        }
      })
      .filter((file) => file.permissionId !== null) // Filter out files where the specified user has no permissions

    return filesSharedWithUser
  } catch (error) {
    logger.error(error)
    throw error
  }
}

// Service function to get permissions for a file or shared drive
const getPermissions = async (id, isSharedDrive = false, emailToImpersonate, serviceAccountEmail) => {
  try {
    let response
    // Get the Google Drive instance using the impersonated user's email.
    let drive = await getDriveInstance(emailToImpersonate, serviceAccountEmail)

    if (isSharedDrive) {
      // Fetch permissions for a shared drive
      response = await drive.permissions.list({
        driveId: id,
        fields: 'permissions(id,emailAddress,role,type)',
        supportsAllDrives: true,
      })
    } else {
      // Fetch permissions for a file
      response = await drive.permissions.list({
        fileId: id,
        fields: 'permissions(id,emailAddress,role,type)',
        supportsAllDrives: true,
      })
    }

    return response.data.permissions
  } catch (error) {
    throw new Error(`Failed to retrieve permissions: ${error.message}`)
  }
}

module.exports = {
  fetchAllSharedDrives,
  fetchFilesFromDrive,
  fetchFilesDetailsData,
  fetchItemsSharedWithUser,
  getPermissions,
}
