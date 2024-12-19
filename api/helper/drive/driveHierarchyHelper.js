const config = require('../../config/config.js')
const { getMimeTypeOrKey } = require('./mimeType.js')
const logger = require('../../logger/logger.js')(__filename, 'Drive Hierarchy Helper')

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

module.exports = { structureDriveFiles }
