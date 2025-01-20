const express = require('express')
const router = express.Router()
const groupsController = require('../controllers/groupsController')
const groupsCacheMiddleware = require('../middleware/groupsCacheMiddleware')
const { encryptResponseMiddleware, decryptRequestMiddleware } = require('../controllers/crypto/cryptoMiddleware')
const { validateJWTMiddleware } = require('../controllers/googleAuthController')

// Global middlewares for all routes
router.use(validateJWTMiddleware) // Validate JWT for all routes
router.use(decryptRequestMiddleware) // Decrypt request for all routes

//route to list all groups in customer organization
router.get('/',
  groupsCacheMiddleware.retrieveAllGroups,
  groupsController.listAllGroups,
  groupsCacheMiddleware.storeAllGroups,
)

//route to get group by its email
router.get('/:groupEmail',
  groupsCacheMiddleware.retrieveGroup,
  groupsController.getGroup,
  groupsCacheMiddleware.storeGroup
)

//route to list direct members of a group
router.post('/list-direct-members',
  groupsCacheMiddleware.retrieveMembers,
  groupsController.listDirectMembers,
  groupsCacheMiddleware.storeMembers
)

//route to list all members of a group(both direct and indirect)
router.post('/list-all-members',
  groupsCacheMiddleware.retrieveDescendants,
  groupsController.listAllMembers,
  groupsCacheMiddleware.storeDescendants
)

//route to get group activity logs(all group logs for all groups in cx domain)
router.post('/get-activity', groupsController.getGroupActivity)

//route to get group joined activity(all "add_member" and "accept_invitation" logs for all groups in cx domain)
router.post('/get-joined-activity', groupsController.getGroupJoinedActivity)

//route to get nested membership table for a member(group or user)
router.post('/get-nested-membership', groupsController.getNestedMembership)

//route to get group hierarchy relative to a group(or potentially in the future a user)
router.post('/get-hierarchy', groupsController.getGroupHierarchy)

//route to list members of groups in CSV format
router.post('/bulk-export', groupsController.listGroupsMembersInExportFormat)

//route to update the 'whoCanLeaveGroup' setting of the specified group
router.put('/update-whocanleave',
  groupsController.updateWhoCanLeaveGroup,
  groupsCacheMiddleware.storeSettings
)

//route to delete multiple members from a group
router.delete('/delete-members', groupsController.deleteMembers)

//route to delete a member from multiple groups
router.delete('/delete-member-from-groups', groupsController.deleteMemberFromGroups)

router.use(encryptResponseMiddleware) // Encrypt request for all routes

module.exports = router
