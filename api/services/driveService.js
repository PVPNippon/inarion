// Import necessary configurations and utility functions
const { getImpersonatedClientInstanceForAdmin, getImpersonatedClientInstanceForUser } = require('./authService')
const logger = require('../logger/logger')(__filename, 'Drive')

/**
 * Fetches the list of names of all shared drives.
 *
 * This function impersonates the provided admin email to create a Google Drive API client
 * with the necessary permissions, and then retrieves the list of shared drives.
 *
 * @param {string} adminEmail - The email of the super admin account to impersonate.
 * @returns {Promise<Array<Object>>} - An array of shared drive objects or an empty array if none are found.
 * @throws {Error} - Logs an error if the API request fails.
 */
async function fetchAllSharedDrives(adminEmail) {
  try {
    // Get an impersonated Google Drive client instance for the admin
    const drive = await getImpersonatedClientInstanceForAdmin(adminEmail, 'drive')

    // Fetch all shared drives using the Google Drive API
    const drivesResponse = await drive.drives.list()

    // Return the list of shared drives or an empty array if none exist
    return drivesResponse.data.drives || []
  } catch (error) {
    // Log the error message for debugging
    logger.debug('Faced error when trying to fetch the list of shared drives', error.message)
  }
}

/**
 * Fetches all files from a user's drive or a specific shared drive.
 *
 * This function impersonates the provided user email to create a Google Drive API client
 * with the necessary permissions, and retrieves files either from the user's personal drive
 * or a specified shared drive.
 *
 * @param {string} adminEmail - The email of the super admin account to impersonate.
 * @param {string} userEmail - The email of the user whose drive is being accessed.
 * @param {string|null} driveId - The ID of the shared drive (if applicable).
 * @returns {Promise<Array<Object>>} - An array of file objects retrieved from the drive.
 * @throws {Error} - Throws an error if the API request fails.
 */
async function fetchFilesFromDrive({ adminEmail, userEmail, driveId = null }) {
  // Get an impersonated Google Drive client instance for the user
  const drive = await getImpersonatedClientInstanceForUser({
    impersonatedUser: userEmail,
    typeOfInstance: 'drive',
    adminEmail: adminEmail,
  })

  let nextPageToken = null // Initialize the token for pagination
  let files = [] // Initialize an array to store all fetched files
  let filesResponse // Placeholder for the API response

  do {
    try {
      // Define the common options for the drive.files.list API request
      const listOptions = {
        corpora: driveId ? 'drive' : 'user', // Specify 'drive' for shared drives and 'user' for personal drives
        fields: '*', // Retrieve all fields for the files
        pageToken: nextPageToken, // Include the token for pagination
        includeItemsFromAllDrives: !!driveId, // Include items from all drives if a driveId is specified
        supportsAllDrives: !!driveId, // Support operations on all drives if a driveId is specified
        includePermissionsForView: 'published', // Include permission details
      }

      // Add the driveId to the options if fetching files from a shared drive
      if (driveId) {
        listOptions.driveId = driveId
      }

      // Fetch files using the Google Drive API
      filesResponse = await drive.files.list(listOptions)

      // Append the files from the response to the files array
      files.push(...filesResponse.data.files)

      // Update the nextPageToken for pagination (if any)
      nextPageToken = filesResponse.data.nextPageToken
    } catch (error) {
      // Log the error and rethrow it
      logger.error(error)
      throw error
    }
  } while (nextPageToken) // Continue fetching files while more pages exist

  // Return the complete array of fetched files
  return files
}

/**
 * Fetch minimal metadata for all files in a user's personal or shared drive.
 * Supports pagination to retrieve all files.
 *
 * @param {Object} options - Function parameters
 * @param {string} options.adminEmail - The admin email for impersonation
 * @param {string} options.userEmail - The email of the user whose drive is being accessed
 * @param {number} [options.count=1000] - The maximum number of files to fetch per request
 * @param {string|null} [options.driveId=null] - The shared drive ID (if applicable)
 *
 * @returns {Array} - List of files with minimal metadata
 */
async function fetchMinimalFilesMetadataFromDrive({ adminEmail, userEmail, count = 1000, driveId = null }) {
  // Get an impersonated Google Drive client instance for the user
  const drive = await getImpersonatedClientInstanceForUser({
    impersonatedUser: userEmail,
    typeOfInstance: 'drive',
    adminEmail: adminEmail,
  })

  let nextPageToken = null // Initialize the token for pagination
  let files = [] // Initialize an array to store all fetched files
  let filesResponse // Placeholder for the API response

  do {
    try {
      // Define the common options for the drive.files.list API request
      const listOptions = {
        pageSize: count,
        corpora: driveId ? 'drive' : 'user', // Specify 'drive' for shared drives and 'user' for personal drives
        fields: 'files(id, name, parents, mimeType), nextPageToken', // Retrieve all fields for the files
        pageToken: nextPageToken, // Include the token for pagination
        includeItemsFromAllDrives: !!driveId, // Include items from all drives if a driveId is specified
        supportsAllDrives: !!driveId, // Support operations on all drives if a driveId is specified
        includePermissionsForView: 'published', // Include permission details
      }

      // Add the driveId to the options if fetching files from a shared drive
      if (driveId) {
        listOptions.driveId = driveId
      }

      // Fetch files using the Google Drive API
      filesResponse = await drive.files.list(listOptions)

      // Append the files from the response to the files array
      files.push(...filesResponse.data.files)

      // Update the nextPageToken for pagination (if any)
      nextPageToken = filesResponse.data.nextPageToken
    } catch (error) {
      // Log the error and rethrow it
      logger.error(error)
      throw error
    }
  } while (nextPageToken) // Continue fetching files while more pages exist

  // Return the complete array of fetched files
  return files
}

/**
 * Fetch metadata for a specific file or folder.
 *
 * @param {Object} options - Function parameters
 * @param {string} options.adminEmail - The admin email for impersonation
 * @param {string} options.userEmail - The email of the user whose drive is being accessed
 * @param {string} options.itemId - The ID of the file or folder
 *
 * @returns {Object} - File metadata including name, parent folder, and drive ID (if applicable)
 */
async function fetchFileMetadata({ adminEmail, userEmail, itemId }) {
  try {
    const drive = await getImpersonatedClientInstanceForUser({
      impersonatedUser: userEmail,
      typeOfInstance: 'drive',
      adminEmail: adminEmail,
    })

    // Fetch file metadata
    const response = await drive.files.get({
      fileId: itemId,
      fields: 'id, name, parents, driveId',
      supportsAllDrives: true,
    })

    const fileMetadata = response.data

    // If the file is in a shared drive, fetch the shared drive's name
    if (fileMetadata.driveId) {
      const sharedDriveMetadata = await fetchNameAndIdOfSharedDrive({
        adminEmail,
        driveId: fileMetadata.driveId,
      })

      fileMetadata.sharedDriveName = sharedDriveMetadata.name
    }

    return fileMetadata
  } catch (error) {
    logger.error(`Error fetching metadata for file ID ${itemId}:`, error)
    throw error
  }
}

/**
 * Fetch the name and ID of a shared drive.
 *
 * @param {Object} options - Function parameters
 * @param {string} options.adminEmail - The admin email for impersonation
 * @param {string} options.driveId - The ID of the shared drive
 *
 * @returns {Object} - Shared drive metadata including name and ID
 */
async function fetchNameAndIdOfSharedDrive({ adminEmail, driveId }) {
  try {
    const drive = await getImpersonatedClientInstanceForUser({
      impersonatedUser: adminEmail,
      typeOfInstance: 'drive',
      adminEmail: adminEmail,
    })

    // Fetch shared drive metadata
    const response = await drive.drives.get({
      driveId: driveId,
      fields: 'id, name',
    })

    return response.data // Contains id and name of the shared drive
  } catch (error) {
    logger.error(`Error fetching metadata for shared drive ID ${driveId}:`, error)
    throw error
  }
}

/**
 * Use the Admin SDK's Reports API to find the owner of a file.
 *
 * @param {string} adminEmail - The admin email for impersonation
 * @param {string} itemId - The ID of the file
 *
 * @returns {string|null} - The email of the owner or the shared drive ID if owned by a shared drive
 */
async function findOwnerOfItemViaReports(adminEmail, itemId) {
  try {
    // Get an impersonated Admin SDK Reports client instance
    const reports = await getImpersonatedClientInstanceForAdmin(adminEmail, 'reports')

    // Use the Reports API to list activities for the file
    const response = await reports.activities.list({
      userKey: 'all', // Search across all users in the domain
      applicationName: 'drive',
      filters: `doc_id==${itemId}`, // Filter by file ID
      fields: 'items.events.parameters',
      eventName: 'view', // Look for file-related activities (e.g., edit, ownership change)
      maxResults: 1, // Fetch only the latest event for this file
    })

    const activities = response.data.items

    if (!activities || activities.length === 0) {
      throw new Error(`No activity found for file ID: ${itemId}`)
    }

    // Extract parameters from the first event
    const parameters = activities[0].events[0].parameters

    // Find the relevant parameters
    const isSharedDrive = parameters.find((param) => param.name === 'owner_is_shared_drive')?.boolValue
    const ownerName = parameters.find((param) => param.name === 'owner')?.value
    const sharedDriveId = parameters.find((param) => param.name === 'shared_drive_id')?.value

    if (isSharedDrive) {
      // Owner is a shared drive
      return sharedDriveId
    } else {
      // Owner is a user (email address)
      return ownerName
    }
  } catch (error) {
    console.error(`Error finding owner of item ${itemId}:`, error.message)
    throw error
  }
}

/**
 * Loop through every user in the domain to find the owner of a file.
 *
 * @param {Array<string>} emailList - List of user emails in the domain
 * @param {string} adminEmail - The admin email for impersonation
 * @param {string} itemId - The ID of the file
 *
 * @returns {string|null} - The email of the owner or the shared drive ID if owned by a shared drive
 */
const findOwnerOfItemViaDomainUsers = async (emailList, adminEmail, itemId) => {
  try {
    for (let userEmail of emailList) {
      // Get the impersonated Drive client for the user
      const drive = await getImpersonatedClientInstanceForUser({
        impersonatedUser: userEmail,
        typeOfInstance: 'drive',
        adminEmail: adminEmail,
      })

      // Fetch the file metadata
      let fileMetadata
      try {
        fileMetadata = await drive.files.get({
          fileId: itemId,
          supportsAllDrives: true,
          fields: 'owners(emailAddress), driveId',
        })
      } catch (error) {
        // Handle "file not found" error
        if (error.response && error.response.status === 404) {
          console.warn(`File not found for user: ${userEmail}. Continuing to the next user.`)
          continue // Move to the next user
        }
        // Rethrow any other error
        console.error(`Error fetching file metadata for user ${userEmail}:`, error.message)
        throw new Error(`Failed to fetch data from Google Drive.`)
      }

      // Check if the file is in a shared drive
      if (fileMetadata.data.driveId) {
        return fileMetadata.data.driveId
      }

      // Check if the file is owned by a user
      else if (fileMetadata.data.owners && fileMetadata.data.owners.length > 0) {
        return fileMetadata.data.owners[0].emailAddress
      }
    }

    // If no owner is found, log and return null
    console.log(`No owner found for item ${itemId}`)
    return null
  } catch (error) {
    console.error(`Error finding owner of item ${itemId}:`, error.message)
    throw error
  }
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
  fetchMinimalFilesMetadataFromDrive,
  fetchNameAndIdOfSharedDrive,
  fetchItemsSharedWithUser,
  getPermissions,
  fetchFileMetadata,
  findOwnerOfItemViaReports,
  findOwnerOfItemViaDomainUsers,
}
