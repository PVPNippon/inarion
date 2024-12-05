const express = require('express')
const oauth2Client = require('../models/googleAuth') // Google OAuth2 client setup
const config = require('../config/config') // Configuration settings
const { google } = require('googleapis') // Google APIs client library
const User = require('../models/User') // User model for database operations
const router = express.Router()
const axios = require('axios') // Import axios
const projectController = require('../controllers/projectController')
const logger = require('../logger/logger')(__filename, 'Authentication')

// Retrieve the API base URL from environment variables
const API_BASE_URL = process.env.API_BASE_URL

/**
 * Handle OAuth2 callback to process authentication and create a project.
 * @param {Object} req - The request object containing query parameters and session.
 * @param {Object} res - The response object used to send responses to the client.
 */
exports.oauth2callback = async (req, res, next) => {
  // Extract the authorization code and state from the query parameters
  const code = req.query.code
  const { email, projectName } = JSON.parse(req.query.state)

  // Exchange the authorization code for tokens
  const { tokens } = await oauth2Client.getToken({ code, redirect_uri: config.REDIRECT_URI })
  // Store tokens in the session
  req.session.tokens = tokens
  // Store email in the session
  req.session.email = email
  // Store project name in the session
  req.session.projectName = projectName

  // Log  for debugging
  logger.debug(`Email: ${email}`)
  logger.debug(`Project Name: ${projectName}`)
  logger.debug(`Tokens: ${tokens['refresh_token']}`)
  // If a refresh token is present, store it in the database
  if (tokens.refresh_token) {
    logger.debug('Storing refresh token')
    const existingUser = await User.findOne({ where: { email } })

    if (existingUser) {
      logger.debug(`Existing user: ${existingUser.toJSON()}`, {
        storeLocation: 'file',
      })
      // Update the existing user's tokens
      existingUser.tokens = tokens.refresh_token
      // Save changes to the database
      await existingUser.save()
    } else {
      // If the user does not exist, create a new user with the provided details
      await User.create({ email, projectName, refreshToken: tokens.refresh_token })
    }
  }

  // Construct a new request object for the createProject controller function
  const createProjectReq = {
    body: {
      tokens,
      email,
      projectName,
    },
  }

  next()
}

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
    logger.error(`Error during logout: ${error}`)
    res.status(500).send({ message: 'Failed to logout' })
  }
}
