const { google } = require('googleapis')
const { listGroups, listGroupMembers, getJoinGroupsLogs } = require('../services/groupsService')

/**
 * Determines if there is a membership(direct or indirect) relationship between a suspected transitive parent group and a target group or user.
 *
 * This function checks if the specified `suspectedParent` group includes the `theGroupOrUser` as a member
 * within the provided `family` array of group objects.
 *
 * @param {string} suspectedParent - The email address of the suspected transitive parent group.
 * @param {string} theGroupOrUser - The email address of the target group or user.
 * @param {Object[]} family - An array of group objects, each containing a `group` with an `email` and `members` list.
 * @returns {boolean} - Returns `true` if the target group or user is a member of the suspected parent group, otherwise `false`.
 */
function hasRelation(suspectedParent, theGroupOrUser, family) {
  //get suspected  transitive parent object from family array
  const suspectedParentObj = family.find((group) => group.group.email === suspectedParent)

  //if the suspected parent is not found, return false
  if (typeof suspectedParentObj === 'undefined') return false

  //get all members of suspected transitive parent
  const allMembers = suspectedParentObj.members

  //check if the target group or user is among them
  const target = allMembers.filter((member) => member.email === theGroupOrUser)

  //if the target group or user is not found, return false
  //else return true
  return target.length > 0
}

/**
 * Finds transitive same-level parents(stricly speaking, grandparents or great-grandparents) for a group or user in the given family array.
 *
 * Given a group or user, this function finds all transitive(same level) parents by recursively
 * checking each group in the family array for direct members of the provided
 * `indirectParentObj`, and then checks each of those direct members for a
 * membership relationship with the `theGroupOrUser`.
 *
 * @param {Object[]} family - An array of group objects, each containing a `group` with an `email` and `members` list.
 * @param {Object[]} directMembersArray - An array of direct members for each group in the family array.
 * @param {string} theGroupOrUser - The email address of the target group or user.
 * @param {Object} indirectParentObj - A group object containing the email address of the indirect parent group.
 * @returns {string} - A string containing a comma-separated list of transitive parents, or an empty string if no transitive parents are found.
 */
function getTransitive(family, directMembersArray, theGroupOrUser, indirectParentObj) {
  let transitiveParents = ''

  //get index of object containing top level parent
  const index = family.findIndex((group) => group.group.email === indirectParentObj.group.email)

  //find corresponding array in the directMembersArray that contains direct members of the top level parent
  //iterate through direct members of the top level parent
  //check if there is a membership relationship with the target group or user
  //if so, add to transitiveParents
  directMembersArray[index].forEach((suspectedParent) => {
    if (suspectedParent.type !== 'GROUP') return //skip if member type is not a group

    if (hasRelation(suspectedParent.email, theGroupOrUser, family)) {
      transitiveParents.length === 0
        ? (transitiveParents = suspectedParent.email)
        : (transitiveParents += ',  ' + suspectedParent.email)
    }
  })

  return transitiveParents
}

/**
 * Given a list of all activities, the email address of a member, and the email address of a group,
 * returns the time the member joined the group in the format "Month DD, YYYY, HH:mm AM/PM JST".
 * Returns "not found" if the joining logs for corresponding group and member are not found in the activities.
 * @param {Object[]} allActivities - A list of all activities.
 * @param {string} memberId - The email address of the member to find the join time for.
 * @param {string} groupId - The email address of the group to find the join time in.
 * @returns {string} - The time the member joined the group, or "not found" if the member is not found in the activities.
 */
function getJoinedTime(allActivities, memberId, groupId) {
  //set default value to 'not found'
  //since logs are only available for last 6 months, in many cases there won't be any joining logs
  //or logs can just be gone from google server due to malfunction on their side
  let joinedTime = 'not found'

  //iterate through all activities
  allActivities.forEach((activity) => {
    //if activity is undefined or null, return default joinedTime
    if (typeof activity === 'undefined' || activity === null) return joinedTime

    //retrieve member and group id from activity
    //all groups joined logs can be devided in 2 types: when added member is the actor, or  when they are target of the action
    //if member is the actor, there will be only 1 parameter in the parameters array, which will contain the group email. And member email will be in activity.actor email
    //if member is the target of the action, there will be 2 parameters, where the first is member email and second is group email

    const event = activity.events[0].parameters //get parameters array

    //declare variables
    let member_Id
    let group_Id

    //if there is only 1 parameter in the array, grab group email from it, and grab member email from activity actor
    //otherwise, grab group email from 2nd parameter, and grab member email from 1st parameter
    if (typeof event[1] === 'undefined') {
      group_Id = event[0].value
      member_Id = activity.actor.email
    } else {
      group_Id = event[1].value
      member_Id = event[0].value
    }

    //check if member and group id matches with target group and member
    //if yes, return the joining time
    //othewise, return default joinedTime
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

/**
 * Given an email address of a group or user, returns a table of membership details
 * for all direct/indirect parents of the target group/user.
 *
 * @param {string} userEmail - The email address of the user performing the action.
 * @param {string} projectId - The GCP project ID.
 * @param {string} serviceAccountEmail - The service account email address.
 * @param {string} serviceAccountPrivateKey - The service account private key.
 * @param {string} queryEmail - The email address of the group or user to query.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of objects containing membership details for direct/indirect parents of the target group.
 */
async function getNestedTable(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, queryEmail) {
  /**
   * Given an array of group objects, fetches all members(direct and indirect) of each group and creates a family array.
   * The family array contains objects with the group details and the members of each group.
   *
   * @param {Array<Object>} groups - An array of group objects.
   * @param {string} theGroupOrUser - The email address of the group or user to find in the family array.
   * @returns {Array<Object>} - An array of objects representing the family, each containing the group details and its members.
   */
  //the reason this function is inside the main function and not at the top of the page
  //is because I don't want to pass around projectId, serviceAccountEmail, and serviceAccountPrivateKey
  //I'm passing them around just in case our until it becomes clear they are not needed
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
        //if our target group(the star) is among indirect members, add the parent group to the family
        const hasMember = memberArray.filter((member) => member.email === theGroupOrUser)
        if (hasMember.length > 0) {
          const index = memberArrays.indexOf(memberArray)
          //for each parent group, create a group object containing 2 keys: group and members
          family.push({
            group: groups[index],
            members: memberArray,
          })
        }
      })
    })
    return family //returns an array of objects containing the group details and all its members(direct+indirect)
    //for now I keep all the data in, because we might need something else in the future, like group ID or member type etc.
  }

  /**
   * Given a family array, fetches the direct members of each group in the family and returns an array of arrays.
   * Each inner array contains the direct members of the corresponding group in the family array.
   *
   * @param {Array<Object>} family - An array of objects representing the family, each containing the group details and its members.
   * @returns {Promise<Array<Array<Object>>>} - A promise that resolves to an array of arrays, where each inner array contains the direct members of the corresponding group in the family array.
   */
  //the reason this function is inside the main function and not at the top of the page
  //is because I don't want to pass around projectId, serviceAccountEmail, and serviceAccountPrivateKey
  //I'm passing them around just in case our until it becomes clear they are not needed
  async function getDirectMembersArray(family) {
    const promises = []
    const directMemberArray = []

    family.forEach(async (groupObj) => {
      const directMembers = new Promise((resolve, reject) => {
        resolve(
          listGroupMembers(
            userEmail,
            projectId,
            serviceAccountEmail,
            serviceAccountPrivateKey,
            groupObj.group.email,
            false
          )
        )
      })
      promises.push(directMembers)
    })

    await Promise.all(promises).then((values) => {
      values.forEach((value) => {
        directMemberArray.push(value)
      })
    })

    return directMemberArray
  }

  /**
   * Given a family of groups, retrieves the membership details of each direct/indirect parents of the target group/user.
   * For each direct member, determines if their membership is direct or inherited, and provides the timestamp of their membership.
   *
   * @param {Object[]} family - A list of groups, each containing a group object and a list of all its members(direct and indirect).
   * @returns {Object[]} - An array of objects containing membership details for direct/indirect parents of the target group.
   */
  async function getTable(family) {
    const table = []

    //get an array with group joining logs for the last 6 months
    //the reason why we need them is because google API does not provide a joined timestamp
    //so we need to get it ourselves in a roundabout way
    const allActivities = await getJoinGroupsLogs(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey)

    //for each group in the family, fetch all its direct members
    //the reason why we need to fetch all direct members separately is because
    //the API method which returns all members(direct and indirect) does not say which member is direct and which is indirect
    //so we need to find it out by ourselves in a roundabout way
    const directMembers = await getDirectMembersArray(family)

    //for each parent group, create JSON object containing membership details
    directMembers.forEach((directMember) => {
      const index = directMembers.indexOf(directMember)
      const groupObj = family[index]
      const obj = {
        email: groupObj.group.email, //the "group" column of the table
      }

      //sift through for each group's direct member array to find out if our target group is among direct members
      const targetParentGroup = directMember.filter((member) => member.email === theGroupOrUser)

      if (targetParentGroup.length > 0) {
        obj.membership = 'Direct' //the "membership type" column of the table
        obj.inherited = '' //"inherited via" column of the table, left empty for direct memberships
        obj.timestamp = getJoinedTime(allActivities, theGroupOrUser, groupObj.group.email)
      } else {
        const inheritedVia = getTransitive(family, directMembers, theGroupOrUser, groupObj) || ''
        // const inheritedVia = getTransitive(family, directMembers, theGroupOrUser, groupObj) || ''
        obj.membership = 'Inherited' //the "membership type" column of the table
        obj.inherited = inheritedVia //"inherited via" column of the table
        obj.timestamp = '' //"timestamp" column of the table, left empty for inherited memberships (for now)
      }
      table.push(obj)
    })

    return table
  }

  const theGroupOrUser = queryEmail

  try {
    //get a list of all groups in customer organization
    let groups = await listGroups(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey)

    //leave out groups with no members to reduce number of API calls
    groups = groups.filter((group) => group.directMembersCount > 0)

    //get an array of parent group objects
    const family = await getFamilyWithAllMembers(groups, theGroupOrUser)

    if (family.length === 0) {
      return []
    }

    //get an array with membership details and timestamp for each parent/grandparent group of the target group/user
    const table = await getTable(family)

    return table
  } catch (error) {
    console.log(error)
  }
}

function getHierarchy(nestedTableArray, queryEmail) {
  const hierarchy = {
    nodes: [],
    edges: [],
  }

  hierarchy.nodes.push({
    id: queryEmail,
    label: queryEmail,
    color: 'red',
    shape: 'box',
  })
  nestedTableArray.forEach((row) => {
    hierarchy.nodes.push({
      id: row.email,
      label: row.email,
      shape: 'box',
    })
  })

  nestedTableArray.forEach((row) => {
    if (row.membership === 'Inherited') {
      const inheritedParentArray = row.inherited.split(',')

      inheritedParentArray.forEach((inheritedParent) => {
        hierarchy.edges.push({
          from: row.email,
          to: inheritedParent.trim(),
        })
      })
    } else if (row.membership === 'Direct') {
      hierarchy.edges.push({
        from: row.email,
        to: queryEmail,
      })
    }
  })
  return hierarchy
}

module.exports = {
  getNestedTable,
  getHierarchy,
}
