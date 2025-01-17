const User = require('../models/User') // User model for database operations
const oauth2Client = require('../models/googleAuth') // Custom OAuth2 client setup
const config = require('../config/config') // Configuration settings
const logger = require('../logger/logger')(__filename, 'Users')

/**
 * Retrieves user details by email.
 * @param {Object} req - The request object containing the email.
 * @param {Object} res - The response object used to send responses to the client.
 */
exports.getAdmins = async (req, res) => {
  // Extract email from the request body
  const { email } = req.body

  try {
    // Find a user by email, from the database, if exists
    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    // Return user details
    res.status(200).json(user)
  } catch (error) {
    logger.error(error)
    // Return 500 if there's an error
    res.status(500).json({ message: 'Error fetching user' })
  }
}

/**
 * Placeholder function for retrieving data from the database, not in use at the moment
 * Currently commented out and not in use.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.getData = async (req, res) => {
  try {
    // const data = await pool.query('SELECT * FROM team');
    // res.status(200).send(data.rows);
  } catch (err) {
    res.sendStatus(500)
  }
}
