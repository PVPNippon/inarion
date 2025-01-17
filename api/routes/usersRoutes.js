const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')
// Currently, encryption/decryption is turned on/off in .env
const { encryptResponseMiddleware, decryptRequestMiddleware } = require('../controllers/crypto/cryptoMiddleware')
// TODO(m.okamoto): Will be introduced in the future when a cache service for users is created.

// route to list all users in customer organization
router.get('/', usersController.listAllUsers)

// decryptRequestMiddleware is not applicable to GET requests, so GET requests should be written above this.
router.use(decryptRequestMiddleware)

// Route to turn off 2sv for multiple users
router.post('/2sv-off', usersController.turnOffTwoSVForUsers)

router.use(encryptResponseMiddleware)

module.exports = router
