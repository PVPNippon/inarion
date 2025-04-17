/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const express = require('express')
const router = express.Router()

const domainUsersController = require('../controllers/domainUsersController')
//
router.post('/users-list', domainUsersController.getDomainUsersList)

module.exports = router
