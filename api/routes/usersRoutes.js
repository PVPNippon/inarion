const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')
const usersCacheMiddleware = require('../middleware/usersCacheMiddleware')
// Currently, encryption/decryption is turned on/off in .env
const { encryptResponseMiddleware, decryptRequestMiddleware } = require('../controllers/crypto/cryptoMiddleware')
// TODO(m.okamoto): Will be introduced in the future when a cache service for users is created.

// decryptRequestMiddleware should be transparent to all requests which do not have the body
router.use(decryptRequestMiddleware)

// route to list all users in customer organization
router.get(
  '/',
  usersCacheMiddleware.retrieveAllUsers,
  usersCacheMiddleware.retrieveFilteredUsers,
  usersController.listAllUsers,
  usersCacheMiddleware.storeAllUsers,
  usersCacheMiddleware.storeFilteredUsers
)

// Route to turn off 2sv for multiple users
router.post('/2sv-off', usersController.turnOffTwoSVForUsers)

// Route to delete multiple users
router.delete('/', usersController.deleteUsers)

// Route to list all roles assignments
router.get('/role/assignments', usersController.listRoleAssignments)

// Route to list all role names
router.get('/role/names', usersController.listRoleNames)

// Route to list all OUs in customer domain
router.get('/orgunits', usersController.listOrgUnits)

router.use(encryptResponseMiddleware)

module.exports = router
