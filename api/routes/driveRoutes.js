const express = require('express');
const router = express.Router();
const driveController = require('../controllers/driveController');

// Route to list Google Drive files
router.get('/list', driveController.listFiles);
router.post('/list-files', driveController.listDriveFiles);
router.post('/file/:fileId', driveController.getFileDetails);


// Route to get settings for a specific file
router.get('/file-settings/:fileId', driveController.getFileSettingsById);

// Route to fetch all shared drives name 
router.post('/shared-drives', driveController.getSharedDrives);
// Route to fetch all files in personal drives
router.post('/personal-drives', driveController.getPersonalDriveFiles);
module.exports = router;
