const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')
// Currently, encryption/decryption is turned on/off in .env
const { encryptResponseMiddleware, decryptRequestMiddleware } = require('../controllers/crypto/cryptoMiddleware')
// TODO(m.okamoto): Will be introduced in the future when a cache service for users is created.

// route to list all users in customer organization
// According to decryptRequestMiddleware, it seems that it is not possible to decrypt a GET request.
router.get('/', usersController.listAllUsers, encryptResponseMiddleware)

module.exports = router
