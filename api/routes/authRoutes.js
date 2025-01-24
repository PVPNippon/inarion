// routes/authRoutes.js
const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const userController = require('../controllers/userController')

// router.get('/oauth2callback', authController.oauth2callback)
// router.post('/register', userController.registerUser);
router.post('/logout', authController.logout)

module.exports = router
