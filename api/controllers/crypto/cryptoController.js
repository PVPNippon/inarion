/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const {
  generateAESKeyAndIV,
  aesEncrypt,
  aesDecrypt,
  rsaEncrypt,
  rsaDecrypt,
  encryptForClient,
  decryptPayloadForServer,
  decryptServerResponse,
} = require('./cryptoMiddleware')
const {
  clientPublicKey,
  serverPublicKey,
  serverPrivateKey,
  // THIS IS ONLY A TEMPORARY MEASURE, AS THE PRIVATE KEY
  // THAT THE CLIENT NEEDS IS GOPING TO BE STORED ELSEWHERE
  // AT THE MOMENT WE HAVE ONLY ONE SERVER WHERE WE STORE EVERYTHING
} = require('../../utility/keys')

// Controller for fetching client public key
exports.getClientPublicKey = (req, res) => {
  res.json({ clientPublicKey })
}

exports.getServerPrivateKey = (req, res) => {
  res.json({ serverPrivateKey })
}
// Controller for fetching server public key
exports.getServerPublicKey = (req, res) => {
  res.json({ serverPublicKey })
}

// Controller for decrypting payload for server
exports.decryptPayloadForServer = async (req, res) => {
  try {
    const { encryptedAESKey, encryptedIV, payload } = req.body
    const decryptedPayload = await decryptPayloadForServer(encryptedAESKey, encryptedIV, payload)
    res.json({ decryptedPayload })
  } catch (error) {
    console.error('Error in decryptPayloadForServer:', error.message)
    res.status(500).json({ error: 'Decryption failed', details: error.message })
  }
}

// Controller for encrypting data for the client
exports.encryptForClient = async (req, res) => {
  const { data } = req.query
  if (!data) {
    return res.status(400).json({ error: 'Data parameter is required' })
  }

  try {
    const response = await encryptForClient(data)
    res.json({ success: true, response })
  } catch (error) {
    console.error('Error in encryptForClient:', error.message)
    res.status(500).json({ error: 'Encryption failed', details: error.message })
  }
}

// Controller for decrypting server response
exports.decryptServerResponse = (req, res) => {
  try {
    const { encryptedAESKey, encryptedIV, payload } = req.body
    const decryptedPayload = decryptServerResponse(encryptedAESKey, encryptedIV, payload)
    res.json({ decryptedPayload })
  } catch (error) {
    console.error('Error in decryptServerResponse:', error.message)
    res.status(500).json({ error: 'Decryption failed', details: error.message })
  }
}
