/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const config = require('../../config/config.js')
const { fetchFileMetadata } = require('../../services/driveService.js')
const { getMimeTypeOrKey } = require('./mimeType.js')
const logger = require('../../logger/logger.js')(__filename, 'Drive Hierarchy Helper')

// [OLD]
const structureDriveFiles = async (driveFiles, driveName, driveId = null) => {
  try {
    let { totalSize, fileCount, folderCount, storageBreakdown } = await calculateStorageStats(driveFiles)

    const children = await buildHierarchy(driveFiles, driveName)

    const result = {
      driveName, // Name of the drive
      totalSize, // Total size of files in bytes
      fileCount, // Total number of files
      folderCount, // Total number of folders
      storageBreakdown, // List of files sorted by size (largest first)
      children, // Hierarchical structure of files and folders
    }

    // Include driveId if it's a shared drive
    if (driveId) {
      result.driveId = driveId
    }

    return result
  } catch (error) {
    logger.debug('error in fetch and build drive files', error)
  }
}

const calculateStorageStats = async (files) => {
  let totalSize = 0
  let fileCount = 0
  let folderCount = 0
  const storageBreakdown = []
  for (let file of files) {
    if (file.mimeType === getMimeTypeOrKey('folder')) {
      folderCount++
    } else {
      const size = parseInt(file.size, 10) || 0
      totalSize += size
      fileCount++
      storageBreakdown.push({ name: file.name, size, mimeType: file.mimeType, webViewLink: file.webViewLink })
    }
  }
  storageBreakdown.sort((a, b) => b.size - a.size)
  return { totalSize, fileCount, folderCount, storageBreakdown }
}

const buildHierarchy = async (files, driveName) => {
  const fileMap = new Map() // A map to store all files with their IDs
  const rootItems = [] // Array to store root-level items (files and folders)

  for (let file of files) {
    // Initialize each file with an empty children array
    fileMap.set(file.id, { ...file, children: [] })
  }

  // Then, organize files based on their parent relationships
  for (let file of files) {
    await organizeFileInHierarchy(file, fileMap, rootItems, Number(config.INITIAL_DEPTH), '', driveName)
  }

  return rootItems // Return the fully built hierarchy
}

const organizeFileInHierarchy = async (file, fileMap, rootItems, currentDepth, parentPath, driveName) => {
  // Full path is built based on the current file's name and parent path
  const fullPath = currentDepth === 1 && parentPath === '' ? `${driveName}/${file.name}` : `${parentPath}/${file.name}` // Create a file node with its depth, type (folder/file), path, and children
  const fileNode = {
    ...fileMap.get(file.id), // Retrieve the file from the map
    depth: currentDepth, // Assign the current depth level
    type: getMimeTypeOrKey(file.mimeType) === 'folder' ? 'folder' : 'file', // Determine if it's a folder
    path: fullPath, // Assign the full path
    lastModified: file.modifiedTime,
    parentId: file.parents && file.parents.length > 0 ? file.parents[0] : null, // Assign parent ID if it exists
    children: [], // Initialize empty children array (to be filled recursively)
  } // If the file has a parent, try to attach it to its parent node

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
  } // If the file is a folder, recursively organize its children

  if (file.mimeType === getMimeTypeOrKey('folder')) {
    // Loop through each file to find its children
    for (let childFile of fileMap.values()) {
      if (childFile.parents && childFile.parents[0] === file.id) {
        const childNode = await organizeFileInHierarchy(
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
  } // Return the updated file node

  return fileNode
}

// [NEW]
/**
 * Builds a hierarchical representation of files and folders in a drive.
 *
 * @param {Array<Object>} files - List of files and folders retrieved from Google Drive API
 * @param {string} driveName - Name of the drive to associate with the structure
 *
 * @returns {Object} - Object containing the root-level hierarchy and total file count
 */
const buildDriveHierarchy = (files, driveName) => {
  const fileMap = new Map() // A map to store all files with their IDs
  const rootItems = [] // Array to store root-level items (files and folders)
  let fileCount = 0

  // Build the initial file map with empty children arrays
  for (const file of files) {
    fileMap.set(file.id, { ...file, children: [] })
  }

  fileCount = fileMap.size

  // Build parent-child relationships
  for (const file of files) {
    const parentId = file.parents && file.parents.length > 0 ? file.parents[0] : null

    const fileNode = {
      ...fileMap.get(file.id),
      type: getMimeTypeOrKey(file.mimeType) === 'folder' ? 'folder' : 'file',
      path: '',
      depth: 0, // Depth will be calculated later
    }

    if (parentId && fileMap.has(parentId)) {
      const parent = fileMap.get(parentId)
      parent.children.push(fileNode)
    } else {
      // Add root-level files
      rootItems.push(fileNode)
    }
  }

  assignPathsAndDepth(rootItems, 1, '', driveName)

  return { children: rootItems, fileCount }
}

/**
 * Fetches and constructs a structured drive hierarchy along with the file count.
 *
 * @param {Array<Object>} driveFiles - List of files and folders retrieved from Google Drive API
 * @param {string} driveName - Name of the drive
 * @param {string|null} [driveId=null] - The shared drive ID (if applicable)
 *
 * @returns {Object} - Object containing the drive structure and total file count
 */
const fetchStructuredDriveFilesAndFileCount = async (driveFiles, driveName, driveId = null) => {
  try {
    const { children, fileCount } = buildDriveHierarchy(driveFiles, driveName)

    const driveStructure = {
      driveName, // Name of the drive
      children, // Hierarchical structure of files and folders
    }

    // Include driveId if it's a shared drive and create a unique key for the file count
    if (driveId) {
      driveStructure.driveId = driveId
    }

    return { driveStructure: children, fileCount }
  } catch (error) {
    logger.debug('Error in fetching and building drive files:', error.message)
    throw error
  }
}

/**
 * Recursively assigns paths and depth levels to nodes in a hierarchical file structure.
 *
 * @param {Array<Object>} nodes - The root-level nodes (files/folders)
 * @param {number} currentDepth - Current depth level in the hierarchy
 * @param {string} parentPath - Path of the parent node
 * @param {string} driveName - Name of the drive to prepend to the path
 */
const assignPathsAndDepth = (nodes, currentDepth, parentPath, driveName) => {
  for (const node of nodes) {
    node.depth = currentDepth
    node.path = currentDepth === 1 && !parentPath ? `${driveName}/${node.name}` : `${parentPath}/${node.name}`
    if (node.children.length > 0) {
      assignPathsAndDepth(node.children, currentDepth + 1, node.path, driveName)
    }
  }
}

/**
 * Recursively constructs the direct path from an item to the root folder.
 *
 * @param {string} adminEmail - The admin email for impersonation
 * @param {string} owner - The owner of the file (email or shared drive)
 * @param {string} itemId - The ID of the file or folder
 *
 * @returns {Array<Object>} - Array representing the direct path from the file to the root
 */
async function constructDirectPath(adminEmail, owner, itemId) {
  let path = []

  try {
    // Fetch metadata of the current file or folder
    const userEmail = owner.includes('@') ? owner : adminEmail
    const fileMetadata = await fetchFileMetadata({ adminEmail, userEmail, itemId })
    const { id, name, parents, sharedDriveName } = fileMetadata

    // Determine the display name
    let displayName = name
    if (name === 'My Drive' && (!parents || parents.length === 0)) {
      displayName = owner // Replace "My Drive" with the owner's email for root folder
    } else if (name === 'Drive' && (!parents || parents.length === 0)) {
      displayName = sharedDriveName // Replace "Drive" with shared drive name for root folder
    }

    // Add the current file/folder to the path
    path.push({ id, name: displayName })

    // Recur if there's a parent
    if (parents && parents.length > 0) {
      const parentPath = await constructDirectPath(adminEmail, owner, parents[0])
      path = [...parentPath, ...path]
    }
  } catch (error) {
    logger.error(`Error traversing path for item ID ${itemId}:`, error.message)
    throw error
  }

  return path
}

/**
 * Fetches and constructs the direct path from a file/folder to the root.
 *
 * @param {string} adminEmail - The admin email for impersonation
 * @param {string} owner - The owner of the file (email or shared drive)
 * @param {string} itemId - The ID of the file or folder
 *
 * @returns {Array<Object>} - Array representing the direct path from the file to the root
 */
async function fetchConstructDirectPath(adminEmail, owner, itemId) {
  try {
    // Start recursion from the current item
    return await constructDirectPath(adminEmail, owner, itemId)
  } catch (error) {
    logger.error('Error constructing direct path:', error.message)
    throw error
  }
}

module.exports = { structureDriveFiles, fetchStructuredDriveFilesAndFileCount, fetchConstructDirectPath }
