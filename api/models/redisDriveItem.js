const config = require('../config/config.js')

/**
 * Determines the general access type of a file.
 *
 * @param {Array} permissions - The permissions array from the file object.
 * @returns {string} - The general access type ('anyone', 'domain', or 'restricted').
 */
const determineGeneralAccessType = (permissions) => {
  if (!permissions || permissions.length === 0) return 'restricted'

  for (const permission of permissions) {
    if (permission.type === 'anyone') return 'anyone'
    if (permission.type === 'domain') return 'domain'
  }

  return 'restricted'
}

/**
 * Checks if a file is shared externally.
 *
 * @param {Array} permissions - The permissions array from the file object.
 * @returns {string} - 'true' if shared externally, otherwise 'false'.
 */
const isSharedExternally = (permissions) => {
  if (!permissions || permissions.length === 0) return 'false'

  return permissions.some(
    (permission) =>
      permission.type === 'anyone' ||
      (permission.emailAddress && !permission.emailAddress.endsWith(`@${config.DOMAIN_TEST}`))
  )
    ? 'true'
    : 'false'
}

/**
 * Extracts shared-with details from permissions.
 *
 * @param {Array} permissions - The permissions array from the file object.
 * @returns {Array|String} - An array of shared-with details or 'N/A' if none exist.
 */
const getSharedWithDetails = (permissions) => {
  if (!permissions || permissions.length === 0) return 'N/A'

  return permissions
    .filter((perm) => perm.emailAddress)
    .map((perm) => ({
      email: perm.emailAddress,
      role: perm.role,
    }))
}

/**
 * Populates the data model with values from a given JSON object.
 *
 * @param {Object} jsonObject - The source JSON object.
 * @returns {Object} - The populated data model.
 */
const populateDataModel = (jsonObject) => {
  const permissions = jsonObject.permissions
  return {
    linkSharing: jsonObject.linkShareMetadata?.visibility || 'N/A', // TODO
    fileSize: jsonObject.size || 'N/A', // TODO
    deleted: 'false', // TODO
    parentId: jsonObject.parentId || 'N/A',
    id: jsonObject.id || 'N/A',
    name: jsonObject.name || 'N/A',
    type: jsonObject.mimeType?.includes('folder') ? 'folder' : 'file',
    owner: jsonObject.owners?.[0]?.emailAddress || jsonObject.driveId,
    trashed: jsonObject.trashed ? 'true' : 'false',

    generalAccessType: determineGeneralAccessType(permissions),
    sharedExternally: isSharedExternally(permissions),
    sharedWith: getSharedWithDetails(permissions),

    pathToRootFolder: jsonObject.path || 'N/A',
    depth: jsonObject.depth || 'N/A',
    lastModified: jsonObject.modifiedTime || 'N/A',
  }
}

module.exports = populateDataModel
