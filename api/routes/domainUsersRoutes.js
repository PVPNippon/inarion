const express = require('express');
const router = express.Router();

const domainUsersController = require('../controllers/domainUsersController');
// 
router.post('/users-list', domainUsersController.getDomainUsersList);

module.exports = router;