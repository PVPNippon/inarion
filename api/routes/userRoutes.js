const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const tokenController = require('../controllers/tokenController');

router.get('/get', tokenController.authenticateToken, userController.getData);

router.post('/get-admins', userController.getAdmins);



module.exports = router;
