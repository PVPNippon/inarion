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
} = require('../services/driveService')
const { extractEmails } = require('../utility/utilityFunctions')
const logger = require('../logger/logger')(__filename, 'Drive Controller')

/**
 * Controller function to fetch files from Google Drive with optional filtering.
 *
 * This function retrieves files from Google Drive, leveraging Redis for caching.
 * If cached data is unavailable, it fetches data directly from Google Drive, caches it for future use,
 * and returns the data. It also supports various filtering options provided via query parameters.
 */
const getAllDrives = async (req, res, next) => {
  try {
    // Extract admin's email id
    const { adminEmail } = res.locals

    if (res.locals.data) {
      return next()
    }

    logger.debug('res.locals.data is empty in getAllDrives, fetching data from Google Drive')

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

    // Iterate through each shared drive and fetch its files
    for (const sharedDrive of sharedDrives) {
      const driveFiles = await fetchFilesFromDrive({
        adminEmail: adminEmail,
        userEmail: adminEmail,
        driveId: sharedDrive.id,
      })

      // Structure the files hierarchically
      const structuredFiles = await structureDriveFiles(driveFiles, sharedDrive.name, sharedDrive.id)
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

module.exports = {
  getAllDrives,
  fetchEntireDriveStructureFromDrive,
  fetchDirectPathToRootFolderFromDriveOrReports,
}
