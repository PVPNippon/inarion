const express = require('express')
const router = express.Router()
const driveController = require('../controllers/driveController')
const { encryptResponseMiddleware } = require('../controllers/crypto/cryptoMiddleware')
// Existing routes

// Route to list Google Drive files
router.post('/file/:fileId', driveController.getFileDetails)
// Route to list all Google Drive files (MyDrive and SharedDrives)
router.post('/all-drives', driveController.getAllDrives, encryptResponseMiddleware)
// Route to check sharing information for a file or shared drive
router.get('/permissions/:id', driveController.getSharingInfo)

module.exports = router
