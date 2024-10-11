const express = require('express')
const router = express.Router()
const groupsController = require('../controllers/groupsController')

//route to list all groups in customer organization
router.post('/list-groups', groupsController.listAllGroups)

// //route to get group by id(email)
router.post('/get-group', groupsController.getGroup)

// //route to list direct members of a group
router.post('/list-direct-members', groupsController.listDirectMembers)

// //route to list all members of a group(both direct and indirect)
router.post('/list-all-members', groupsController.listAllMembers)

module.exports = router
