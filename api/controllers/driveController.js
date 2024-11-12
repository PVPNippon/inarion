const {
  fetchUsersList,
  fetchPersonalDriveFiles,
  fetchSharedDrivesFiles,
  fetchFilesDetailsData,
} = require('../services/driveService')
const encryptionKey = 'my-hardcoded-secret-key'
const config = require('../config/config')
const { storeDriveList, getValueFromRedis } = require('../controllers/cacheController')
const { drive } = require('googleapis/build/src/apis/drive')

// Function to decrypt the private key
function decodePrivateKeyData(privateKeyData) {
  const decodedData = Buffer.from(privateKeyData, 'base64').toString('utf8')
  return JSON.parse(decodedData)
}

/**
 * Controller function to handle the request for fetching a particular file data based on the fileId.
 *
 * This function is triggered when the client sends a request to retrieve the file data of a single file in a user's personal drive along with their metadata.
 * It calls the `fetchFilesDetailsData` service function to get the files and their metadata, then returns the result as a JSON response.
 *
 * @returns {Promise<void>} - Sends a JSON response with the personal drive files and their metadata or an error message.
 */
exports.getFileDetails = async (req, res) => {
  try {
    const { email, emailToImpersonate, serviceAccountEmail, serviceAccountPrivateKey } = req.body
    const { fileId } = req.params
    const userEmail = email
    if (!userEmail || !fileId) {
      return res.status(400).json({ message: 'User email and file ID are required' })
    }

    console.log(`Fetching file details for user: ${userEmail} and file: ${fileId}`)

    const privateKey = decodePrivateKeyData(serviceAccountPrivateKey).private_key

    //We need to send the ServiceAccountKey here, from the request body, and if it is not found, then fetch from the db
    const fileData = await fetchFilesDetailsData(
      emailToImpersonate,
      fileId,
      serviceAccountEmail,
      serviceAccountPrivateKey
    )

    res.status(200).json(fileData)
  } catch (error) {
    console.error('Error fetching file details:', error)
    res.status(500).json({ message: 'Error fetching file details' })
  }
}

const filterDriveData = (data, filters = {}) => {
  const results = []
  const traverse = (items) => {
    items.forEach((item) => {
      // Initialize a flag to check if item matches all active filters
      let matches = true

      // Apply filters only if they are provided
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
        const typeArray = Array.isArray(filters.type) ? filters.type : filters.type.split(',')
        // Only check includes if item.mimeType exists and typeArray is valid
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
      }
      // If the item matches all active filters, add it to results
      if (matches) {
        results.push(item)
      }

      // Recursively traverse children if they exist
      if (item.children && Array.isArray(item.children)) {
        traverse(item.children)
      }
    })
  }
  traverse(data)
  return results
}

/**
 * Controller function to handle the request for fetching files from Google Drive with filtering options.
 *
 * This function retrieves files from Google Drive, either from a cached list in Redis or directly from Google Drive if no cache is available.
 * It applies optional filters provided in the query parameters, allowing for refined control over the results.
 * If no cache exists, it fetches data from Google Drive using service credentials and stores it in Redis for future requests.
 *
 * Available Filters:
 * - `trashed` (boolean): If true, returns only trashed items; if false, returns only non-trashed items.
 * - `driveId` (string): Filters items by a specific drive ID, if provided.
 * - `type` (string): Comma-separated list of file types to filter (e.g., `document,image`).
 * - `name` (string): Returns items whose names contain the specified substring.
 * - `sharedWith` (string): Comma-separated list of email addresses to filter by shared recipients.
 * - `sharedExternally` (boolean): If true, returns only items shared externally; if false, returns items not shared externally.
 * - `onlySharedDrives` (boolean): If true, returns only files from shared drives without traversing nested `children`.
 *
 * @param {Object} req - The Express request object, containing:
 *                        - Query parameters for filters (e.g., `trashed`, `type`, `name`, etc.).
 *                        - Body data with Google Drive credentials (`adminEmail`, `serviceAccountEmail`, `serviceAccountPrivateKey`).
 * @param {Object} res - The Express response object for sending the JSON response.
 * @returns {Promise<void>} - Sends a JSON response with the list of files from Google Drive, filtered if filters are provided.
 */

exports.getAllDrives = async (req, res) => {
  // Extract filtering options from query parameters
  const { driveId, trashed, type, name, sharedWith, sharedExternally, onlySharedDrives } = req.query
  // Extract Google Drive credentials from the request body
  const { adminEmail, serviceAccountEmail, serviceAccountPrivateKey } = req.body

  // Attempt to retrieve the cached list of all drive files from Redis
  let driveFilesList = await getValueFromRedis('ALL-DRIVES-LIST')

  // If no cached drive list is found, fetch files directly from Google Drive
  if (!driveFilesList) {
    console.log('No stored Drive cache found on Redis, fetching from Google Drive')

    // Fetch personal drive files using the provided service credentials
    const personalDriveFiles = await fetchPersonalDriveFiles(adminEmail, serviceAccountEmail, serviceAccountPrivateKey)

    // Fetch shared drive files using the provided service credentials
    const sharedDrivesWithFiles = await fetchSharedDrivesFiles(
      adminEmail,
      serviceAccountEmail,
      serviceAccountPrivateKey
    )

    // Combine files from personal and shared drives
    driveFilesList = [...sharedDrivesWithFiles, ...personalDriveFiles]

    // Store the complete drive list in Redis for caching
    await storeDriveList('ALL-DRIVES-LIST', driveFilesList)
  }

  // Define filters based on query parameters, parsing strings where necessary
  const filters = {
    trashed: trashed !== undefined ? trashed === 'true' : null,
    driveId: driveId || null,
    type: type ? type.split(',') : null,
    name: name || null,
    sharedWith: sharedWith ? sharedWith.split(',') : null,
    sharedExternally: sharedExternally !== undefined ? sharedExternally === 'true' : null,
    onlySharedDrives: onlySharedDrives === 'true', // Boolean filter for shared drives only
  }

  // Apply filters to the drive files list, whether cached or freshly fetched
  const filteredDriveData = filterDriveData(driveFilesList, filters)
  console.log(filteredDriveData)

  // Return the filtered results as JSON
  return res.status(200).json(filteredDriveData)
}

// Controller to handle getting sharing info
exports.getSharingInfo = async (req, res) => {
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
