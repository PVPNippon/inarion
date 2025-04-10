/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const groupsService = require('../services/groupsService')
const usersService = require('../services/usersService')
const logger = require('../logger/logger')(__filename, 'Users Utility Functions')

function getUserEmailsToIdsObj(users) {
  if (!Array.isArray(users)) {
    users = [users]
  }

  const emailsToIdsObj = {}

  users.forEach((user) => {
    const id = user.id

    // Resource: users ref: https://developers.google.com/admin-sdk/directory/reference/rest/v1/users
    user.emails.forEach(({ address }) => (emailsToIdsObj[address] = id))
  })

  return emailsToIdsObj
}

function sortUsersByEmail(users) {
  users.sort((u1, u2) => {
    primaryEmail1 = u1.primaryEmail.toLowerCase()
    primaryEmail2 = u2.primaryEmail.toLowerCase()

    if (primaryEmail1 < primaryEmail2) return -1
    if (primaryEmail1 > primaryEmail2) return 1
    return 0
  })
}

// filter for listAllUsers

function filterUsersByOrgUnitPath(users, orgUnitPath) {
  return users.filter((user) => user.orgUnitPath === orgUnitPath)
}

function filterUsersIf2svEnrolled(users, isEnrolledIn2Sv) {
  return users.filter((user) => user.isEnrolledIn2Sv === isEnrolledIn2Sv)
}

function filterUsersIf2svEnforced(users, isEnforcedIn2Sv) {
  return users.filter((user) => user.isEnforcedIn2Sv === isEnforcedIn2Sv)
}

function filterUsersByDomain(users, domain) {
  return users.filter((user) => user.primaryEmail.split('@')[1] === domain)
}

async function filterUsersByGroup(users, groupEmail, userEmail) {
  // line 53 to 61 is needed only if error handling is needed
  const group = await groupsService.getGroupByEmail({
    userEmail,
    groupEmail,
  })

  if (!group) {
    logger.error(error)
    throw new Error(`Group with email ${groupEmail} not found`)
  }

  // fetching all members of the group passed in the query parameter
  const members = await groupsService.listGroupMembers({
    userEmail,
    groupEmail,
    includeDerivedMembership: true, // fetch indirect members as well as direct members. ref: https://developers.google.com/admin-sdk/directory/reference/rest/v1/members/list
  })

  // Leaving only members of type USER since group can contain users and groups
  const userMembers = members.filter((member) => member.type === 'USER')

  // Filtering all users by USER member
  return users.filter((user) => userMembers.some((member) => member.email === user.primaryEmail))
}

async function filterUsersByRoleName(users, roleName, userEmail) {
  // fetching all role assignments (who is assigned to the role)
  const roleAssignments = await usersService.listRoleAssignments({ userEmail })

  // fetching all role names
  const roleNames = await usersService.listRoleNames({ userEmail })

  // Creating a map of roles with role names as keys and empty array as values
  const roleNamesMap = roleNames.reduce((acc, role) => {
    const roleName = role.roleName
    acc[roleName] = []
    return acc
  }, {})

  // Looping through all role assignments
  for (const roleAssignment of roleAssignments) {
    const roleId = roleAssignment.roleId
    const assignedTo = roleAssignment.assignedTo
    const assigneeType = roleAssignment.assigneeType
    const roleName = roleNames.find((role) => role.roleId === roleId)?.roleName

    // If assigneeType is user
    if (assigneeType === 'user') {
      // adding the user to the array
      roleNamesMap[roleName].push(assignedTo)
    }

    // If assigneeType is group
    // MVP に入れなくてもいいかもしれない
    if (assigneeType === 'group') {
      // fetching members of the group with ID assignedTo value
      const members = await groupsService.listGroupMembers({
        userEmail,
        groupEmail: assignedTo, // groupEmail can accepts member.id
        includeDerivedMembership: true, // fetch indirect members as well as direct members.
      })

      // Leaving only members of type USER since group can contain users and groups
      const userMembers = members.filter((member) => member.type === 'USER')
      // adding the members to the array
      roleNamesMap[roleName].push(...userMembers.map((member) => member.id))
    }
  }

  // logger.debug(`Role Names Map: ${JSON.stringify(roleNamesMap, null, 2)}`)

  // Filtering all users using assignedTo value in roleNamesMap
  return users.filter((user) => {
    const assignedTo = user.id
    return roleNamesMap[roleName].includes(assignedTo)
  })
}

module.exports = {
  getUserEmailsToIdsObj,
  sortUsersByEmail,
  filterUsersByOrgUnitPath,
  filterUsersIf2svEnrolled,
  filterUsersIf2svEnforced,
  filterUsersByDomain,
  filterUsersByGroup,
  filterUsersByRoleName,
}
