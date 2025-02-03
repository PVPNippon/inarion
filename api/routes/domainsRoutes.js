const express = require('express')
const router = express.Router()
const domainsController = require('../controllers/domainsController')
const domainsCacheMiddleware = require('../middleware/domainsCacheMiddleware')
const { encryptResponseMiddleware, decryptRequestMiddleware } = require('../controllers/crypto/cryptoMiddleware')
// TODO(m.okamoto): Will be introduced in the future when a cache service for domains is created.

router.use(decryptRequestMiddleware)

// Route to list all domains in customer organization
router.get(
  '/',
  domainsCacheMiddleware.retrieveAllDomains,
  domainsController.listAllDomains,
  domainsCacheMiddleware.storeAllDomains
)

router.use(encryptResponseMiddleware)

module.exports = router
