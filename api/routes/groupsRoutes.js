const express = require('express')
const router = express.Router()
const groupsController = require('../controllers/groupsController')
const groupsCacheMiddleware = require('../middleware/groupsCacheMiddleware')
const { encryptResponseMiddleware, decryptRequestMiddleware } = require('../controllers/crypto/cryptoMiddleware')
const { validateJWTMiddleware } = require('../controllers/googleAuthController')

// Global middlewares for all routes
//router.use(validateJWTMiddleware) // Validate JWT for all routes
router.use(decryptRequestMiddleware) // Decrypt request for all routes

//route to list all groups in customer organization
router.get(
  '/',
  groupsCacheMiddleware.retrieveAllGroups,
  groupsController.listAllGroups,
  groupsCacheMiddleware.storeAllGroups
)

//route to get group by its email
router.get(
  '/group/:groupEmail',
  groupsCacheMiddleware.retrieveGroup,
  groupsController.getGroup,
  groupsCacheMiddleware.storeGroup
)

//route to list direct members of a group
router.get(
  '/group/:groupEmail/members',
  groupsCacheMiddleware.retrieveMembers,
  groupsController.listDirectMembers,
  groupsCacheMiddleware.storeMembers
)

//route to add members to a group
router.post('/group/:groupEmail/members', groupsController.addMembers)

//route to list all members of a group(both direct and indirect)
router.get(
  '/group/:groupEmail/descendants',
  groupsCacheMiddleware.retrieveDescendants,
  groupsController.listAllMembers,
  groupsCacheMiddleware.storeDescendants
)

//route to get group activity logs(all group logs for all groups in cx domain)
router.get('/activities', groupsController.getGroupActivity)

//route to get group joined activity(all "add_member" and "accept_invitation" logs for all groups in cx domain)
router.get('/joined-activities', groupsController.getGroupJoinedActivity)

// DEPRECATED
//route to get nested membership table for a member(group or user)
router.get('/target/:targetEmail/nested-membership', groupsController.getNestedMembership)

//route to get group hierarchy relative to a group(or potentially in the future a user)
router.get('/target/:targetEmail/hierarchy', groupsController.getGroupHierarchy)

//route to list members of groups in CSV format
router.post('/members/export', groupsController.listGroupsMembersInExportFormat)

//route to update a group's settings
router.put('/group/:groupEmail/settings', groupsController.updateGroupSettings, groupsCacheMiddleware.storeSettings)

//route to delete multiple members from a group
router.delete('/group/:groupEmail/members', groupsController.deleteMembers)

//route to delete a member from multiple groups
router.delete('/members/member/:memberEmail', groupsController.deleteMemberFromGroups)

//route to create a group
//router.post('/', groupsController.createGroup)

//route to create groups
router.post('/', groupsController.createGroups)

//route to get a group's settings
router.get(
  '/group/:groupEmail/settings',
  groupsCacheMiddleware.retrieveSettings,
  groupsController.getSettings,
  groupsCacheMiddleware.storeSettings
)

//route to get nested membership table for an entity (group or user)
router.get('/target/:targetEmail/nested-table', groupsController.getNestedTable)

router.use(encryptResponseMiddleware) // Encrypt request for all routes

module.exports = router
