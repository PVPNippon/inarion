const express = require('express');
const router = express.Router();
const cacheController = require('../controllers/cacheController');

// Route to store values in Redis
router.post('/set', cacheController.setCache);
router.post('/store-json', cacheController.storeJsonData);
router.post('/store-drive-data', cacheController.storeDriveList);
router.post('/store-drive-list', cacheController.storeDriveData);

// Route to fetch values in Redis
router.get('/get', cacheController.getCache);

// example - "localhost:4000/cache/fetch-json?driveName=shared-drive-drive-test"
// key = driveName
// value = shared-drive-drive-test
router.get('/fetch-json', cacheController.fetchJsonData);

// example - "localhost:4000/cache/fetch-drive-data?key=shared-drive-drive-test"
// key = key
// value = shared-drive-drive-test
router.get('/fetch-drive-data', cacheController.fetchDriveData);

// example - "localhost:4000/cache/fetch-drive-list?key=shared-drives"
// key = key
// value = shared-drives
router.get('/fetch-drive-list', cacheController.fetchDriveList);

router.get('/scan', cacheController.scanKeys);
router.get('/delete-cache', cacheController.deleteCache);

module.exports = router; 