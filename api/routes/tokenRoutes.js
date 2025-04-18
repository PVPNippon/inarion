/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

// routes/tokenRoutes.js
const express = require('express')
const router = express.Router()
const tokenController = require('../controllers/tokenController')

router.post('/token', tokenController.token)
router.post('/logout', tokenController.logout)

module.exports = router
