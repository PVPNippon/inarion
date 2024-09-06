// routes/tokenRoutes.js
const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');

router.post('/token', tokenController.token);
router.post('/logout', tokenController.logout);

module.exports = router;
