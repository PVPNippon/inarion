// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
// router.post('/register', authController.register);
router.get('/oauth2callback', authController.oauth2callback);
router.post('/register', userController.registerUser);



// exports.register = (req, res) => {
//     const { email, projectName } = req.body;
  
//     if (!email || !projectName) {
//       return res.status(400).send('Email and project name are required');
//     }
  
//     const authUrl = getAuthUrl(email);
  
//     res.status(200).json({ authUrl });
//   };

module.exports = router;
