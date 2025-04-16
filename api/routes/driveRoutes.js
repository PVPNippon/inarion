/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const express = require('express')
const router = express.Router()
const driveController = require('../controllers/driveController')
const { encryptResponseMiddleware } = require('../controllers/crypto/cryptoMiddleware')
const cacheMiddleware = require('../middleware/cacheMiddleware')

// Route to list all Shared Drives
router.get(
  '/shared-drives',
  cacheMiddleware.fetchSharedDrivesFromCache,
  driveController.fetchSharedDrives,
  cacheMiddleware.storeSharedDrivesInCache,
  encryptResponseMiddleware
)

// Route to list all users in the domain
router.get(
  '/users',
  cacheMiddleware.fetchUsersFromCache,
  driveController.fetchUsersFromAdminDirectory,
  cacheMiddleware.storeUsersInCache,
  encryptResponseMiddleware
)

// MEGA FETCH FUNCTION
// Route to list all Google Drive files (MyDrive and SharedDrives)
router.get(
  '/all-drives',
  cacheMiddleware.fetchDriveDataFromCache,
  driveController.fetchAllDrives,
  cacheMiddleware.storeDriveDataInCache,
  encryptResponseMiddleware
)

// LIVE DATA FETCH FUNCTION
// Route to to fetch drive files as per the filters provided by the user
router.get(
  '/filters',
  cacheMiddleware.fetchFilteredFilesFromCache,
  driveController.fetchFilteredFiles,
  cacheMiddleware.storeFilteredFilesFromCache,
  encryptResponseMiddleware
)

// Route to build and display a nested structure of an individual drive (MyDrive or SharedDrives)
router.get(
  '/drive-structure',
  cacheMiddleware.fetchEntireDriveStructureFromCache,
  driveController.fetchEntireDriveStructureFromDrive,
  cacheMiddleware.storeEntireDriveStructureInCache,
  encryptResponseMiddleware
)

// Route to build and display a direct path from the item to the root folder (MyDrive or SharedDrives)
router.get(
  '/direct-path',
  cacheMiddleware.fetchDirectPathToRootFolderFromCache,
  driveController.fetchDirectPathToRootFolderFromDriveOrReports,
  cacheMiddleware.storeDirectPathToRootFolderInCache,
  encryptResponseMiddleware
)

module.exports = router
