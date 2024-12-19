const forge = require('node-forge')

/**
 * Encrypts the given data with the given public key.
 *
 * @param {string} data - The data to be encrypted.
 * @param {string} publicKeyPem - The public key in PEM format.
 * @returns {string} The Base64-encoded encrypted data.
 */
function rsaEncrypt(data, publicKeyPem) {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem)
  const encrypted = publicKey.encrypt(data, 'RSAES-PKCS1-V1_5') // Padding scheme
  return forge.util.encode64(encrypted) // Base64-encode the encrypted data
}

/**
 * Decrypts data that was encrypted with the corresponding public key.
 *
 * @param {string} encryptedData - The Base64-encoded encrypted data.
 * @param {string} privateKeyPem - The PEM-encoded private key.
 * @returns {string} The decrypted data.
 */
function rsaDecrypt(encryptedData, privateKeyPem) {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem)
  const encryptedBytes = forge.util.decode64(encryptedData) // Decode Base64
  const decrypted = privateKey.decrypt(encryptedBytes, 'RSAES-PKCS1-V1_5') // Padding scheme
  return decrypted // Return decrypted data as a string
}

module.exports = { rsaEncrypt, rsaDecrypt }
