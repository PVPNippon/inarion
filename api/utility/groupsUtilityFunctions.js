const { google } = require('googleapis')

/**
 * Decodes the base64-encoded privateKeyData and parses it as JSON.
 *
 * @param {string} privateKeyData - The base64-encoded private key data.
 * @returns {Object} - The decoded and parsed JSON object containing the credentials.
 */
function decodePrivateKeyData(privateKeyData) {
  const decodedData = Buffer.from(privateKeyData, 'base64').toString('utf8')
  return JSON.parse(decodedData)
}

/**
 * Creates a new JWT client, specifying the user to impersonate, and authorizes it.
 *
 * The client is authorized with the scopes required to read the user's groups and
 * the user's audit logs.
 *
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} privateKey - The private key of the service account.
 * @param {string} userEmail - The email address of the user to impersonate.
 * @returns {Promise<Object>} - A promise that resolves to the authorized client.
 */
async function getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail) {
  const keyData = decodePrivateKeyData(serviceAccountPrivateKey) // Decode the private key
  const privateKey = keyData.private_key // Extract the private key
  // Create a new JWT client, specifying the user to impersonate
  const jwtClient = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.group',
      'https://www.googleapis.com/auth/admin.reports.audit.readonly',
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
    ],
    subject: userEmail, // Impersonating this user
  })

  // Authorize the client
  await jwtClient.authorize()

  return jwtClient
}

module.exports = {
  getClient,
}
