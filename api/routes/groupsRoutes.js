const express = require('express')
const router = express.Router()
const groupsController = require('../controllers/groupsController')
const { encryptResponseMiddleware, decryptRequestMiddleware } = require('../controllers/crypto/cryptoMiddleware')
const cacheMiddleware = require('../middleware/cacheMiddleware.js')

//route to list all groups in customer organization
router.post('/list',
  decryptRequestMiddleware,
  cacheMiddleware.getAllGroupInfosFromCache,
  groupsController.listAllGroups,
  encryptResponseMiddleware,
  cacheMiddleware.setAllGroupInfosInCache
)

//route to get group by its email
router.post('/get',
  decryptRequestMiddleware,
  cacheMiddleware.getGroupInfoFromCache,
  groupsController.getGroup,
  encryptResponseMiddleware,
  cacheMiddleware.setGroupInfoInCache
)

//route to list direct members of a group
router.post('/list-direct-members',
  decryptRequestMiddleware,
  cacheMiddleware.getGroupMembersFromCache,
  groupsController.listDirectMembers,
  encryptResponseMiddleware,
  cacheMiddleware.setGroupMembersInCache
)

//route to list all members of a group(both direct and indirect)
router.post('/list-all-members',
  decryptRequestMiddleware,
  cacheMiddleware.getGroupDescendantsFromCache,
  groupsController.listAllMembers,
  encryptResponseMiddleware,
  cacheMiddleware.setGroupDescendantsInCache
)

//route to get group activity logs(all group logs for all groups in cx domain)
router.post('/get-activity',
  decryptRequestMiddleware,
  groupsController.getGroupActivity,
  encryptResponseMiddleware
)

//route to get group joined activity(all "add_member" and "accept_invitation" logs for all groups in cx domain)
router.post(
  '/get-joined-activity',
  decryptRequestMiddleware,
  groupsController.getGroupJoinedActivity,
  encryptResponseMiddleware
)

//route to get nested membership table for a member(group or user)

router.post(
  '/get-nested-membership',
  decryptRequestMiddleware,
  groupsController.getNestedMembership,
  encryptResponseMiddleware
)

//route to get group hierarchy relative to a group(or potentially in the future a user)
router.post('/get-hierarchy',
  decryptRequestMiddleware,
  groupsController.getGroupHierarchy,
  encryptResponseMiddleware
)

//route to list members of groups in CSV format
router.post(
  '/bulk-export',
  decryptRequestMiddleware,
  groupsController.listGroupsMembersInExportFormat,
  encryptResponseMiddleware
)

//route to update the 'whoCanLeaveGroup' setting of the specified group
router.put('/update-whocanleave',
  groupsController.updateWhoCanLeaveGroup,
  cacheMiddleware.setGroupSettingsInCache
)

//route to delete multiple members from a group
router.delete('/delete-members', groupsController.deleteMembers)

//route to delete a member from multiple groups
router.delete('/delete-member-from-groups', groupsController.deleteMemberFromGroups)

module.exports = router
