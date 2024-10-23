const express = require('express')
const router = express.Router()
const groupsController = require('../controllers/groupsController')

//route to list all groups in customer organization
router.post('/list-groups', groupsController.listAllGroups)

//route to get group by its email
router.post('/get-group', groupsController.getGroup)

//route to list direct members of a group
router.post('/list-direct-members', groupsController.listDirectMembers)

//route to list all members of a group(both direct and indirect)
router.post('/list-all-members', groupsController.listAllMembers)

//route to get group activity logs(all group logs for all groups in cx domain)
router.post('/get-group-activity', groupsController.getGroupActivity)

//route to get group joined activity(all "add_member" and "accept_invitation" logs for all groups in cx domain)
router.post('/get-group-joined-activity', groupsController.getGroupJoinedActivity)

//route to get nested membership table for a member(group or user)
router.post('/get-nested-membership', groupsController.getNestedMembership)

//route to get group hierarchy relative to a group(or potentially in the future a user)
router.post('/get-group-hierarchy', groupsController.getGroupHierarchy)

module.exports = router
