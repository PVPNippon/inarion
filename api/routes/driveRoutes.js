const express = require('express');
const router = express.Router();
const driveController = require('../controllers/driveController');

// Route to fetch all shared drives name 
router.get('/shared-drives', driveController.getSharedDrives);
// Route to fetch all files in personal drives
router.get('/personal-drives', driveController.getPersonalDriveFiles);

module.exports = router;