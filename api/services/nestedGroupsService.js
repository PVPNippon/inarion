const { google } = require('googleapis')
const { listGroups, listGroupMembers, getJoinGroupsLogs } = require('../services/groupsService')
const { getClient } = require('../utility/groupsUtilityFunctions')

/**
 * Checks if the suspectedParent is a direct member of the group with email address indirectParent in the given family.
 * @param {string} suspectedParent - The email address of the group to be checked.
 * @param {string} indirectParent - The email address of the group to be checked against.
 * @param {Object[]} family - A list of groups, each containing a group object and a list of its direct members.
 * @returns {boolean} - true if suspectedParent is a direct member of indirectParent, false otherwise.
 */
function hasRelation(suspectedParent, indirectParent, family) {
  const indirectParentObj = family.find((group) => group.group.email === indirectParent)
  const directMembers = indirectParentObj.members
  const target = directMembers.filter((member) => member.email === suspectedParent)
  return target.length > 0
}

/**
 * Given a family of groups, the direct members of each group, and the email addresses of a group or user and an indirect parent,
 * returns the email address of the direct parent of the given group or user in the given family.
 * @param {Object[]} family - A list of groups, each containing a group object and a list of its direct members.
 * @param {Object[][]} directMembersArray - A list of lists, where each inner list contains the direct members of the group at the same index in the family list.
 * @param {string} theGroupOrUser - The email address of the group or user to find the direct parent of.
 * @param {string} indirectParent - The email address of the group to find the direct parent in relation to.
 * @returns {string} - The email address of the direct parent of the group or user.
 */
//Will likely be changed to get the closest upper grandparent
function getTransitive(family, directMembersArray, theGroupOrUser, indirectParent) {
  let directParent = ''
  let fullFamily = family
  for (let i = 0; i < fullFamily.length; i++) {
    fullFamily[i] = Object.assign(fullFamily[i], {
      directMembers: directMembersArray[i],
    })
  }

  do
    fullFamily.forEach((group) => {
      const members = group.directMembers
      const target = members.filter((member) => member.email === theGroupOrUser)
      if (target.length > 0 && hasRelation(group.group.email, indirectParent, fullFamily)) {
        directParent = group.group.email
      }
    })
  while (directParent === '')
  return directParent
}

/**
 * Given a list of all activities, the email address of a member, and the email address of a group,
 * returns the time the member joined the group in the format "Month DD, YYYY, HH:mm AM/PM JST".
 * Returns "not found" if the member is not found in the activities.
 * @param {Object[]} allActivities - A list of all activities.
 * @param {string} memberId - The email address of the member to find the join time for.
 * @param {string} groupId - The email address of the group to find the join time in.
 * @returns {string} - The time the member joined the group, or "not found" if the member is not found in the activities.
 */
function getJoinedTime(allActivities, memberId, groupId) {
  let joinedTime = 'not found'
  allActivities.forEach((activity) => {
    const event = activity.events[0].parameters
    let member_Id
    let group_Id
    if (typeof event[1] === 'undefined') {
      group_Id = event[0].value
      member_Id = activity.actor.email
    } else {
      group_Id = event[1].value
      member_Id = event[0].value
    }

    if (member_Id === memberId && group_Id === groupId) {
      const date = new Date(activity.id.time)
      joinedTime = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZoneName: 'short',
        timeZone: 'Asia/Tokyo',
      })

      return joinedTime
    }
  })

  return joinedTime
}

//WARNING:
//the logic below is neither optimized nor checked properly.
//Don't look down here for the sake of your sanity.
async function getNestedTable(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, queryEmail) {
  /**
   * Given an array of group objects, fetches their members and returns
   * an array of arrays where each subarray contains the members of the
   * corresponding group. The `includeDerivedMembership` parameter is set
   * to `true` when calling `listGroupMembers`.
   * @param {Array<Object>} groups - An array of group objects.
   * @returns {Promise<Array<Array<Object>>>} - A promise that resolves to an array of arrays of group members.
   */
  async function getFamilyWithAllMembers(groups, theGroupOrUser) {
    const promises = []
    const family = []

    //For each group in the array, fetch all its members(direct and indirect)
    groups.forEach(async (group) => {
      const x = new Promise((resolve, reject) => {
        resolve(
          listGroupMembers(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, group.email, true)
        )
      })
      promises.push(x)
    })

    await Promise.all(promises).then((memberArrays) => {
      memberArrays.forEach((memberArray) => {
        const hasMember = memberArray.filter((member) => member.email === theGroupOrUser)
        if (hasMember.length > 0) {
          const index = memberArrays.indexOf(memberArray)
          family.push({
            group: groups[index],
            members: memberArray,
          })
        }
      })
    })
    return family //returns an array of arrays
  }

  async function getTable(family) {
    const table = []
    const promises = []
    const relations = []

    family.forEach(async (group) => {
      const directMembers = new Promise((resolve, reject) => {
        resolve(
          listGroupMembers(
            userEmail,
            projectId,
            serviceAccountEmail,
            serviceAccountPrivateKey,
            group.group.email,
            false
          )
        )
      })
      promises.push(directMembers)
    })

    await Promise.all(promises).then((values) => {
      values.forEach((value) => {
        relations.push(value)
      })
    })

    relations.forEach((relation) => {
      const index = relations.indexOf(relation)
      const group = family[index]
      const obj = {
        email: group.group.email,
        timestamp: '',
      }

      const targetGroup = relation.filter((member) => member.email === theGroupOrUser)
      if (targetGroup.length > 0) {
        obj.membership = 'Direct'
        obj.inherited = ''
      } else {
        const inheritedVia = getTransitive(family, relations, theGroupOrUser, group.group.email) || ''
        obj.membership = 'Inherited'
        obj.inherited = inheritedVia
      }
      table.push(obj)
    })
    return table
  }

  async function updateTable(table) {
    const allActivities = await getJoinGroupsLogs(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey)
    const updatedTable = table

    updatedTable.forEach((member) => {
      let parentEmail
      if (member.membership === 'Inherited') {
        member.timestamp = ''
      } else if (member.membership === 'Direct') {
        parentEmail = member.email
        member.timestamp = getJoinedTime(allActivities, theGroupOrUser, parentEmail)
      }
    })

    return updatedTable
  }

  const theGroupOrUser = queryEmail

  try {
    let groups = await listGroups(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey)
    groups = groups.filter((group) => group.directMembersCount > 0)

    const family = await getFamilyWithAllMembers(groups, theGroupOrUser)

    //TO DO need to refactor logic to return the table at once(and not only that)
    const table = await getTable(family)
    const updatedTable = await updateTable(table)
    return updatedTable
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  getNestedTable,
}
