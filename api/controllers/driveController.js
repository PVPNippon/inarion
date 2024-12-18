const encryptionKey = 'my-hardcoded-secret-key'
const config = require('../config/config')
const { fetchDataFromCache, storeDataInCache } = require('../controllers/cacheController')
const { structureDriveFiles } = require('../helper/drive/driveHierarchyHelper')
const { createOrUpdateFiltersForFile } = require('../helper/redis/redisFiltersHelper')
const populateDataModel = require('../models/redisDriveItem')
const { getOrganizationUsersList } = require('../services/adminService')
const { fetchFilesDetailsData, fetchAllSharedDrives, fetchFilesFromDrive } = require('../services/driveService')
const { generateTransaction, executeTransaction } = require('../services/redisCacheService')
const { createRedisKey, extractEmails } = require('../utility/utilityFunctions')
const logger = require('../logger/logger')(__filename, 'Drive Controller')

// Function to decrypt the private key
function decodePrivateKeyData(privateKeyData) {
  const decodedData = Buffer.from(privateKeyData, 'base64').toString('utf8')
  return JSON.parse(decodedData)
}

const getFileDetails = async (req, res) => {
  try {
    const { email, emailToImpersonate, serviceAccountEmail, serviceAccountPrivateKey } = req.body
    const { fileId } = req.params
    const userEmail = email
    if (!userEmail || !fileId) {
      return res.status(400).json({ message: 'User email and file ID are required' })
    }

    logger.info(`Fetching file details for user: ${userEmail} and file: ${fileId}`)

    const privateKey = decodePrivateKeyData(serviceAccountPrivateKey).private_key //We need to send the ServiceAccountKey here, from the request body, and if it is not found, then fetch from the db

    const fileData = await fetchFilesDetailsData(
      emailToImpersonate,
      fileId,
      serviceAccountEmail,
      serviceAccountPrivateKey
    )

    res.status(200).json(fileData)
  } catch (error) {
    logger.error(error)
    res.status(500).json({ message: 'Error fetching file details' })
  }
}

const filterDriveData = (data, filters = {}) => {
  const results = []
  const traverse = (items) => {
    items.forEach((item) => {
      // Initialize a flag to check if item matches all active filters
      let matches = true // Apply filters only if they are provided

      if (filters.trashed !== null) {
        matches = matches && filters.trashed && item.trashed === filters.trashed
      }
      if (filters.name) {
        matches = matches && item.name && item.name.includes(filters.name)
      }
      if (filters.sharedExternally !== null && Array.isArray(item.permissionIds)) {
        const isExternallyShared = item.permissionIds.includes('anyoneWithLink')
        matches = matches && filters.sharedExternally === isExternallyShared
      }
      if (filters.type !== null) {
        const typeArray = Array.isArray(filters.type) ? filters.type : filters.type.split(',') // Only check includes if item.mimeType exists and typeArray is valid
        if (item.mimeType) {
          matches = matches && typeArray.some((t) => t && item.mimeType.includes(t.trim()))
        } else {
          matches = false // No mimeType means it doesn't match
        }
      }

      if (filters.sharedWith !== null && Array.isArray(item.permissionIds)) {
        const sharedWithArray = Array.isArray(filters.sharedWith) ? filters.sharedWith : [filters.sharedWith]
        matches = matches && sharedWithArray.some((id) => item.permissionIds.includes(id))
      }

      if (filters.driveId !== null) {
        matches = matches && item.driveId === filters.driveId
      }
      if (filters.onlySharedDrives) {
        matches = matches && item.driveName !== undefined // Only include items with `driveName` for shared drives
      } // If the item matches all active filters, add it to results
      if (matches) {
        results.push(item)
      } // Recursively traverse children if they exist

      if (item.children && Array.isArray(item.children)) {
        traverse(item.children)
      }
    })
  }
  traverse(data)
  return results
}

/**
 * Controller function to fetch files from Google Drive with optional filtering.
 *
 * This function retrieves files from Google Drive, leveraging Redis for caching.
 * If cached data is unavailable, it fetches data directly from Google Drive, caches it for future use,
 * and returns the data. It also supports various filtering options provided via query parameters.
 *
 * @param {Object} req - The Express request object containing:
 *   - Query parameters for filters (`trashed`, `type`, `name`, etc.).
 *   - Body data for Google Drive credentials (`adminEmail`, `serviceAccountEmail`, `serviceAccountPrivateKey`).
 * @param {Object} res - The Express response object used to send the response.
 * @returns {Promise<void>} - Sends a JSON response containing the filtered list of files.
 */
const getAllDrives = async (req, res) => {
  try {
    // Extract Google Drive credentials from the request body
    const { adminEmail, serviceAccountEmail, serviceAccountPrivateKey } = req.body

    // Attempt to retrieve cached list of all drive files from Redis
    let driveFilesList = await fetchDataFromCache('all-drives-list', 'string')

    // If no cached data is found, fetch data from Google Drive
    if (!driveFilesList) {
      logger.debug('No cached data found, fetching from Google Drive.')

      // Fetch shared and personal drive files
      const sharedDrivesList = await fetchSharedDrivesFiles(adminEmail, serviceAccountEmail, serviceAccountPrivateKey)
      await storeDriveDataInCache(sharedDrivesList, true) // Cache shared drives data

      const personalDrivesList = await fetchPersonalDriveFiles(
        adminEmail,
        serviceAccountEmail,
        serviceAccountPrivateKey
      )
      await storeDriveDataInCache(personalDrivesList, false) // Cache personal drives data

      // Combine data from both shared and personal drives
      driveFilesList = [...sharedDrivesList, ...personalDrivesList]
    }

    // Return the fetched data as a response
    return res.status(200).json({ message: 'Successfully fetched data from Google Drive.', info: driveFilesList })
  } catch (err) {
    logger.error('Error fetching or storing data:', err.message)
    return res.status(500).json({ message: 'Failed to fetch data from Google Drive.', error: err.message })
  }
}

// Controller to handle getting sharing info
const getSharingInfo = async (req, res) => {
  const { id } = req.params
  const { isSharedDrive } = req.query
  const { emailToImpersonate, serviceAccountEmail } = req.body

  try {
    const sharingInfo = await driveService.getPermissions(id, isSharedDrive, emailToImpersonate, serviceAccountEmail)
    res.status(200).json(sharingInfo)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getFileDetails,
  filterDriveData,
  getAllDrives,
  getSharingInfo,
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
const fetchSharedDrivesFiles = async (adminEmail, serviceAccountEmail, serviceAccountPrivateKey) => {
  try {
    // Fetch the list of shared drives
    const sharedDrives = await fetchAllSharedDrives(adminEmail, serviceAccountEmail, serviceAccountPrivateKey)
    const sharedDrivesWithFiles = []

    // Iterate through each shared drive and fetch its files
    for (const sharedDrive of sharedDrives) {
      const driveFiles = await fetchFilesFromDrive(
        adminEmail,
        serviceAccountEmail,
        serviceAccountPrivateKey,
        sharedDrive.id
      )

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
const fetchPersonalDriveFiles = async (adminEmail, serviceAccountEmail, serviceAccountPrivateKey) => {
  try {
    const emailList = extractEmails(await getOrganizationUsersList({ userEmail: adminEmail }))

    const personalDrivesWithFiles = []

    for (const email of emailList) {
      try {
        // Fetch files from the user's personal drive
        const driveFiles = await fetchFilesFromDrive(email, serviceAccountEmail, serviceAccountPrivateKey)

        // Structure the files hierarchically
        const structuredFiles = await structureDriveFiles(driveFiles, email)
        personalDrivesWithFiles.push(structuredFiles)
      } catch (error) {
        logger.error(`Error processing drive for ${email}:`, error.message)
      }
    }

    return personalDrivesWithFiles
  } catch (error) {
    logger.error('Error fetching personal drives:', error.message)
    throw error
  }
}

/**
 * Stores drive data in Redis for caching purposes.
 *
 * This function takes a list of drive files and stores their hierarchical data
 * and metadata in Redis using a Redis transaction for batching operations.
 *
 * @param {Array} drivesList - The list of drive files to store.
 * @param {boolean} isSharedDrive - Whether the data pertains to shared drives.
 * @returns {Promise<void>}
 */
const storeDriveDataInCache = async (drivesList, isSharedDrive) => {
  try {
    const driveType = isSharedDrive ? config.SHARED_DRIVE : config.PERSONAL_DRIVE
    const driveKeyType = isSharedDrive ? 'driveId' : 'driveName'
    const listKey = isSharedDrive ? config.SHARED_DRIVE : config.PERSONAL_DRIVE

    // Initialize a Redis transaction to batch all commands together
    const redisTransaction = generateTransaction()

    // Store the list of drive IDs or names
    const listOfDrives = drivesList.map((drive) => drive[driveKeyType])
    await storeDataInCache(
      createRedisKey(config.DOMAIN_TEST, listKey, config.LIST),
      listOfDrives,
      config.SETS,
      redisTransaction
    )

    // Store individual drive data with their hierarchical structures
    for (const drive of drivesList) {
      const driveKey = drive[driveKeyType]
      await storeDataInCache(
        createRedisKey(config.DOMAIN_TEST, driveType, driveKey, config.INFO),
        drive,
        config.JSON,
        redisTransaction
      )

      // Recursively store file metadata
      if (drive.children) {
        for (const child of drive.children) {
          await storeItemInfo(child, redisTransaction) // Pass the transaction for batching
        }
      }
    }

    // Execute all batched commands in the Redis transaction
    await executeTransaction(redisTransaction)
  } catch (error) {
    logger.error('Error storing drive data in Redis:', error.message)
  }
}

/**
 * Recursively stores file metadata in Redis.
 *
 * This function traverses the hierarchical structure of files and stores each item's
 * metadata and associated filters in Redis.
 *
 * @param {Object} item - The file or folder to store.
 * @param {Object} redisTransaction - The Redis transaction for batching operations.
 * @returns {Promise<void>}
 */
const storeItemInfo = async (item, redisTransaction) => {
  try {
    const populatedData = populateDataModel(item)

    // Store item metadata in Redis
    await storeDataInCache(
      createRedisKey(config.DOMAIN_TEST, config.ITEM, item.id, config.INFO),
      populatedData,
      config.HASH,
      redisTransaction
    )

    // Update filters for the file
    await createOrUpdateFiltersForFile(populatedData, redisTransaction)

    // Recursively store child items
    if (item.children) {
      for (const child of item.children) {
        await storeItemInfo(child, redisTransaction)
      }
    }
  } catch (error) {
    logger.error(`Error storing item info for ${item.id}:`, error.message)
  }
}
