const groupsService = require('../services/groupsService')

/**
 * Checks if a group or user is already included in the hierarchy.
 *
 * @param {object} hierarchy - The hierarchy object from the nestedGroupsService.
 * @param {string} email - The email address of the group or user to check.
 * @returns {boolean} True if the group or user is already in the hierarchy.
 */
function alreadyExists(hierarchy, email) {
  return hierarchy.nodes.some((node) => node.id === email)
}

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
 * Given an array of group objects and a target group or user,
 * returns an array of group objects, each containing a group object and a list of all its members(direct and indirect).
 *
 * This function takes the following parameters:
 * - `userEmail`: the email address of the user to impersonate
 * - `projectId`: the project ID of the service account key
 * - `serviceAccountEmail`: the email address of the service account
 * - `serviceAccountPrivateKey`: the private key of the service account
 * - `groups`: an array of group objects, each containing an `email` key
 * - `theGroupOrUser`: the email address of the target group or user
 *
 * The function first fetches the indirect members of each group in the array.
 * Then, for each group, it checks if the target group or user is among the indirect members.
 * If the target group or user is found, the parent group is added to the family array.
 *
 * The function returns an array of group objects, each containing a group object and a list of all its members(direct+indirect).
 */
async function getFamilyWithAllMembers({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groups,
  theGroupOrUser,
}) {
  const promises = []
  const family = []

  //For each group in the array, fetch all its members(direct and indirect)
  groups.forEach(async (group) => {
    const x = new Promise((resolve, reject) => {
      resolve(
        groupsService.listGroupMembers({
          userEmail,
          projectId,
          serviceAccountEmail,
          serviceAccountPrivateKey,
          groupEmail: group.email,
          includeDerivedMembership: true,
        })
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
 * Retrieves an array of direct members for each group in the given family array.
 *
 * This function takes user and service account credentials, along with a family array of groups,
 * and returns an array containing the direct members of each group in the family.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The GCP project ID.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {Object[]} family - An array of group objects, each containing a `group` with an `email`.
 * @returns {Promise<Object[][]>} - A promise that resolves to an array of arrays, each containing the direct members of a group.
 */
async function getDirectMembersArray({ userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, family }) {
  const promises = []
  const directMemberArray = []

  family.forEach(async (groupObj) => {
    const directMembers = new Promise((resolve, reject) => {
      resolve(
        groupsService.listGroupMembers({
          userEmail,
          projectId,
          serviceAccountEmail,
          serviceAccountPrivateKey,
          groupEmail: groupObj.group.email,
          includeDerivedMembership: false,
        })
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
async function getNestedTable({ userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, queryEmail }) {
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
    const allActivities = await groupsService.getJoinGroupsLogs({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
    })

    //for each group in the family, fetch all its direct members
    //the reason why we need to fetch all direct members separately is because
    //the API method which returns all members(direct and indirect) does not say which member is direct and which is indirect
    //so we need to find it out by ourselves in a roundabout way
    const directMembers = await getDirectMembersArray({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      family,
    })

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
        obj.membership = 'Inherited' //the "membership type" column of the table
        obj.inherited = inheritedVia //"inherited via" column of the table
        obj.timestamp = '' //"timestamp" column of the table, left empty for inherited memberships (for now)
      }
      table.push(obj)
    })

    return table
  }

  const theGroupOrUser = queryEmail

  //get a list of all groups in customer organization
  let groups = await groupsService.listGroups({ userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey })

  //leave out groups with no members to reduce number of API calls
  groups = groups.filter((group) => group.directMembersCount > 0)

  //get an array of parent group objects
  const family = await getFamilyWithAllMembers({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    groups,
    theGroupOrUser,
  })

  if (family.length === 0) {
    return []
  }

  //get an array with membership details and timestamp for each parent/grandparent group of the target group/user
  const table = await getTable(family)

  return table
}

/**
 * Constructs a hierarchical representation of a group's members, including users and sub-groups.
 *
 * This function processes direct and indirect members of a given group, updating the hierarchy with nodes
 * and edges representing users and groups. It filters members by type, checks for existing nodes, and
 * recursively processes child groups to build a comprehensive hierarchy.
 *
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The GCP project ID.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {Object} groupObj - An object representing the current group, containing its email.
 * @param {Object} hierarchy - An object representing the hierarchical structure, including nodes and edges.
 * @param {Object[]} directMembersOfTheGroup - An array of direct members of the group.
 * @param {Object[]} indirectMembersOfTheGroup - An array of indirect members of the group.
 * @param {Object[]} allMembersOfTheGroup - An array of all members (direct and indirect) of the group.
 * @returns {Object} - The updated hierarchy with nodes and edges representing the group's structure.
 */
async function getChildren({
  userEmail,
  projectId,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  groupObj,
  hierarchy,
  directMembersOfTheGroup,
  indirectMembersOfTheGroup,
  allMembersOfTheGroup,
}) {
  //filter user and group members separately
  const users = directMembersOfTheGroup.filter((member) => member.type === 'USER')
  const allUsers = directMembersOfTheGroup.filter((member) => member.type === 'CUSTOMER')
  const groups = directMembersOfTheGroup.filter((member) => member.type === 'GROUP')

  //if allUsers array is not empty, create one node and edge for "all directory users"
  if (allUsers.length > 0) {
    hierarchy.nodes.push({ id: 'all_users', label: `all directory users`, shape: 'box', color: 'yellow' })

    hierarchy.edges.push({
      from: groupObj.email,
      to: 'all_users',
      color: 'green',
    })
  }

  //if users array is not empty, create one node and edge for the total amount of users(we don't display each user separately)
  if (users.length > 0) {
    hierarchy.nodes.push({ id: 'users', label: `${[users.length]} user(s)`, shape: 'box', color: 'yellow' })

    hierarchy.edges.push({
      from: groupObj.email,
      to: 'users',
      color: 'green',
    })
  }

  //if group array is empty, return the hierarchy
  if (groups.length === 0) return hierarchy

  //otherwise,create a node for each group if it doesn't already exist in the hierarchy and an edge
  groups.forEach((group) => {
    if (!alreadyExists(hierarchy, group.email)) {
      hierarchy.nodes.push({ id: group.email, label: group.email, shape: 'box', color: 'lightgreen' })
    }

    hierarchy.edges.push({
      from: groupObj.email,
      to: group.email,
      color: 'green',
    })
  })

  //if there are no indirect members, return the hierarchy
  if (indirectMembersOfTheGroup.length === 0) return hierarchy

  //filter out only groups from all members of the group
  const childGroups = allMembersOfTheGroup.filter((member) => member.type === 'GROUP')

  if (childGroups.length === 0) return hierarchy

  //if the target group has indirect members, create a "family" object with them
  //the only purpose of creating the object is so that the "getDirectMembersArray" function can be reused
  const childGroupFamily = []

  childGroups.forEach((childGroup) => {
    const groupObj = {
      group: {
        email: childGroup.email,
      },
    }
    childGroupFamily.push(groupObj)
  })

  //get an array of direct members for each group in the downstreamfamily
  const directMembersOfChildGroups = await getDirectMembersArray({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    family: childGroupFamily,
  })

  //loop through each child group and its direct member array and create a node(if it doesn't already exist) and edge for each group and member
  //this is the hierarchy building "algorithm"
  childGroups.forEach((childGroup) => {
    const index = childGroups.indexOf(childGroup)
    const directMemberArray = directMembersOfChildGroups[index]

    if (!alreadyExists(hierarchy, childGroup.email)) {
      hierarchy.nodes.push({ id: childGroup.email, label: childGroup.email, shape: 'box' })
    }

    directMemberArray.forEach((directMember) => {
      if (directMember.type !== 'GROUP') return //we don't count users in child groups, only other groups

      if (!alreadyExists(hierarchy, directMember.email)) {
        hierarchy.nodes.push({ id: directMember.email, label: directMember.email, shape: 'box' })
      }

      hierarchy.edges.push({
        from: childGroup.email,
        to: directMember.email,
      })
    })
  })

  return hierarchy
}

/**
 * Given a target group or user, creates a hierarchical object
 * containing a nodes list and an edges list.
 * The nodes list contains objects with id, label, shape, and color keys.
 * The edges list contains objects with from, to, and color keys.
 * The color key is used to highlight the path from the target group/user to the root group.
 * @param {string} userEmail - The email address of the user to impersonate.
 * @param {string} projectId - The GCP project ID.
 * @param {string} serviceAccountEmail - The email address of the service account.
 * @param {string} serviceAccountPrivateKey - The private key of the service account.
 * @param {string} queryEmail - The email address of the target group or user.
 * @returns {Object} - A hierarchical object containing a nodes list and an edges list.
 */
async function getHierarchy({ userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, queryEmail }) {
  /**
   * Given a family of groups, creates a hierarchical object
   * containing a nodes list and an edges list.
   * The nodes list contains objects with id, label, shape, and color keys.
   * The edges list contains objects with from, to, and color keys.
   * The color key is used to highlight the path from the target group/user to the root group.
   * @param {Object[]} family - An array of group objects, each containing a group object and a list of all its members(direct and indirect).
   * @returns {Object} - A hierarchical object containing a nodes list and an edges list.
   */

  async function getHierarhyObj(family) {
    //prepare the hierarchical object
    const hierarchy = {
      nodes: [],
      edges: [],
    }

    //for each group in the family, fetch all its direct members
    const directMembers = await getDirectMembersArray({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      family,
    })

    //for each parent group, create JSON object containing membership details
    family.forEach((group) => {
      //create a node for the parent group
      if (!alreadyExists(hierarchy, group.group.email)) {
        hierarchy.nodes.push({ id: group.group.email, label: group.group.email, shape: 'box' })
      }

      //retrieve an array with direct members of the parent group
      const index = family.indexOf(group)
      const directMemberArray = directMembers[index]

      //for each direct member, add its node and edge to the hierarchy if it's related to the target group directly or indirectly
      directMemberArray.forEach((directMember) => {
        if (hasRelation(directMember.email, theGroupOrUser, family) || directMember.email === theGroupOrUser) {
          const nodeObj = {
            id: directMember.email,
            label: directMember.email,
            shape: 'box',
          }

          //if a node contains the target group, color it red
          if (directMember.email === theGroupOrUser) {
            nodeObj.color = 'red'
          }

          //to prevent duplicates, check if the node is already in the hierarchy, then add it
          if (!alreadyExists(hierarchy, directMember.email)) {
            hierarchy.nodes.push(nodeObj)
          }

          //prepare an object containing edge details
          const edgeObj = {
            from: group.group.email,
            to: directMember.email,
          }

          //if an edge connects directly from parent group to the target group, color it red
          if (directMember.email === theGroupOrUser) {
            edgeObj.color = 'red'
          }

          //push the edge to the hierarchy
          hierarchy.edges.push(edgeObj)
        }
      })
    })

    return hierarchy
  }

  const theGroupOrUser = queryEmail

  //get a list of all groups in customer organization
  const allGroups = await groupsService.listGroups({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
  })

  //leave out groups with no members to reduce number of API calls(for the upper hierarchy)
  const groups = allGroups.filter((group) => group.directMembersCount > 0)

  //get an array of parent group objects
  const family = await getFamilyWithAllMembers({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    groups,
    theGroupOrUser,
  })

  //get a hierarchy object for the upward family of the target group/user
  let hierarchy = await getHierarhyObj(family)

  //if the hierarchy is empty, add the target group/user to the hierarchy
  //this is done for error handling to differentiate from server errors
  //i.e. if there is only one node then the search was successful, but nothing found(no memberships or email address is incorrect)
  //if there are no nodes, then the search was not completed at all
  //at this point I don't differentiate between "no memberships found" and "email address is incorrect"
  if (typeof hierarchy.nodes === 'undefined' || hierarchy.nodes.length === 0) {
    hierarchy = {
      nodes: [
        {
          id: theGroupOrUser,
          label: theGroupOrUser,
          shape: 'box',
          color: 'red',
        },
      ],
      edges: [],
    }
  }

  //If the target group not in the list of all groups, we assume that it's a user(therefore, no need to build the downstream family hierarchy)
  const isGroup = allGroups.some((group) => group.email === theGroupOrUser)

  //if the target is not a group, return the hierarchy
  if (!isGroup) return hierarchy

  //get the group object
  const groupObj = allGroups.find((group) => group.email === theGroupOrUser)

  //if the group has no members, return the hierachy
  if (groupObj.directMembersCount === 0) return hierarchy

  //get all direct and indirect members of the target group
  const allMembersOfTheGroup = await groupsService.listGroupMembers({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    groupEmail: groupObj.email,
    includeDerivedMembership: true,
  })

  //get direct members of the group
  const directMembersOfTheGroup = await groupsService.listGroupMembers({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    groupEmail: groupObj.email,
    includeDerivedMembership: false,
  })

  //get indirect members of the group by subtracting direct members from all members
  //we have to do it because google API doesn't provide information about which member is direct and which is indirect
  const indirectMembersOfTheGroup = allMembersOfTheGroup.filter(
    (member) => !directMembersOfTheGroup.some((directMember) => directMember.email === member.email)
  )

  //construct the downstream hierarchy
  hierarchy = getChildren({
    userEmail,
    projectId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    groupObj,
    hierarchy,
    directMembersOfTheGroup,
    indirectMembersOfTheGroup,
    allMembersOfTheGroup,
  })

  return hierarchy
}

module.exports = {
  getNestedTable,
  getHierarchy,
}
