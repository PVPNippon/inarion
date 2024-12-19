const CryptoJS = require('crypto-js')

/**
 * Encrypts data using AES algorithm in CBC mode with PKCS7 padding.
 *
 * @param {string} data - The data to be encrypted as a UTF-8 string.
 * @param {string} key - The Base64-encoded AES key.
 * @param {string} iv - The Base64-encoded initialization vector.
 * @returns {string} The encrypted data as a Base64-encoded string.
 */
function aesEncrypt(data, key, iv) {
  const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Base64.parse(key), {
    iv: CryptoJS.enc.Base64.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString() // Return Base64-encoded string
}

/**
 * Decrypts data using AES algorithm in CBC mode with PKCS7 padding.
 *
 * @param {string} encryptedData - The Base64-encoded encrypted data.
 * @param {string} key - The Base64-encoded AES key.
 * @param {string} iv - The Base64-encoded initialization vector.
 * @returns {string} The decrypted data as a UTF-8 string.
 */
function aesDecrypt(encryptedData, key, iv) {
  const decrypted = CryptoJS.AES.decrypt(encryptedData, CryptoJS.enc.Base64.parse(key), {
    iv: CryptoJS.enc.Base64.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return decrypted.toString(CryptoJS.enc.Utf8) // Convert decrypted bytes to UTF-8 string
}

module.exports = { aesEncrypt, aesDecrypt }
