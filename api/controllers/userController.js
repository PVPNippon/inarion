const User = require('../models/User') // User model for database operations
const oauth2Client = require('../models/googleAuth') // Custom OAuth2 client setup
const config = require('../config/config') // Configuration settings
const logger = require('../logger/logger')(__filename, 'Users')

/**
 * Generates an authentication URL for Google OAuth2.
 * @param {string} email - The email address of the user.
 * @param {string} projectName - The name of the project.
 * @returns {string} - The generated authentication URL.
 */
const getAuthUrl = (email, projectName) => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    // prompt: 'consent',
    scope: config.SCOPES,
    state: JSON.stringify({ email, projectName }),
    redirect_uri: config.REDIRECT_URI,
  })

  // return oauth2Client.generateAuthUrl({
  //   access_type: 'offline',
  //   // prompt: 'consent',
  //   // scope: config.SCOPES,
  //   state: JSON.stringify({ email, projectName }),
  //   redirect_uri: config.REDIRECT_URI
  // });
}

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

/**
 * Registers a new user or updates an existing user's project.
 * @param {Object} req - The request object containing email and project name.
 * @param {Object} res - The response object used to send responses to the client.
 */
exports.registerUser = async (req, res) => {
  // Extract email and project name from request body
  const { email, projectName } = req.body

  if (!email || !projectName) {
    return res.status(400).send('Email and project name are required')
  }

  try {
    logger.info('Checking if the user and project already exist...')
    // Check if user with the given email and project already exists
    const existingUser = await User.findOne({ where: { email, projectName } })

    if (existingUser) {
      logger.info('User with this project already exists')
    } else {
      logger.info('Creating a new user or updating existing user with new project...')
      // Check if the user exists without considering the project
      const userWithoutProject = await User.findOne({ where: { email } })

      if (userWithoutProject) {
        // If the user exists, but with a different project, update the project name
        userWithoutProject.projectName = projectName
        // Save the updated user
        await userWithoutProject.save()
        logger.info('Updated existing user with new project')
      } else {
        // If the user does not exist, create a new user
        await User.create({ email, projectName })
        logger.info('New user created')
      }
    }

    const authUrl = getAuthUrl(email, projectName) // Generate the authentication URL

    logger.info(`Returning authUrl:${authUrl}`) // Log the authentication URL
    return res.status(200).json({ authUrl }) // Return the authentication URL
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ error: 'An error occurred while registering the user' })
  }
}
