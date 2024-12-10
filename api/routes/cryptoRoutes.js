const express = require('express')
const cryptoController = require('../controllers/crypto/cryptoController')

const router = express.Router()

// Routes
router.get('/client-public-key', cryptoController.getClientPublicKey)
router.get('/server-public-key', cryptoController.getServerPublicKey)
router.get('/server-private-key', cryptoController.getServerPrivateKey)
router.post('/decryptPayloadForServer', cryptoController.decryptPayloadForServer)
router.get('/encryptForClient', cryptoController.encryptForClient)
router.post('/decryptServerResponse', cryptoController.decryptServerResponse)

module.exports = router
