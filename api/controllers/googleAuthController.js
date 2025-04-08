/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const jwt = require('jsonwebtoken')
const { google } = require('googleapis')
const CryptoJS = require('crypto-js')
const User = require('../models/User')
const { registerUser } = require('../controllers/userController')
const config = require('../config/config') // Configuration settings
const { initProject } = require('./projectController')
const logger = require('../logger/logger')(__filename, 'GoogleAuth')

// Google OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `http://localhost:4000/google/auth/oauth2callback`
)

// Object to store user-specific secret keys
const userSecrets = {}

/**
 * Generate Google Login URL
 */
const generateGoogleLoginUrl = (req, res) => {
  // const projectName = 'proj-9-5-issue-31'
  const projectName = config.PROJECT_NAME

  // const authUrl = oauth2Client.generateAuthUrl({
  //   access_type: 'offline',
  //   scope: ['openid', 'email', 'profile'],
  // })

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile', ...config.SCOPES],
    state: JSON.stringify({ projectName }),
  })

  logger.info(authUrl)
  res.json({ url: authUrl })
}

/**
 * Generates a secret key for the given Google ID. If the user exists in the
 * database, the existing secret key will be used. If the user does not exist,
 * a new secret key will be generated and stored in the database. If there is
 * an error accessing the database, a secret key will be generated locally and
 * used as fallback.
 * @param {string} googleId - The Google ID of the user.
 * @param {string} email - The email address of the user.
 * @return {Promise<string>} The generated secret key.
 */
const generateUserSecret = async (googleId, email) => {
  let userSecret = null
  let dbError = false

  try {
    // Check if the user exists in the database
    let user = await User.findOne({ where: { googleId } })

    if (user) {
      // If user exists, use the existing secret or update it if needed
      if (user.jwtSecret) {
        userSecret = user.jwtSecret
        logger.info(`User found. Using existing jwtSecret for Google ID: ${googleId}`)
      } else {
        // Generate a new secret if none exists
        userSecret = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex)
        logger.info(`Generated a new jwtSecret for Google ID: ${googleId}`)
        await user.update({ jwtSecret: userSecret })
        logger.info('Updated existing user with the new jwtSecret.')
      }

      // Check and update the project name if it's different
      if (user.projectName !== config.PROJECT_NAME) {
        await user.update({ projectName: config.PROJECT_NAME })
        logger.info(`Updated projectName for user ${googleId} to ${config.PROJECT_NAME}`)
      }
    } else {
      // If user does not exist, create a new record
      userSecret = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex)
      logger.info(`Generated a new jwtSecret for Google ID: ${googleId}`)
      await User.create({
        googleId,
        email,
        jwtSecret: userSecret,
        projectName: config.PROJECT_NAME,
      })
      logger.info('Created a new user in the database.')
    }
  } catch (error) {
    // Handle database errors
    logger.error('Database error. Falling back to local secret generation:', error.message)
    dbError = true
  }

  // Fallback to a locally generated secret if there was an error or no secret
  if (!userSecret || dbError) {
    userSecret = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex)
    logger.warn('Using a locally generated jwtSecret as fallback.')
  }

  return userSecret
}

/**
 * Handle Google OAuth2 Callback
 */
const handleGoogleAuthCallback = async (req, res) => {
  const code = req.query.code

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is missing' })
  }

  try {
    logger.info('Retrieving tokens using authorization code...')
    const { tokens } = await oauth2Client.getToken(code)
    logger.info('Tokens retrieved:', tokens)
    oauth2Client.setCredentials(tokens)

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const googleId = payload.sub
    const email = payload.email
    logger.info('Authenticated Email:', email)

    let userSecret = await generateUserSecret(googleId, email)

    const appJWT = jwt.sign({ id: googleId, email }, userSecret, { expiresIn: '1h' })

    logger.info('JWT Successfully Generated!')
    const projectData = await initProject(tokens, email, config.PROJECT_NAME)

    res.send(`
            <script>
                window.opener.postMessage({ token: '${appJWT}' }, 'http://localhost:3000');
                window.close();
            </script>
        `)
    // await registerUser(req, res)
    // return
  } catch (error) {
    console.error('Error during OAuth2 callback:', error.message)
    res.status(500).json({ error: 'Authentication failed' })
  }
  // return
}

/**
 * Validate Token
 */
const validateToken = async (req, res) => {
  const { token } = req.body

  if (!token) {
    return res.status(400).json({ error: 'Token is required' })
  }

  try {
    const decoded = jwt.decode(token)
    const googleId = decoded.id

    let userSecret = null
    let dbError = false

    try {
      const user = await User.findOne({ where: { googleId } })

      if (user && user.jwtSecret) {
        userSecret = user.jwtSecret
        logger.info(`Using DB jwtSecret for user: ${googleId}`)
      } else {
        logger.info(`No jwtSecret found in DB for user: ${googleId}`)
      }
    } catch (error) {
      console.error('Database unavailable, falling back to local secret:', error.message)
      dbError = true
    }

    if (!userSecret || dbError) {
      userSecret = userSecrets[googleId]
      if (!userSecret) {
        return res.status(401).json({ valid: false, error: 'User not found (local fallback failed).' })
      }
      logger.info(`Using local fallback jwtSecret for user: ${googleId}`)
    }

    const verified = jwt.verify(token, userSecret)
    logger.info('Verified Token:', verified)
    res.json({ valid: true, user: verified })
  } catch (error) {
    console.error('Token verification failed:', error.message)
    res.status(401).json({ valid: false, error: 'Invalid or expired token' })
  }
}

const validateJWTMiddleware = async (req, res, next) => {
  logger.info('validateJWTMiddleware called')
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header is missing or invalid' })
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    const decoded = jwt.decode(token)
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token structure' })
    }

    const googleId = decoded.id

    let userSecret = null

    try {
      const user = await User.findOne({ where: { googleId } })

      if (user && user.jwtSecret) {
        userSecret = user.jwtSecret
        logger.info(`Using DB jwtSecret for user: ${googleId}`)
      } else {
        logger.info(`No jwtSecret found in DB for user: ${googleId}`)
      }
    } catch (error) {
      console.error('Database error:', error.message)
      return res.status(500).json({ error: 'Internal server error' })
    }

    if (!userSecret) {
      return res.status(401).json({ error: 'User not found or secret key is missing' })
    }

    try {
      const verified = jwt.verify(token, userSecret)
      logger.info('Verified Token:', verified)

      // Store verified user in `req` for subsequent middleware/route handlers
      req.user = verified
      next() // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Token verification failed:', error.message)
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
  } catch (error) {
    console.error('Error during token validation:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Protected Route
 */
const protectedRoute = (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).send('Access Denied')

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.decode(token)
    const googleId = decoded.id

    const userSecret = userSecrets[googleId]
    if (!userSecret) {
      return res.status(401).send('Access Denied: User not found')
    }

    const verified = jwt.verify(token, userSecret)
    res.json({ message: 'Protected data', user: verified })
  } catch (err) {
    res.status(400).send('Invalid Token')
  }
}

module.exports = {
  generateGoogleLoginUrl,
  handleGoogleAuthCallback,
  validateToken,
  validateJWTMiddleware,
  protectedRoute,
}
