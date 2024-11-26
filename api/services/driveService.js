// Import necessary configurations and utility functions
const { getCredentials, initializeGoogleAuth, impersonateClient } = require('../config/googleDriveConfig')
const config = require('../config/config')
const { extractEmails } = require('../utility/utilityFunctions')
const { default: axios } = require('axios')
const API_BASE_URL = process.env.API_BASE_URL
const { getMimeTypeOrKey } = require('../helper/mimeType')
const logger = require('../logger')(__filename, 'Drive')

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

/**
 * Fetches all files from a Google Drive, supporting both personal and shared drives.
 * Handles pagination if there are multiple pages of files.
 *
 * @param {Object} drive - The authenticated Google Drive instance.
 * @param {string|null} driveId - The ID of the shared drive, or null for personal drive.
 * @returns {Promise<Array>} - A promise that resolves to an array of files.
 */
const fetchFilesFromDrive = async (drive, driveId = null) => {
  let nextPageToken = null // Token to manage pagination
  let files = [] // Container for all files retrieved
  let filesResponse // Response from the API
  let query = ''

  // Add userEmail filter, if provided
  // if (userEmail) {
  //   query += `'${userEmail}' in owners`;
  // }

  // query = `('testadmin@pvp-test-domain2.com' in  owners)`
  logger.debug(`Generated query:${JSON.stringify(query, null, 2)}`) // Log the query for debugging

  do {
    try {
      // Define the common options for drive.files.list
      const listOptions = {
        corpora: driveId ? 'drive' : 'user',
        fields: '*',
        pageToken: nextPageToken,
        // includeItemsFromAllDrives: true,
        // supportsAllDrives: true,
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
      //   listOptions.q = query;
      // }

      // Fetch files using the configured listOptions
      filesResponse = await drive.files.list(listOptions)

      // Append the fetched files to the files array
      files.push(...filesResponse.data.files)

      // Update nextPageToken for pagination
      nextPageToken = filesResponse.data.nextPageToken
    } catch (error) {
      logger.error(`Error fetching files:${error.message}`)
      throw error
    }
  } while (nextPageToken) // Continue fetching files while there are more pages

  return files // Return all fetched files
}

/**
 * Organizes a file into a hierarchical structure based on its parent relationships.
 * This is a recursive function that arranges files and folders in a tree-like format.
 *
 * @param {Object} file - The file object from Google Drive API.
 * @param {Map} fileMap - A map of all files where the key is the file ID.
 * @param {Array} rootItems - Array holding root-level files/folders.
 * @param {number} currentDepth - The current depth in the hierarchy (starts at 1).
 * @param {string} parentPath - The parent path for the current file.
 * @param {string} driveName - The name of the Google Drive (for display purposes).
 * @returns {Object} - The file node with updated hierarchy and path information.
 */
const organizeFileInHierarchy = (file, fileMap, rootItems, currentDepth, parentPath, driveName) => {
  // Full path is built based on the current file's name and parent path
  const fullPath = currentDepth === 1 && parentPath === '' ? `${driveName}/${file.name}` : `${parentPath}/${file.name}`

  // Create a file node with its depth, type (folder/file), path, and children
  const fileNode = {
    ...fileMap.get(file.id), // Retrieve the file from the map
    depth: currentDepth, // Assign the current depth level
    type: file.mimeType.includes('application/vnd.google-apps.folder') ? 'folder' : 'file', // Determine if it's a folder
    path: fullPath, // Assign the full path
    lastModified: file.modifiedTime,
    parentId: file.parents && file.parents.length > 0 ? file.parents[0] : null, // Assign parent ID if it exists
    children: [], // Initialize empty children array (to be filled recursively)
  }

  // If the file has a parent, try to attach it to its parent node
  if (file.parents && file.parents.length > 0) {
    const parentId = file.parents[0]

    const parent = fileMap.get(parentId) // Retrieve parent file from map
    if (parent) {
      // Avoid duplicates by checking if the file is already added to its parent
      if (!parent.children.some((child) => child.id === file.id)) {
        parent.children.push(fileNode) // Add the file as a child of its parent
      }
    } else {
      // If the parent is not found, treat the file as a root-level item
      if (!rootItems.some((rootItem) => rootItem.id === file.id)) {
        rootItems.push(fileNode)
      }
    }
  } else {
    // Handle root-level files (files without parents)
    if (!rootItems.some((rootItem) => rootItem.id === file.id)) {
      rootItems.push(fileNode)
    }
  }

  // If the file is a folder, recursively organize its children
  if (file.mimeType.includes('application/vnd.google-apps.folder')) {
    // Loop through each file to find its children
    for (let childFile of fileMap.values()) {
      if (childFile.parents && childFile.parents[0] === file.id) {
        const childNode = organizeFileInHierarchy(
          childFile,
          fileMap,
          rootItems,
          currentDepth + 1,
          fileNode.path,
          driveName
        )
        fileNode.children.push(childNode)
      }
    }
  }

  // Return the updated file node
  return fileNode
}

/**
 * Builds a hierarchical structure from a flat list of files.
 *
 * @param {Array} files - The flat list of files to be organized into a hierarchy.
 * @param {string} driveName - The name of the Google Drive (for labeling purposes).
 * @returns {Array} - A hierarchical tree of files and folders.
 */
const buildHierarchy = (files, driveName) => {
  const fileMap = new Map() // A map to store all files with their IDs
  const rootItems = [] // Array to store root-level items (files and folders)

  // First, add all files to the fileMap
  for (let file of files) {
    fileMap.set(file.id, { ...file, children: [] }) // Initialize each file with an empty children array
  }

  // Then, organize files based on their parent relationships
  for (let file of files) {
    organizeFileInHierarchy(file, fileMap, rootItems, 1, '', driveName)
  }

  return rootItems // Return the fully built hierarchy
}

/**
 * Fetches files from a Google Drive (shared or personal) and builds a hierarchical structure.
 *
 * @param {Object} drive - The authenticated Google Drive instance.
 * @param {string} driveName - The name of the Google Drive.
 * @param {boolean} isSharedDrive - Boolean indicating whether this is a shared drive.
 * @param {string} rootFolderId - The ID of the root folder or shared drive.
 * @returns {Object} - An object representing the drive and its file hierarchy.
 */
const fetchAndBuildDriveFiles = async (drive, driveName, isSharedDrive, rootFolderId = '') => {
  let owners = ['testadmin@pvp-test-domain2.com']
  const files = await fetchFilesFromDrive(drive, isSharedDrive ? rootFolderId : null)

  // Initialize counters for total size, file count, and folder count
  let totalSize = 0
  let fileCount = 0
  let folderCount = 0

  // Array to hold file storage breakdown
  const storageBreakdown = []

  // Iterate over files to calculate total size, file count, and folder count
  files.forEach((file) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      folderCount += 1 // Increment folder count if it's a folder
    } else {
      fileCount += 1 // Increment file count if it's a file
      const fileSize = parseInt(file.size, 10) || 0
      totalSize += fileSize // Add file size

      // Add to storage breakdown array for sorting later
      storageBreakdown.push({
        name: file.name,
        size: fileSize,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink, // Link to file for easy reference
      })
    }
  })

  // Sort storage breakdown by size in descending order
  storageBreakdown.sort((a, b) => b.size - a.size)

  // Build the hierarchical structure for the fetched files
  const children = buildHierarchy(files, rootFolderId, driveName)

  const driveId = rootFolderId

  // Construct the result object
  const result = {
    driveName, // Name of the drive
    depth: 0, // Root of the drive has depth 0
    path: driveName, // Root path is the drive's name
    children, // Hierarchical structure of files and folders
    totalSize, // Total size of files in bytes
    fileCount, // Total number of files
    folderCount, // Total number of folders
    storageBreakdown, // List of files sorted by size (largest first)
  }

  // Include driveId if it's a shared drive
  if (isSharedDrive) {
    result.driveId = driveId
  }

  return result
}

/**
 * Fetches all shared drives and their files, building a hierarchical structure for each drive.
 *
 * @returns {Promise<Array>} - A promise that resolves to an array of shared drives with their file hierarchies.
 */
const fetchSharedDrivesFiles = async (
  userEmail,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  driveId = null,
  trashed = null,
  owners = []
) => {
  try {
    // const drive = await getDriveInstance(config.SUPER_ADMIN_EMAIL);
    const drive = await getDriveInstance(userEmail, serviceAccountEmail, serviceAccountPrivateKey) // Get Google Drive instance as super admin
    // Get Google Drive instance as super admin
    const drivesResponse = await drive.drives.list() // Fetch all shared drives
    const sharedDrives = drivesResponse.data.drives || [] // Fallback to an empty array if no drives are found
    const sharedDrivesWithFiles = [] // Array to store drives and their files
    logger.info(JSON.stringify(sharedDrives, null, 2))
    // let filters = {
    //   trashed: false,
    // };
    if (driveId) {
      logger.info('Drive Id filter applied')
      const driveFiles = await fetchAndBuildDriveFiles(drive, 'DRIVE-NAME', true, driveId, '', trashed, owners)
      sharedDrivesWithFiles.push(driveFiles) // Add the built hierarchy to the array
      return sharedDrivesWithFiles
    }

    for (const sharedDrive of sharedDrives) {
      // Fetch and build the hierarchy for each shared drive
      const driveFiles = await fetchAndBuildDriveFiles(
        drive,
        sharedDrive.name,
        true,
        sharedDrive.id,
        '',
        trashed,
        owners
      )
      sharedDrivesWithFiles.push(driveFiles) // Add the built hierarchy to the array
    }

    return sharedDrivesWithFiles // Return the array of shared drives with their file structures
  } catch (error) {
    // Log any errors that occur while fetching shared drives
    logger.error(`Error fetching shared drives and their file metadata:${error.message}`)
    throw error
  }
}

// Helper function to fetch a list of all the users in the domain
const fetchUsersList = async (adminEmail, serviceAccountEmail, serviceAccountPrivateKey) => {
  let usersEmailsList = await axios.post(
    `${API_BASE_URL}/users/users-list`,
    {
      userEmail: adminEmail,
      serviceAccountEmail: serviceAccountEmail,
      serviceAccountPrivateKey: serviceAccountPrivateKey,
    },
    {
      withCredentials: true, // Include session cookies
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  const emailList = extractEmails(usersEmailsList.data)

  return emailList
}

/**
 * Fetches all personal drives and their files, building a hierarchical structure for each user.
 *
 * @returns {Promise<Array>} - A promise that resolves to an array of personal drives with their file hierarchies.
 */
const fetchPersonalDriveFiles = async (adminEmail, serviceAccountEmail, serviceAccountPrivateKey) => {
  try {
    let emailList = await fetchUsersList(adminEmail, serviceAccountEmail, serviceAccountPrivateKey)
    logger.info('Fetched Users')
    const personalDrivesWithFiles = [] // Array to store personal drives and their files
    logger.info(emailList)
    for (const email of emailList) {
      try {
        const drive = await getDriveInstance(email, serviceAccountEmail, serviceAccountPrivateKey)
        // Fetch and build the hierarchy for each user
        const driveFiles = await fetchAndBuildDriveFiles(drive, config.PERSONAL_DRIVE, false, '')
        personalDrivesWithFiles.push(driveFiles) // Add the built hierarchy to the array
      } catch (error) {
        // Log any errors that occur while processing a specific user's drive
        logger.error(`Failed to process email ${email}: ${error.message}`)
      }
    }
    logger.debug(JSON.stringify(personalDrivesWithFiles, null, 2), {
      storeLocation: 'file',
    })
    return personalDrivesWithFiles // Return the array of personal drives with their file structures
  } catch (error) {
    // Log any errors that occur while fetching personal drives
    logger.error(`Error fetching personal drive files and their metadata:${error.message}`)
    throw error
  }
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
    fields: '*', // We can specify specific fields you want to retrieve, or files(name) for all fields
  })

  // Return the file's metadata.
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
    logger.error(`Error fetching items shared with user:${error}`)
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
  fetchUsersList,
  fetchSharedDrivesFiles,
  fetchPersonalDriveFiles,
  fetchFilesDetailsData,
  fetchItemsSharedWithUser,
  getPermissions,
}

// fetch just the names of the shared drives - 1 API call, store in cache
// fetch list of all the users in the domain - 1 API call, store in cache

// have a search functionality for shared drive list popup - fetch from cache
// have a search functionality for user list popup - fetch from cache

// when the user selects a specific shared drive / personal drive of a user and clicks on search, fetch the full hierarchy
// 'n' API call where n -> no. of nextPageTokens

/*

Structure of individual item 

key: item ID
Value: JSON
{
  parentId: "0AOv92gz8GfyoUk9PVA"
  id: "1B_EBXvREdXFmydWCI6mPN",
  name: "Zaffy Doc",
  // LIT, isStoredIn: "my-drive-a.mason@pvp.co.jp",   // if shared drive then name of the shared drive
  type: "document",
  owner: "dev@zaffy.pvp.co.jp",
  // LIT, sharedExternally: "no",
  trashed: "false",
  // LIT, sharedWith: ['a.mason@', 'sap@', 'raj@'],
  // LIT, linkSharing: "domain restricted / anyone with link / specific group",
  // LIT, fileSize: "37 KB",
  // CD, pathToRootFolder: "my-drive-a.mason@pvp.co.jp/Projects/Documentation/Zaffy Doc",
  // CD, depth: 2,
  // CD, itemsContainedInside: 0,   // since it's a file
  lastModified: "2024-08-21T05:28:20.356Z"
}

LIT - Look into this, can't fetch it 
CD - Custom data
*/
