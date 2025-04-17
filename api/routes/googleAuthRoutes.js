/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const express = require('express')
const {
  generateGoogleLoginUrl,
  handleGoogleAuthCallback,
  validateToken,
  protectedRoute,
} = require('../controllers/googleAuthController')

const router = express.Router()

/**
 * Route: Generate Google Login URL
 */
router.get('/', generateGoogleLoginUrl)

/**
 * Route: Google OAuth2 Callback
 */
router.get('/auth/oauth2callback', handleGoogleAuthCallback)

/**
 * Route: Validate Token
 */
router.post('/validate-token', validateToken)

/**
 * Route: Protected
 */
router.get('/protected', protectedRoute)

module.exports = router
