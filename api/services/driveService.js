// Import necessary configurations and utility functions
const config = require('../config/config')
const { buildQueryFromFilters } = require('../helper/drive/queryBuilder')
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
async function fetchAllSharedDrives(adminEmail, query = '', limit = config.ITEM_LIMIT) {
  let drives = []
  let nextPageToken = null // Initialize the token for pagination

  do {
    try {
      // console.log('inside fetch all shared drives, query = ', query)
      const drive = await getImpersonatedClientInstanceForAdmin(adminEmail, 'drive')

      const drivesResponse = await drive.drives.list({
        useDomainAdminAccess: true, // needed if you want to see all domain shared drives
        fields: 'drives(orgUnitId, id, name, hidden, restrictions), nextPageToken',
        pageSize: limit,
        pageToken: nextPageToken,
        q: query, // pass the query if provided, otherwise undefined
      })

      // Append the files from the response to the files array
      drives.push(...drivesResponse.data.drives)

      // Update the nextPageToken for pagination (if any)
      nextPageToken = drivesResponse.data.nextPageToken
    } catch (error) {
      // Log the error and rethrow it
      console.error(`Error fetching list of all shared drives`, error.message)
      throw error
    }
  } while (nextPageToken) // Continue fetching files while more pages exist
  return drives
}

/**
 * Fetches filtered shared drives using the Google Drive API with pagination support.
 *
 * This function retrieves an impersonated client instance to access the Drive API using domain admin credentials.
 * It then calls the drives.list method with the provided query and pagination token to fetch shared drives.
 * The function returns an object containing the list of shared drives and a pagination token (if available) for further requests.
 *
 * @param {string} adminEmail - The administrator's email used for impersonation to access the Drive API.
 * @param {string} [query=''] - A search query string to filter shared drives.
 * @param {string|null} [pageToken=null] - A pagination token from a previous request to fetch the next set of drives.
 * @param {number} [limit=config.ITEM_LIMIT] - The maximum number of shared drives to retrieve.
 * @returns {Promise<Object>} An object containing:
 *    - sharedDrives: An array of shared drive objects.
 *    - newNextPageToken: A token for the next page of results, or null if none exists.
 */
async function fetchFilteredSharedDrives(adminEmail, query = '', pageToken = null, limit = config.ITEM_LIMIT) {
  try {
    // Retrieve an impersonated client instance for accessing the Drive API.
    const drive = await getImpersonatedClientInstanceForAdmin(adminEmail, 'drive')

    // Call the drives.list method to fetch shared drives with pagination and filtering.
    const drivesResponse = await drive.drives.list({
      useDomainAdminAccess: true,
      fields: 'drives(orgUnitId, id, name, hidden, restrictions), nextPageToken',
      pageSize: limit,
      pageToken: pageToken,
      q: query,
    })

    return {
      sharedDrives: drivesResponse.data.drives,
      newNextPageToken: drivesResponse.data.nextPageToken || null,
    }
  } catch (error) {
    // Log any errors encountered and return an empty result set with a null token.
    console.error(`Error fetching shared drives page:`, error.message)
    return { fetchedDrives: [], newNextPageToken: null }
  }
}

/**
 * Determines if a shared drive is active by attempting to list files within it.
 *
 * This function uses the drives.files.list method to check if a shared drive can return file data.
 * A successful API call indicates the drive is active. If a 403 error is encountered, the drive is marked as 'unknown'.
 * Any other errors are logged and rethrown to ensure unexpected issues are not silently ignored.
 *
 * @param {string} adminEmail - The administrator's email used for impersonation.
 * @param {string} driveId - The unique identifier of the shared drive.
 * @returns {Promise<string>} A string indicating the drive status: 'active' if the drive is accessible, or 'unknown' if access is forbidden.
 * @throws {Error} Rethrows any unexpected errors that occur during the API call.
 */
async function fetchActiveOrUnknownStatusOfSharedDrive(adminEmail, driveId) {
  try {
    // Obtain an impersonated Drive client instance.
    const drive = await getImpersonatedClientInstanceForAdmin(adminEmail, 'drive')
    // Attempt to retrieve file details from the shared drive. Success implies the drive is active.
    await drive.files.list({
      driveId: driveId,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'drive',
    })
    return 'active'
  } catch (error) {
    // If the error indicates a 403 Forbidden status, consider the drive's status as 'unknown'.
    if (error.response) {
      if (error.response.status === 403) {
        return 'unknown'
      }
    }
    // Log unexpected errors and rethrow for further handling.
    console.error(`Error fetching active or unknown status of shared drive`, error.message)
    throw error
  }
}

/**
 * Retrieves deleted shared drive activities via the Reports API.
 *
 * This function gets an impersonated client instance for the Reports API and uses it to list activities related to shared drives.
 * It filters the activities to those representing delete events, which can be used to track deletions of shared drives.
 * The function returns an array of activity objects containing event parameters relevant to deleted shared drives.
 *
 * @param {string} adminEmail - The administrator's email used to access the Reports API via impersonation.
 * @returns {Promise<Array>} An array of activity objects detailing deleted shared drive events.
 * @throws {Error} If an error occurs during the API call, it is logged and rethrown.
 */
async function fetchDeletedDocumentsActivitiesViaReports(adminEmail) {
  try {
    // Retrieve an impersonated client instance for the Reports API.
    const reports = await getImpersonatedClientInstanceForAdmin(adminEmail, 'reports')

    // Use the Reports API to list activities filtered for shared drive deletion events.
    const response = await reports.activities.list({
      userKey: 'all', // Search activities across all users in the domain.
      applicationName: 'drive',
      filters: 'doc_type==shared_drive', // Filter specifically for shared drive related activities.
      fields: 'items.events.parameters',
      eventName: 'delete', // Focus on deletion events.
    })

    const activities = response.data.items
    return activities
  } catch (error) {
    // Log the error and rethrow it to ensure upstream error handling mechanisms can address it.
    console.error(`Error finding deleted shared drives`, error.message)
    throw error
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
    // console.log(`No owner found for item ${itemId}`)
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

/**
 * Fetch the shared drive creation info using the Drive Activity API.
 *
 * @param {object} driveActivityClient - An instance of the Drive Activity API client.
 * @param {string} itemName - The shared drive item name (e.g., "items/0AOv92gz8GfyoUk9PVA").
 * @returns {Promise<{ userId: string|null, createdTime: string|null }>}
 */
async function fetchSharedDriveCreatorInfo(adminEmail, driveId) {
  try {
    // Get an impersonated Drive Activity API client.
    const driveActivityClient = await getImpersonatedClientInstanceForAdmin(adminEmail, 'drive-activity')

    // Build the request body with your provided query parameters.
    const requestBody = {
      itemName: `items/${driveId}`,
      filter: 'detail.action_detail_case:CREATE',
    }

    // Call the Drive Activity API.
    const res = await driveActivityClient.activity.query({ requestBody })
    const { activities = [] } = res.data

    if (!activities.length) {
      // No creation event found.
      return { userId: null, createdTime: null }
    }

    // We assume the first matching CREATE event is the creation event.
    for (const activity of activities) {
      // Check for a create action (the property name may differ based on the API's returned structure).
      if (activity.primaryActionDetail?.create) {
        // Use the top-level timestamp or the startTime from timeRange.
        const createdTime = activity.timestamp || activity.timeRange?.startTime || null

        // Check each actor for user details.
        for (const actor of activity.actors || []) {
          if (actor.user) {
            if (actor.user.knownUser) {
              // Found a known user; return the personName and timestamp.
              return {
                // Strip off the "people/" prefix for downstream processing.
                userId: actor.user.knownUser.personName.replace(/^people\//, ''),
                createdTime,
              }
            } else if (actor.user.deletedUser) {
              // The creator is deleted—return just the timestamp.
              return {
                userId: null,
                createdTime,
              }
            }
          }
        }
        // Fallback: No user details found but a create action exists.
        return { userId: null, createdTime }
      }
    }

    // If no CREATE action is found.
    return { userId: null, createdTime: null }
  } catch (error) {
    console.error(`Error fetching shared drive creator info for item ${driveId}:`, error.message)
    throw error
  }
}

/**
 * Fetch the primary email of a user using the Directory API.
 *
 * @param {object} directoryClient - An instance of the Directory API client.
 * @param {string} userKey - The user identifier (numeric ID or email).
 * @returns {Promise<string|null>} - The primary email of the user.
 */
async function fetchUserEmailFromDirectory(adminEmail, userKey) {
  try {
    // Get an impersonated Directory API client.
    const directoryClient = await getImpersonatedClientInstanceForAdmin(adminEmail, 'directory')

    const res = await directoryClient.users.get({
      userKey,
      viewType: 'admin_view',
      fields: 'primaryEmail',
    })
    return res.data.primaryEmail || null
  } catch (err) {
    console.error("Error fetching user's primary email from directory API:", err.message)
    return null
  }
}

/**
 * Fetches files from a single drive (personal or shared) using provided filters.
 *
 * This function obtains an impersonated Drive client instance to perform an authenticated API request.
 * It constructs a query string based on the supplied filters and then invokes the Drive API to list files.
 * The API request is dynamically adapted depending on whether a shared drive ID is provided, which adjusts
 * parameters such as the corpora and flags to support shared drive queries.
 *
 * @param {string} adminEmail - The admin email used to impersonate and authorize the API request.
 * @param {string} userEmail - The user email representing the drive owner for impersonation.
 * @param {string|null} driveId - The identifier for a shared drive. If null, the personal drive is queried.
 * @param {Object} filters - An object containing filter criteria for constructing the search query.
 * @param {string|null} [pageToken=null] - A token for pagination to retrieve subsequent pages of results.
 * @param {number} [limit=config.ITEM_LIMIT] - The maximum number of files to retrieve per request.
 * @returns {Promise<Object>} An object containing:
 *    - fetchedFiles: An array of file objects (with properties like id and name).
 *    - newNextPageToken: A pagination token for the next set of results, or null if there are no more pages.
 */
const fetchFilteredFilesFromDrive = async (
  adminEmail,
  userEmail,
  driveId,
  filters,
  pageToken = null,
  limit = config.ITEM_LIMIT
) => {
  try {
    // Obtain an impersonated Drive client instance to ensure the API request is executed under proper credentials.
    const drive = await getImpersonatedClientInstanceForUser({
      impersonatedUser: userEmail,
      typeOfInstance: 'drive',
      adminEmail: adminEmail,
    })

    // Construct the search query string from the provided filters.
    const query = buildQueryFromFilters(filters)
    // Debug statement (commented out) to log the query during development.
    // console.log('query to fetch files via FILES.LIST', query)

    // Execute the API call to list files, adjusting parameters based on the presence of a shared drive ID.
    const response = await drive.files.list({
      // Use 'drive' corpora for shared drives; default to 'user' for personal drives.
      corpora: driveId ? 'drive' : 'user',
      q: query,
      fields: 'files(id, name), nextPageToken',
      // Include driveId if provided, otherwise leave undefined.
      driveId: driveId || undefined,
      // Set flags to support shared drive access if a driveId is specified.
      supportsAllDrives: !!driveId,
      includeItemsFromAllDrives: !!driveId,
      pageSize: limit,
      // Only add pageToken if it is provided.
      pageToken: pageToken || undefined,
    })

    // Return the files retrieved and the nextPageToken for further pagination.
    return {
      fetchedFiles: response.data.files,
      newNextPageToken: response.data.nextPageToken || null,
    }
  } catch (error) {
    // Log error details with contextual information regarding the drive queried.
    logger.error(`Error fetching files from drive ${driveId || 'personal'}:`, error)
    // Return an object with consistent keys to allow the calling code to handle errors gracefully.
    return { fetchedFiles: [], newNextPageToken: null }
  }
}

module.exports = {
  fetchAllSharedDrives,
  fetchFilteredSharedDrives,
  fetchActiveOrUnknownStatusOfSharedDrive,
  fetchDeletedDocumentsActivitiesViaReports,
  fetchFilesFromDrive,
  fetchMinimalFilesMetadataFromDrive,
  fetchNameAndIdOfSharedDrive,
  fetchItemsSharedWithUser,
  fetchFilteredFilesFromDrive,
  getPermissions,
  fetchFileMetadata,
  findOwnerOfItemViaReports,
  findOwnerOfItemViaDomainUsers,
  fetchSharedDriveCreatorInfo,
  fetchUserEmailFromDirectory,
}
