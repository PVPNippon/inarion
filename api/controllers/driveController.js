/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const config = require('../config/config')
const {
  structureDriveFiles,
  fetchConstructDirectPath,
  fetchStructuredDriveFilesAndFileCount,
} = require('../helper/drive/driveHierarchyHelper')
const { getOrganizationUsersList } = require('../services/adminService')
const {
  fetchAllSharedDrives,
  fetchFilesFromDrive,
  fetchMinimalFilesMetadataFromDrive,
  findOwnerOfItemViaReports,
  findOwnerOfItemViaDomainUsers,
  fetchFilteredFilesFromDrive,
  fetchSharedDriveCreatorInfo,
  fetchUserEmailFromDirectory,
  fetchActiveOrUnknownStatusOfSharedDrive,
  fetchDeletedDocumentsActivitiesViaReports,
  fetchFilteredSharedDrives,
} = require('../services/driveService')
const { extractEmails } = require('../utility/utilityFunctions')
const logger = require('../logger/logger')(__filename, 'Drive Controller')

/**
 * Middleware to fetch shared drives from Google Drive.
 *
 * This middleware retrieves the admin's email from res.locals and uses it to fetch a list of shared drives.
 * It then extracts the drive IDs from the fetched shared drive objects and stores them in res.locals.sharedDrives
 * for subsequent middleware processing. If shared drive data is already present in res.locals.data, the middleware
 * skips the API call to avoid redundant operations.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object; expects adminEmail in res.locals.
 * @param {Function} next - Express middleware next function.
 * @returns {Promise<void>} Proceeds to the next middleware after setting res.locals.sharedDrives.
 * @throws {Error} Returns a 500 HTTP response with an error message if fetching fails.
 */
const fetchSharedDrives = async (req, res, next) => {
  try {
    // Extract the admin's email from res.locals for API impersonation.
    const { adminEmail } = res.locals

    // If shared drive data is already available, skip fetching.
    if (res.locals.data) {
      return next()
    }

    // Log a debug message to indicate that cached data is missing and data will be fetched from Google Drive.
    logger.debug('res.locals.data is empty in fetchAllDrives, fetching data from Google Drive')

    // Fetch the list of shared drives using the admin's credentials.
    const sharedDrives = await fetchAllSharedDrives(adminEmail)
    // Extract drive IDs from the fetched shared drives.
    const sharedDriveIds = sharedDrives.map((drive) => drive.id)

    // Store the shared drive IDs in res.locals for downstream processing.
    res.locals.sharedDrives = sharedDriveIds

    // Proceed to the next middleware.
    next()
  } catch (err) {
    // Log the error and return a 500 response if an exception occurs during the fetch.
    logger.error('Error fetching or storing data:', err.message)
    return res.status(500).json({ message: 'Failed to fetch data from Google Drive.', error: err.message })
  }
}

/**
 * Middleware to fetch users from the Admin Directory.
 *
 * This middleware uses the admin's email from res.locals to retrieve a list of organization users via
 * the getOrganizationUsersList API call. It extracts user emails from the response and stores them in res.locals.users.
 * If user data is already cached in res.locals.data, the API call is skipped to prevent redundant processing.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object; expects adminEmail in res.locals.
 * @param {Function} next - Express middleware next function.
 * @returns {Promise<void>} Proceeds to the next middleware after setting res.locals.users.
 * @throws {Error} Returns a 500 HTTP response with an error message if user fetching fails.
 */
const fetchUsersFromAdminDirectory = async (req, res, next) => {
  try {
    // Extract the admin's email from res.locals to access the Admin Directory.
    const { adminEmail } = res.locals

    // If user data is already cached, skip the API call.
    if (res.locals.data) {
      return next()
    }

    // Log a debug message to indicate that cached data is missing and data will be fetched from Google Drive.
    logger.debug('res.locals.data is empty in fetchAllDrives, fetching data from Google Drive')

    // Fetch the list of users from the organization's directory and extract their email addresses.
    const emailList = extractEmails(await getOrganizationUsersList({ userEmail: adminEmail }))

    // Store the fetched user email list in res.locals for use by downstream middleware.
    res.locals.users = emailList

    // Proceed to the next middleware.
    next()
  } catch (err) {
    // Log the error and return a 500 response if fetching user data fails.
    logger.error('Error fetching or storing data:', err.message)
    return res.status(500).json({ message: 'Failed to fetch data from Google Drive.', error: err.message })
  }
}

/**
 * Controller function to fetch files from Google Drive with optional filtering.
 *
 * This function retrieves files from Google Drive, leveraging Redis for caching.
 * If cached data is unavailable, it fetches data directly from Google Drive, caches it for future use,
 * and returns the data. It also supports various filtering options provided via query parameters.
 */
const fetchAllDrives = async (req, res, next) => {
  try {
    // Extract admin's email id
    const { adminEmail } = res.locals

    if (res.locals.data) {
      return next()
    }

    logger.debug('res.locals.data is empty in fetchAllDrives, fetching data from Google Drive')

    // Fetch shared and personal drive files
    const sharedDrivesList = await fetchSharedDrivesFiles(adminEmail)
    const personalDrivesList = await fetchPersonalDriveFiles(adminEmail)

    // Set the shared drive and personal drive data in local memory
    res.locals.sharedDrivesList = sharedDrivesList
    res.locals.personalDrivesList = personalDrivesList

    next()

    // Call the next function
  } catch (err) {
    logger.error('Error fetching or storing data:', err.message)
    return res.status(500).json({ message: 'Failed to fetch data from Google Drive.', error: err.message })
  }
}

/**
 * Middleware to fetch the entire drive structure from Google Drive.
 * Retrieves files from a personal drive or a shared drive, constructs the hierarchical structure,
 * and stores the result in `res.locals`.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void} - Calls `next()` on success or sends a 500 response on failure
 */
const fetchEntireDriveStructureFromDrive = async (req, res, next) => {
  try {
    // Extract admin email, drive type (personal/shared), drive ID, and drive name from locals
    const { adminEmail, personalDrive, id, driveName } = res.locals

    // If data is already available, skip fetching
    if (res.locals.data) {
      return next()
    }

    // Fetch minimal file metadata for the respective drive
    const driveData = personalDrive
      ? await fetchMinimalFilesMetadataFromDrive({ adminEmail: adminEmail, userEmail: id })
      : await fetchMinimalFilesMetadataFromDrive({ adminEmail: adminEmail, userEmail: adminEmail, driveId: id })

    // Construct the drive structure and file count
    const { driveStructure, fileCount } = personalDrive
      ? await fetchStructuredDriveFilesAndFileCount(driveData, id)
      : await fetchStructuredDriveFilesAndFileCount(driveData, driveName, id)

    // Store structured drive data in response locals
    res.locals.driveStructure = driveStructure
    res.locals.fileCount = fileCount

    // Proceed to the next middleware
    next()
  } catch (err) {
    // Log the error and send a 500 response
    logger.error('Error fetching or storing drive data:', err.message)
    return res.status(500).json({ message: 'Failed to fetch data from Google Drive.', error: err.message })
  }
}

/**
 * Middleware to fetch the direct path from a file/folder to the root.
 * It attempts to find the owner of the file using the Reports API and organization users.
 * Once the owner is determined, it constructs the direct path and stores it in `res.locals`.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void} - Calls `next()` on success or sends a 400/500 response on validation or failure
 */
const fetchDirectPathToRootFolderFromDriveOrReports = async (req, res, next) => {
  try {
    // Extract admin email and item ID from locals
    const { adminEmail, itemId } = res.locals

    // Validate required parameters
    if (!adminEmail || !itemId) {
      return res.status(400).json({ message: 'Missing required data: adminEmail or itemId' })
    }

    // If data is already available, skip fetching
    if (res.locals.data) {
      return next()
    }

    let owner

    // Step 1: Try finding the owner of the item using the Reports API
    owner = await findOwnerOfItemViaReports(adminEmail, itemId)

    // Step 2: If Reports API fails, find the owner by iterating over all domain users
    if (!owner) {
      const emailList = extractEmails(await getOrganizationUsersList({ userEmail: adminEmail }))
      owner = await findOwnerOfItemViaDomainUsers(emailList, adminEmail, itemId)
    }

    // Step 3: Construct the direct path to the item using the determined owner
    const directPath = await fetchConstructDirectPath(adminEmail, owner, itemId)

    // If the direct path couldn't be constructed, return 404
    if (!directPath || directPath.length === 0) {
      return res.status(404).json({ message: 'Failed to construct the direct path for the item.' })
    }

    // Store the direct path in response locals
    res.locals.directPath = directPath

    // Proceed to the next middleware
    next()
  } catch (err) {
    // Log the error and send a 500 response
    logger.error('Error fetching or storing direct path data:', err.message)
    return res.status(500).json({ message: 'Failed to fetch data from Google Drive.', error: err.message })
  }
}

/**
 * Middleware that fetches files matching the provided criteria across all drives.
 *
 * This middleware first checks if the files matching the given filters have already been cached
 * in res.locals. If not, it invokes a priority-based approach to fetch files (or, when onlyListSharedDrives
 * is true, drive information) from Google Drive. Fetched data and pagination tokens are then stored in
 * res.locals for downstream processing.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object containing local parameters (e.g., filters, owner, etc.).
 * @param {Function} next - Express middleware next function.
 * @returns {Promise<void>} Proceeds to the next middleware if files are fetched successfully or if cached data exists.
 * @throws {Object} Returns a 500 response with an error message if file fetching fails.
 */
const fetchFilteredFiles = async (req, res, next) => {
  try {
    // Skip fetching if data is already present in res.locals.
    if (res.locals.data) return next()

    // Destructure necessary parameters from res.locals.
    const {
      filters,
      owner,
      onlyListSharedDrives,
      listFilesInsideSharedDrives,
      fileCount,
      adminEmail,
      nextPageToken,
      remainingDrives,
    } = res.locals

    // Fetch files using a priority-based approach.
    // When onlyListSharedDrives is true, the function returns drive objects instead of file objects.
    const {
      files,
      remainingDrives: updatedRemainingDrives,
      nextPageToken: updatedNextPageToken,
    } = await fetchFilteredFilesWithPriority(
      owner,
      onlyListSharedDrives,
      listFilesInsideSharedDrives,
      adminEmail,
      filters,
      fileCount,
      nextPageToken,
      remainingDrives
    )

    // If no files (or drives) are found, set a message in res.locals and proceed.
    if (!files || files.length === 0) {
      res.locals.data = { message: 'No files matching the filters found' }
      return next()
    }

    // Store the fetched data for downstream middleware.
    // Note: When onlyListSharedDrives is true, "files" actually represent shared drive IDs.
    res.locals.allFiles = files
    if (!onlyListSharedDrives) {
      res.locals.remainingDrives = updatedRemainingDrives
    }
    res.locals.nextPageToken = updatedNextPageToken

    next()
  } catch (err) {
    // Log the error with contextual information and return a 500 error response.
    logger.error('Error fetching files:', err.message)
    return res.status(500).json({ message: 'Failed to fetch data from Google Drive.', error: err.message })
  }
}

// Helper functions

/**
 * Fetches files from all shared drives of the domain.
 *
 * This function retrieves shared drives and their associated files, structures the data hierarchically,
 * and returns the result as an array.
 *
 * @param {string} adminEmail - The email of the Google Workspace admin.
 * @param {string} serviceAccountEmail - The email of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @returns {Promise<Array>} - A list of shared drives with their files structured hierarchically.
 */
const fetchSharedDrivesFiles = async (adminEmail) => {
  try {
    // Fetch the list of shared drives
    const sharedDrives = await fetchAllSharedDrives(adminEmail)
    const sharedDrivesWithFiles = []

    // Update each drive's status (active/unknown).
    for (let sharedDrive of sharedDrives) {
      sharedDrive.status = await fetchActiveOrUnknownStatusOfSharedDrive(adminEmail, sharedDrive.id)
    }

    // Filter out shared drives that you don't have access to
    const activeSharedDrives = sharedDrives.filter((sharedDrive) => sharedDrive.status === 'active')

    // Iterate through each shared drive and fetch its files
    for (const sharedDrive of activeSharedDrives) {
      const driveFiles = await fetchFilesFromDrive({
        adminEmail: adminEmail,
        userEmail: adminEmail,
        driveId: sharedDrive.id,
      })

      // Structure the files hierarchically
      // const structuredFiles = await structureDriveFiles(driveFiles, sharedDrive.name, sharedDrive.id)
      const structuredFiles = await fetchStructuredDriveFilesAndFileCount(driveFiles, sharedDrive.name, sharedDrive.id)

      sharedDrivesWithFiles.push(structuredFiles)
    }

    return sharedDrivesWithFiles
  } catch (error) {
    logger.error('Error fetching shared drives:', error.message)
    throw error
  }
}

/**
 * Fetches files from the personal drives of all domain users.
 *
 * This function retrieves the list of users in the domain, fetches files from their personal drives,
 * and structures the data hierarchically for each user.
 *
 * @param {string} adminEmail - The email of the Google Workspace admin.
 * @param {string} serviceAccountEmail - The email of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @returns {Promise<Array>} - A list of personal drives with their files structured hierarchically.
 */
const fetchPersonalDriveFiles = async (adminEmail) => {
  try {
    const emailList = extractEmails(await getOrganizationUsersList({ userEmail: adminEmail }))

    const personalDrivesWithFiles = []

    for (const userEmail of emailList) {
      try {
        // Fetch files from the user's personal drive
        const driveFiles = await fetchFilesFromDrive({ adminEmail: adminEmail, userEmail: userEmail })

        // Structure the files hierarchically
        const structuredFiles = await structureDriveFiles(driveFiles, userEmail)
        personalDrivesWithFiles.push(structuredFiles)
      } catch (error) {
        logger.error(`Error processing drive for ${userEmail}:`, error.message)
      }
    }

    return personalDrivesWithFiles
  } catch (error) {
    logger.error('Error fetching personal drives:', error.message)
    throw error
  }
}

/**
 * Orchestrates the retrieval of shared drive creation info.
 *
 * This function uses the Drive Activity API client to get the creation event,
 * and if a known user is found, it uses the Directory API client to get the user's email.
 *
 * @param {object} driveActivityClient - An instance of the Drive Activity API client.
 * @param {object} directoryClient - An instance of the Directory API client.
 * @param {string} sharedDriveItemName - The shared drive item name (e.g., "items/0AOv92gz8GfyoUk9PVA").
 * @returns {Promise<{ email: string|null, createdTime: string|null }>}
 */
async function getSharedDriveCreationInfo(adminEmail, driveId) {
  const { userId, createdTime } = await fetchSharedDriveCreatorInfo(adminEmail, driveId)

  // If no userId is returned, then the creator is deleted or unknown.
  if (!userId) {
    return { email: null, createdTime }
  }

  // Retrieve the email for the known user.
  const email = await fetchUserEmailFromDirectory(adminEmail, userId)

  return {
    email,
    createdTime,
  }
}

/**
 * Identifies deleted drives by comparing active drives with drive deletion activity logs.
 *
 * This function builds a set of active drive IDs from the drives list and then processes the activities
 * (which might be in an array or nested under an "items" property) to map drive IDs to drive names.
 * It returns drives that appear in the activities but are missing from the active drives list, marking them as deleted.
 *
 * @param {Array<Object>} drivesList - Array of active drive objects (each with an "id" property).
 * @param {Array|Object} activitiesList - Activity logs either as an array or an object containing an "items" array.
 * @returns {Array<Object>} Array of drive objects with properties: id, name, and status set to 'deleted'.
 */
async function fetchDeletedDrives(drivesList, activitiesList) {
  // Create a Set of active drive IDs for quick lookup.
  const activeDriveIds = new Set(drivesList.map((drive) => drive.id))

  // Use a Map to collect unique shared drives from the activities.
  const activitiesDrivesMap = new Map()

  // Normalize the activities items into an array.
  let activitiesItems = []
  if (Array.isArray(activitiesList)) {
    activitiesItems = activitiesList
  } else if (activitiesList && Array.isArray(activitiesList.items)) {
    activitiesItems = activitiesList.items
  }

  // Iterate over each activity item to extract drive identifiers and names.
  for (let item of activitiesItems) {
    if (item.events && Array.isArray(item.events)) {
      for (let event of item.events) {
        if (event.parameters && Array.isArray(event.parameters)) {
          let driveId = null
          let driveName = null
          // Extract drive ID and name from the event parameters.
          for (let param of event.parameters) {
            if (param.name === 'doc_id') {
              driveId = param.value
            }
            if (param.name === 'doc_title') {
              driveName = param.value
            }
          }
          // If both ID and name are found, add to the Map.
          if (driveId && driveName) {
            activitiesDrivesMap.set(driveId, driveName)
          }
        }
      }
    }
  }

  // Build a list of drives that are in the activity logs but not in the active drives set.
  const deletedDrives = []
  for (const [driveId, driveName] of activitiesDrivesMap.entries()) {
    if (!activeDriveIds.has(driveId)) {
      deletedDrives.push({ id: driveId, name: driveName, status: 'deleted' })
    }
  }
  return deletedDrives
}

/**
 * Fetches files using a priority-based approach by iterating over available drives until the requested file count is met.
 *
 * For shared drives only, this function performs drive-level pagination, updates each drive's status (active/unknown),
 * and, if necessary, supplements results with deleted drives based on Reports API activities. For personal drives or a mix,
 * it iterates over drives one by one, paginating within each until the desired number of files is collected.
 *
 * @param {string} owner - Identifier for the drive owner; used to target specific drives.
 * @param {boolean} onlyListSharedDrives - Flag indicating whether to exclusively list shared drives.
 * @param {boolean} listFilesInsideSharedDrives - Flag indicating whether to list files within shared drives.
 * @param {string} adminEmail - Admin email used for impersonation when accessing shared drive data.
 * @param {Object} filters - Filter criteria used for file retrieval.
 * @param {number} fileCount - Desired number of files to be fetched.
 * @param {string|null} [nextPageToken=null] - Token for pagination, if available.
 * @param {Array|null} [remainingDrives=null] - Array of remaining drive identifiers to be processed.
 * @returns {Promise<Object>} An object containing:
 *    - files: Array of file IDs (or shared drive IDs if onlyListSharedDrives is true).
 *    - remainingDrives: Array of drive identifiers that have not been fully processed.
 *    - nextPageToken: Pagination token for the next set of results, if applicable.
 */
const fetchFilteredFilesWithPriority = async (
  owner,
  onlyListSharedDrives,
  listFilesInsideSharedDrives,
  adminEmail,
  filters,
  fileCount,
  nextPageToken = null,
  remainingDrives = null
) => {
  // If only shared drives are to be listed, perform drive-level pagination.
  if (onlyListSharedDrives) {
    // Build a query string based on provided filters for shared drive properties.
    let queryParts = []
    if ('hasMembers' in filters) {
      queryParts.push(filters.hasMembers === 'true' ? 'memberCount > 0' : 'memberCount = 0')
    }
    if ('hasManagers' in filters) {
      queryParts.push(filters.hasManagers === 'true' ? 'organizerCount > 0' : 'organizerCount = 0')
    }
    const query = queryParts.length > 0 ? queryParts.join(' and ') : ''

    // Fetch a page of shared drives using the drive-level pagination function.
    let { sharedDrives, newNextPageToken } = await fetchFilteredSharedDrives(adminEmail, query, nextPageToken)

    // Update each drive's status to determine if it is active or unknown.
    for (let drive of sharedDrives) {
      drive.status = await fetchActiveOrUnknownStatusOfSharedDrive(adminEmail, drive.id)
    }

    // If the active drives are fewer than requested, supplement with deleted drives.
    if (sharedDrives.length < fileCount) {
      const deletedDrivesActivities = await fetchDeletedDocumentsActivitiesViaReports(adminEmail)
      const deletedDrives = await fetchDeletedDrives(sharedDrives, deletedDrivesActivities)
      const needed = fileCount - sharedDrives.length
      sharedDrives.push(...deletedDrives.slice(0, needed))
    }

    // Map the resulting drives to their IDs.
    const files = sharedDrives.map((drive) => drive.id)

    return {
      files,
      remainingDrives: null,
      nextPageToken: newNextPageToken,
    }
  }

  // For non-shared drives (or a mix), initialize file collection and drive iteration.
  let files = []
  let remainingLimit = fileCount
  let drives = []

  // If remaining drives are not provided, build the list from available data.
  if (!remainingDrives) {
    if (owner) {
      // If an owner is specified, limit the search to that drive.
      drives = [owner]
    } else {
      // If listing files inside shared drives, retrieve all shared drives.
      if (listFilesInsideSharedDrives) {
        const sharedDrives = await fetchAllSharedDrives(adminEmail)
        drives = sharedDrives.map((drive) => drive.id)
      } else {
        // Otherwise, combine shared drive IDs with organization user emails.
        const sharedDrives = await fetchAllSharedDrives(adminEmail)
        const sharedDriveIds = sharedDrives.map((drive) => drive.id)
        const userEmails = extractEmails(await getOrganizationUsersList({ userEmail: adminEmail }))
        drives = [...sharedDriveIds, ...userEmails]
      }
    }
  } else {
    drives = [...remainingDrives]
  }

  // Process each drive sequentially until the required number of files is collected.
  while (drives.length > 0 && remainingLimit > 0) {
    // Retrieve the next drive to process.
    const currentDrive = drives.shift()

    // Determine drive type based on identifier: personal drives typically include an '@'.
    const isPersonalDrive = currentDrive.includes('@')
    // For personal drives, do not pass driveId so that the API defaults to the user's drive.
    const driveId = isPersonalDrive ? undefined : currentDrive
    // Set impersonation: use the user's email for personal drives, admin email for shared drives.
    const userEmail = isPersonalDrive ? currentDrive : adminEmail

    // Use provided nextPageToken only for the current drive; reset for subsequent drives.
    let driveToken = nextPageToken
    nextPageToken = null

    // Paginate within the current drive until no more pages or file limit is reached.
    while (true) {
      // Optionally retrieve creation information (for debugging or logging purposes).
      // const creationInfo = await getSharedDriveCreationInfo(adminEmail, driveId)
      // console.log('creationInfo = ', creationInfo)

      // Fetch files from the current drive based on filters and pagination token.
      const { fetchedFiles, newNextPageToken } = await fetchFilteredFilesFromDrive(
        adminEmail,
        userEmail,
        driveId,
        filters,
        driveToken,
        remainingLimit
      )

      files.push(...fetchedFiles)
      remainingLimit -= fetchedFiles.length

      // Continue paginating within this drive if more files are needed and a token exists.
      if (remainingLimit > 0 && newNextPageToken) {
        driveToken = newNextPageToken
        continue
      }

      // If file limit is met mid-drive, save state for resumption.
      if (remainingLimit <= 0) {
        if (newNextPageToken) {
          // Prepend the current drive back to the list for future processing.
          drives.unshift(currentDrive)
          nextPageToken = newNextPageToken
        }
        return {
          files,
          remainingDrives: drives,
          nextPageToken,
        }
      }

      // Exit the inner loop if no further pages are available for the current drive.
      break
    }
  }

  // Return the files collected and any remaining drives or pagination tokens.
  return {
    files,
    remainingDrives: drives,
    nextPageToken: null,
  }
}

module.exports = {
  fetchSharedDrives,
  fetchUsersFromAdminDirectory,
  fetchAllDrives,
  fetchEntireDriveStructureFromDrive,
  fetchDirectPathToRootFolderFromDriveOrReports,
  fetchFilteredFiles,
}
