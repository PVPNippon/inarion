const express = require('express')
const router = express.Router()
const driveController = require('../controllers/driveController')

// Existing routes

// Route to list Google Drive files
router.post('/file/:fileId', driveController.getFileDetails)

// Route to fetch all shared drives
// router.post('/shared-drives', driveController.getSharedDrives)

// Route to fetch all files in personal drives
// router.post('/personal-drives', driveController.getPersonalDriveFiles)
router.post('/all-drives', driveController.getAllDrives)
// Route to check sharing information for a file or shared drive
router.get('/permissions/:id', driveController.getSharingInfo)

module.exports = router
