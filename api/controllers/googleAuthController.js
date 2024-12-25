const jwt = require('jsonwebtoken')
const { google } = require('googleapis')
const CryptoJS = require('crypto-js')
const User = require('../models/User')

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
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
  })

  console.log(authUrl)
  res.json({ url: authUrl })
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
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const googleId = payload.sub
    const email = payload.email

    let userSecret = null
    let dbError = false

    try {
      let user = await User.findOne({ where: { googleId } })

      if (user && user.jwtSecret) {
        userSecret = user.jwtSecret
        console.log(`Using existing jwtSecret for user: ${googleId}`)
      } else {
        userSecret = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex)

        if (user) {
          await user.update({ jwtSecret: userSecret })
          console.log(`Updated user with new jwtSecret: ${googleId}`)
        } else {
          await User.create({
            googleId,
            email,
            jwtSecret: userSecret,
            projectName: 'Default Project',
          })
          console.log(`Created new user with jwtSecret: ${googleId}`)
        }
      }
    } catch (error) {
      console.error('Database unavailable, falling back to local secret:', error.message)
      dbError = true
    }

    if (!userSecret || dbError) {
      userSecret = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex)
      console.log(`Using locally generated secret as fallback for user: ${googleId}`)
    }

    const appJWT = jwt.sign({ id: googleId, email }, userSecret, { expiresIn: '1h' })

    console.log('JWT Successfully Generated!')
    res.send(`
            <script>
                window.opener.postMessage({ token: '${appJWT}' }, 'http://localhost:3000');
                window.close();
            </script>
        `)
  } catch (error) {
    console.error('Error during OAuth2 callback:', error.message)
    res.status(500).json({ error: 'Authentication failed' })
  }
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
        console.log(`Using DB jwtSecret for user: ${googleId}`)
      } else {
        console.log(`No jwtSecret found in DB for user: ${googleId}`)
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
      console.log(`Using local fallback jwtSecret for user: ${googleId}`)
    }

    const verified = jwt.verify(token, userSecret)
    console.log('Verified Token:', verified)
    res.json({ valid: true, user: verified })
  } catch (error) {
    console.error('Token verification failed:', error.message)
    res.status(401).json({ valid: false, error: 'Invalid or expired token' })
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
  protectedRoute,
}
