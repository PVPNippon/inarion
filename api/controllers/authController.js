const oauth2Client = require('../models/googleAuth') // Google OAuth2 client setup
const config = require('../config/config') // Configuration settings
const User = require('../models/User') // User model for database operations
const logger = require('../logger/logger')(__filename, 'Authentication')

exports.logout = async (req, res) => {
  try {
    const token = oauth2Client.credentials.access_token

    if (token) {
      // Revoke the token
      await oauth2Client.revokeToken(token)
      logger.debug('Token revoked successfully')
    }

    // Clear the session or cookies
    req.session = null // If using express-session
    res.clearCookie('connect.sid') // Adjust based on your cookie/session setup

    // Send a success response
    res.status(200).send({ message: 'Logged out successfully' })
  } catch (error) {
    logger.error(error)
    res.status(500).send({ message: 'Failed to logout' })
  }
}
