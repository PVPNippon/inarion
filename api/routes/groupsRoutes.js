const express = require('express')
const router = express.Router()
const groupsController = require('../controllers/groupsController')

//route to list all groups in customer organization
router.post('/list-groups', groupsController.listAllGroups)

module.exports = router
