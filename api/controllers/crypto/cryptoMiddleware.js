/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const { aesEncrypt, aesDecrypt } = require('./aes')
const { rsaEncrypt, rsaDecrypt } = require('./rsa')
const axios = require('axios')
const { clientPrivateKey } = require('../../utility/keys')
const CryptoJS = require('crypto-js')
const logger = require('../../logger/logger')(__filename, 'Crypto Middleware')

const isCryptoEnabled = () => process.env.CRYPTO !== 'DISABLE'

function generateAESKeyAndIV() {
  /**
   * Generates a random 256-bit AES key and a 16-byte IV.
   * Both the AES key and IV are returned as base64-encoded strings.
   * @returns {Object} An object with two properties: key and iv.
   * @property {string} key - A 256-bit AES key as a base64-encoded string.
   * @property {string} iv - A 16-byte IV as a base64-encoded string.
   */
  return {
    key: CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64), // 256-bit AES key
    iv: CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Base64), // 16-byte IV
  }
}

/**
 * Helper function that decrypts a payload that was encrypted
 * with a randomly generated AES key and IV.
 * The AES key and IV were encrypted with the client's RSA public key.
 * The encrypted AES key, encrypted IV, and payload are passed in as parameters.
 * If decryption succeeds, the decrypted payload is returned. If decryption fails,
 * an error is thrown.
 * @param {string} encryptedAESKey - The encrypted AES key as a base64-encoded string.
 * @param {string} encryptedIV - The encrypted IV as a base64-encoded string.
 * @param {string} payload - The encrypted payload as a base64-encoded string.
 * @returns {string} The decrypted payload as a UTF-8 string.
 * @throws {Error} If decryption fails.
 */
async function decryptPayload(encryptedAESKey, encryptedIV, payload) {
  try {
    // Input validation
    if (!encryptedAESKey || !encryptedIV || !payload) {
      throw new Error('Invalid input. Expected encryptedAESKey, encryptedIV, and payload.')
    }

    // Decrypt AES key and IV using RSA
    const aesKey = await rsaDecrypt(encryptedAESKey, clientPrivateKey)
    const iv = await rsaDecrypt(encryptedIV, clientPrivateKey)

    // Decrypt payload using AES
    const decryptedPayload = await aesDecrypt(payload, aesKey, iv)

    // Validate decrypted payload
    if (!decryptedPayload || typeof decryptedPayload !== 'string') {
      throw new Error('Invalid decrypted payload. Expected a string.')
    }

    return decryptedPayload
  } catch (error) {
    // Log error and rethrow
    logger.error(error)
    throw error
  }
}

/**
 * Encrypts the given data for the client. The data is first encrypted with AES,
 * using a randomly generated key and initialization vector (IV). The AES key
 * and IV are then encrypted with the server's RSA public key. The encrypted
 * response is then sent back to the client.
 *
 * @param {string} data - The data to be encrypted.
 * @returns {Promise<Object>} An object with three properties: encryptedAESKey,
 *   encryptedIV, and payload. The payload is the encrypted data, and the
 *   encryptedAESKey and encryptedIV are the encrypted AES key and IV,
 *   respectively.
 * @throws {Error} If encryption fails at any step.
 */

/**
 * Helper function to encrypt given data. The data is first encrypted with AES,
 * using a randomly generated key and initialization vector (IV). The AES key
 * and IV are then encrypted with the server's RSA public key. The encrypted
 * response is then sent back to the client.
 *
 * @param {string} data - The data to be encrypted.
 * @returns {Promise<Object>} An object with three properties: encryptedAESKey,
 *   encryptedIV, and payload. The payload is the encrypted data, and the
 *   encryptedAESKey and encryptedIV are the encrypted AES key and IV,
 *   respectively.
 * @throws {Error} If encryption fails at any step.
 */
async function encryptPayload(data) {
  try {
    // Input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid input data. Expected an object.')
    }

    // Step 1: Generate AES Key and IV
    const { key: aesKey, iv } = generateAESKeyAndIV()

    // Step 2: Encrypt the payload with AES
    const encryptedPayload = aesEncrypt(JSON.stringify(data), aesKey, iv)

    // Step 3: Retrieve the server's public key
    const publicKeyResponse = await axios.get('http://localhost:4000/encryption/server-public-key')
    const publicKey = publicKeyResponse.data.serverPublicKey

    // Input validation
    if (!publicKey || typeof publicKey !== 'string') {
      throw new Error('Invalid server public key. Expected a string.')
    }

    // Step 4: Encrypt AES Key and IV with RSA
    const encryptedAESKey = rsaEncrypt(aesKey, publicKey)
    const encryptedIV = rsaEncrypt(iv, publicKey)

    // Return the encrypted payload and keys
    return {
      encryptedAESKey,
      encryptedIV,
      payload: encryptedPayload,
    }
  } catch (error) {
    // Log the error and return a generic error message
    logger.error(error)
    throw new Error('Encryption failed. Please try again.')
  }
}

/**
 * Decrypts the request body of an incoming request, using the provided encryptedAESKey, encryptedIV, and payload.
 * If decryption succeeds, the decrypted payload is stored in req.body. If decryption fails, an error response is sent.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 * @throws {Error} If decryption fails.
 */
const decryptRequestMiddleware = async (req, res, next) => {
  try {
    if (!isCryptoEnabled()) {
      logger.debug('Crypto is disabled; bypassing decryption.')
      next()
    } else {
      console.log('Incoming request is encrypted. Decrypting..')
      if (!req.body || !req.body.encryptedAESKey || !req.body.encryptedIV || !req.body.payload) {
        throw new Error('Invalid request body. Expected encryptedAESKey, encryptedIV, and payload.')
      }

      const { encryptedAESKey, encryptedIV, payload } = req.body

      // Decrypt payload
      const decryptedPayload = await decryptPayload(encryptedAESKey, encryptedIV, payload)

      // Validate decrypted payload
      if (!decryptedPayload || typeof decryptedPayload !== 'string') {
        throw new Error('Invalid decrypted payload. Expected a string.')
      }

      // Parse decrypted payload
      try {
        req.body = JSON.parse(decryptedPayload)
      } catch (jsonError) {
        throw new Error('Invalid JSON payload.', jsonError)
      }
      next()
    }
    // Input validation
  } catch (error) {
    // Log error and return a standardized error response
    logger.error(error)
    res.status(400).json({
      error: 'INVALID_ENCRYPTED_PAYLOAD',
      message: 'Invalid encrypted payload.',
      details: error.message,
    })
  }
}

/**
 * Encrypts the response sent to the client. This middleware function is
 * expected to be used in an Express.js route handler.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - Returns a promise that resolves when the response
 *   has been sent.
 * @throws {Error} - Throws an error if encryption fails.
 */
const encryptResponseMiddleware = async (req, res) => {
  try {
    const statusCode = res.locals.statusCode ?? 200
    const data = res.locals.data

    if (!isCryptoEnabled()) {
      logger.debug('Crypto is set to disabled, sending plaintext response.')
      // Send plaintext response when crypto is disabled
      return res.status(statusCode).json(data)
    }
    // Input validation
    if (!data) {
      throw new Error('Invalid response data. Expected res.locals.data to be set.')
    }

    // Call the separate encryption function
    const encryptedResponse = await encryptPayload(data)

    // Validate encrypted response
    if (!encryptedResponse || typeof encryptedResponse !== 'object') {
      throw new Error('Invalid encrypted response. Expected an object.')
    }

    // Send the encrypted response
    return res.status(statusCode).json(encryptedResponse)
  } catch (error) {
    // Log error and return a standardized error response
    logger.error(error)
    return res.status(500).json({
      error: 'ENCRYPTION_FAILED',
      message: 'Failed to encrypt response.',
      details: error.message,
    })
  }
}

module.exports = {
  decryptRequestMiddleware,
  encryptResponseMiddleware,
}
