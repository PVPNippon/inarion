const groupsService = require('../services/groupsService')
const { getImpersonatedClientInstanceForAdmin } = require('./authService')

/**
 * Checks if the given group or user already exists in the given hierarchy as a node or edge.
 *
 * @param {Object} hierarchy - The hierarchy object with nodes and edges.
 * @param {string} groupOrUserEmail - The email address of the group or user.
 * @param {'node'|'edge'} [typeOfElement='node'] - The type of element to check for.
 * @param {string} [parentGroupEmail=''] - The parent group email, only used with edges.
 *
 * @returns {boolean} true if the group or user already exists in the hierarchy, false otherwise.
 */
function alreadyExists(hierarchy, groupOrUserEmail, typeOfElement = 'node', parentGroupEmail = '') {
  if (typeOfElement === 'node') {
    return hierarchy.nodes.some((node) => node.id === groupOrUserEmail)
  } else if (typeOfElement === 'edge') {
    return hierarchy.edges.some((edge) => edge.from === parentGroupEmail && edge.to === groupOrUserEmail)
  }
  return false
}

/**
 * Checks if the suspected parent has a direct or indirect membership relationship with the group or user.
 * (at present we only show the indirect membership if direct membership does not exists. In the future we may opt to display both, as a member can have both direct and indirect membership
 *  in the same time at the same time).
 * @param {string} suspectedParent - The email address of the suspected parent group.
 * @param {string} theGroupOrUser - The email address of the group or user to check.
 * @param {Map} family - A map of group objects, each containing a group object and a list of all its members.
 * @returns {boolean} True if the suspected parent has a membership relationship with the group or user.
 */
function hasRelation(suspectedParent, theGroupOrUser, family) {
  //get suspected  transitive parent object from family Map
  const suspectedParentObj = family.get(suspectedParent)

  //if the suspected parent is not found, return false
  if (typeof suspectedParentObj === 'undefined') return false

  //if the suspected parent has a membership relationship with the group or user, return true, otherwise false
  return suspectedParentObj.members.some((member) => member.email === theGroupOrUser)
}

/**
 * Creates a map of group objects, each containing a group object and a list of all its members, direct and indirect.
 * The map is created by fetching the members of each group in the given array of groups.
 * The map only contains the groups which are direct or indirect ancestor of the given target group or user.
 * The key for each entry in the map is the email address of the group.
 *
 * @param {Object} options - An object containing the following properties:
 *   - {string} userEmail - The email address of the user to impersonate.
 *   - {Object[]} groups - An array of group objects, each containing at least the email address of the group.
 *   - {string} theGroupOrUser - The email address of the target group or user.
 *   - {Object} [client] - An existing impersonated auth client for Directory API.
 * @returns {Promise<Map<string, {group: Object, members: Object[]}>}
 *   A promise that resolves to a map of group objects, each containing a group object and a list of all its members.
 */
async function getFamilyWithAllMembers({ userEmail, groups, theGroupOrUser, client }) {
  //create a map of group objects, each containing a group object and a list of all its members
  const promises = groups.map((group) =>
    groupsService.listGroupMembers({
      userEmail,
      groupEmail: group.email,
      includeDerivedMembership: true,
      client,
    })
  )

  const family = new Map() //create an empty map

  //get all members for each group
  const membersArray = await Promise.all(promises)

  //add group object and member array for each group to the map, using group email as a key
  membersArray.forEach((members, index) => {
    if (members.some((member) => member.email === theGroupOrUser)) {
      family.set(groups[index].email, {
        group: groups[index],
        members,
      })
    }
  })

  return family //returns a Map containing the ancestor groups details and all its members(direct+indirect)
  //for now I keep all the data in, because we might need something else in the future, like group ID or member type etc.
  //NB that the family contains only the groups which are direct or indirect ancestor of the target group or user
}

/**
 * Retrieves an array of direct members for each group in the provided family map.
 *
 * This function takes the user's email, a map of group objects, and an optional client to impersonate.
 * For each group in the family map, it fetches the list of direct members by querying the Google Admin Directory API.
 * This is done because the API method that returns all members does not differentiate between direct and indirect members.
 *
 * @param {Object} options - An object containing the following properties:
 *   - {string} userEmail - The email address of the user to impersonate.
 *   - {Map} family - A map of group objects, where each key is a group's email and each value contains the group object and its members.
 *   - {Object} [client] - An existing impersonated auth client for Directory API.
 * @returns {Promise<Object[][]>} - A promise that resolves to an array of arrays, each containing the direct members of the corresponding group.
 */
async function getDirectMembersArray({ userEmail, family, client }) {
  //get direct member array for each group
  const promises = [...family.keys()].map((groupEmail) =>
    groupsService.listGroupMembers({
      userEmail,
      groupEmail,
      includeDerivedMembership: false,
      client,
    })
  )

  return await Promise.all(promises)
}

/**
 * Finds and returns a list of transitive parent groups for a given group or user.
 *
 * This function examines the direct members of potential parent groups to determine
 * if there is a membership relationship with the specified
 * group or user. If such a relationship exists, the parent group is considered
 * transitive and added to the list of transitive parents.
 *
 * A transitive is an ancestor ONE LEVEL DOWN from the top level ancestor. There can be multiple same-level transitive parents.
 * @param {Map} family - A map containing group objects and their members.
 * @param {Object[]} directMembersArray - An array of objects representing direct members of groups.
 * @param {string} theGroupOrUser - The email address of the group or user to check for transitive membership.
 * @returns {string[]} - An array of emails of transitive parent groups.
 */
function getTransitive(family, directMembersArray, theGroupOrUser) {
  const transitiveParents = []

  //find corresponding array in the directMembersArray that contains direct members of the top level parent
  //iterate through direct members of the top level parent
  //check if there is a membership relationship with the target group or user
  //if so, add to transitiveParents

  directMembersArray.forEach((suspectedParent) => {
    if (suspectedParent.type !== 'GROUP') return //skip if member type is not a group

    if (hasRelation(suspectedParent.email, theGroupOrUser, family)) {
      transitiveParents.push(suspectedParent.email)
    }
  })

  return transitiveParents
}

/**
 * Retrieves the joined time of a group or user from the activity logs.
 *
 * The function takes an array of all activities, member ID, group ID, and all groups as arguments.
 * It then iterates through all activities and checks if the member ID and group ID matches with the target group and member.
 * If yes, it returns the joining time in the format 'MMM d, yyyy, h:mm a z'.
 * Otherwise, it returns 'not found'.
 *
 * @param {Object[]} allActivities - An array of objects containing activity logs.
 * @param {string} memberId - The email address of the member.
 * @param {string} groupId - The email address of the group.
 * @param {Object[]} allGroups - An array of objects containing all groups.
 * @returns {string} - The joined time in the format 'MMM d, yyyy, h:mm a z' or 'not found' if no logs are found.
 */
function getJoinedTime(allActivities, memberId, groupId, allGroups) {
  //since logs are only available for last 6 months, in many cases there won't be any joining logs
  //or logs can just be gone from google server due to malfunction on their side
  //or the group email or member changed after the log was created

  //iterate through all activities
  for (const activity of allActivities) {
    //if activity is undefined or null, move to the next activity
    if (!activity) continue

    //retrieve member and group id from activity
    //all groups joined logs can be devided in 2 types: when added member is the actor, or  when they are target of the action
    //if member is the actor, there will be only 1 parameter in the parameters array, which will contain the group email. And member email will be in activity.actor email
    //if member is the target of the action, there will be 2 parameters, where the first is member email and second is group email
    const event = activity.events[0].parameters //get parameters array

    //declare variables
    let member_Id //placeholder for member id retrieved from the logs
    let group_Id //placeholder for group id retrieved from the logs

    //if there is only 1 parameter in the array, grab group email from it, and grab member email from activity actor
    //otherwise, grab group email from 2nd parameter, and grab member email from 1st parameter
    if (event.length === 1) {
      group_Id = event[0].value
      member_Id = activity.actor.email
    } else {
      group_Id = event[1].value
      member_Id = event[0].value
    }

    //check if member and group id matches with target group and member
    //if yes, return the joining time
    //othewise, move to the next activity
    if ((member_Id === memberId || (member_Id === '*' && !isGroup(allGroups, memberId))) && group_Id === groupId) {
      return new Date(activity.id.time).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZoneName: 'short',
        timeZone: 'Asia/Tokyo',
      })
    }
  }

  return 'not found' // Return default value if no logs are found
}

/**
 * Checks if a given group or user is a group by searching for it in a list of all groups.
 *
 * @param {Object[]} allGroupsArray - An array of objects, each representing a group.
 * @param {string} theGroupOrUser - The email address of the group or user to check.
 * @returns {boolean} true if the target is a group, false otherwise.
 */
//We need this function because of the "all organization users" type of membership which comes in logs in "CUSTOMER".
//Both nested groups table and groups hierarchy can be used for users and groups,
//But some logic is only applied to users, so we need to know what type of member the target is, and you cannot identify if it is a group or a user by email address only
function isGroup(allGroupsArray, theGroupOrUser) {
  //check if the target is a group by searching its email address in the list of all customer's groups
  return allGroupsArray.some((group) => group.email === theGroupOrUser)
}

/**
 * Constructs a table representing the membership details of a specified group or user within a family of groups.
 *
 * This function takes in information about a user's email, a family map of groups with their members,
 * the target group or user, all groups available, and directory and reports clients for API access.
 * It retrieves group joining logs and direct members of groups to determine the membership type (direct or inherited),
 * and constructs a table with columns for group email, membership type, inherited path, and join timestamp.
 *
 * @param {Object} options - An object containing the following properties:
 *   - {string} userEmail - The email address of the user to impersonate.
 *   - {Map<string, {group: Object, members: Object[]}>} family - A map of group objects and their members.
 *   - {string} theGroupOrUser - The email address of the target group or user.
 *   - {Object[]} allGroups - An array of objects containing all groups.
 *   - {Object} [directoryClient] - An existing impersonated auth client for Directory API.
 *   - {Object} [reportsClient] - An existing impersonated auth client for Reports API.
 * @returns {Promise<Object[]>} - A promise that resolves to an array representing the membership table.
 */
async function getTable({ userEmail, family, theGroupOrUser, allGroups, directoryClient, reportsClient }) {
  const table = []

  //get an array with group joining logs for the last 6 months
  //the reason why we need them is because google API does not provide a joined timestamp
  //so we need to get it ourselves in a roundabout way
  //but it won't be 100% accurate
  const allActivities = await groupsService.getGroupJoinLogs({
    userEmail,
    client: reportsClient,
  })

  //for each group in the family, fetch all its direct members
  //the reason why we need to fetch all direct members separately is because
  //the API method which returns all members(direct and indirect) does not say which member is direct and which is indirect
  //so we need to find it out by ourselves in a roundabout way
  const directMembers = await getDirectMembersArray({
    userEmail,
    family,
    client: directoryClient,
  })

  //for each ancestor group, create JSON object containing membership details
  directMembers.forEach((directMembersArray, index) => {
    const groupEmail = [...family][index][0]

    const obj = {
      email: groupEmail, //the "group" column of the table
    }

    //sift through for each group's direct member array to find out if our target group/user is among direct members or the user is among "all organization users"
    const targetParentGroup = directMembersArray.find(
      (member) => member.email === theGroupOrUser || (member.type === 'CUSTOMER' && !isGroup(allGroups, theGroupOrUser))
    )

    //if it's a direct member or "all organization users", create a table row with empty "via" columnt and fetch a timestamp
    //otherwise, create a row with "via" column and leave the timestamp empty
    if (targetParentGroup) {
      obj.membership = 'Direct' //the "membership type" column of the table
      obj.inherited = '' //"inherited via" column of the table, left empty for direct memberships
      obj.timestamp = getJoinedTime(allActivities, theGroupOrUser, groupEmail, allGroups)
    } else {
      let inheritedVia = getTransitive(family, directMembersArray, theGroupOrUser) || []
      inheritedVia = inheritedVia.join(', ')
      obj.membership = 'Inherited' //the "membership type" column of the table
      obj.inherited = inheritedVia //"inherited via" column of the table
      obj.timestamp = '' //"timestamp" column of the table, left empty for inherited memberships (for now)
    }
    table.push(obj)
  })

  return table
}

/**
 * Retrieves a table of all groups that a given group or user is a member of, either directly or indirectly.
 * The table contains columns for the group email, the type of membership (direct or indirect), and the timestamp
 * of when the membership was created.
 *
 * @param {Object} options - An object containing the following properties:
 *   - {string} userEmail - The email address of the user to impersonate.
 *   - {string} queryEmail - The email address of the group or user to query.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of objects, each containing the details of a group
 *   that the target group or user is a member of.
 */
async function getNestedTable({ userEmail, queryEmail }) {
  //TODO: refactor the code to reduce the number of API calls(postponed till the next iteration)
  const theGroupOrUser = queryEmail

  //get impersonated clients
  const directoryClient = await getImpersonatedClientInstanceForAdmin(userEmail, 'directory')
  const reportsClient = await getImpersonatedClientInstanceForAdmin(userEmail, 'reports')

  //get a list of all groups in customer organization
  const allGroups = await groupsService.listGroups({
    userEmail,
    client: directoryClient,
  })

  //leave out groups with no members to reduce number of API calls
  const groups = allGroups.filter((group) => group.directMembersCount > 0)

  //get an array of parent group objects
  const family = await getFamilyWithAllMembers({
    userEmail,
    groups,
    theGroupOrUser,
    client: directoryClient,
  })

  //if there are no groups in the family, return an empty array
  if (family.size === 0) return []

  //get an array with membership details and timestamp for each parent/grandparent group of the target group/user
  const table = await getTable({
    userEmail,
    family,
    theGroupOrUser,
    allGroups,
    directoryClient,
    reportsClient,
  })

  return table
}

/**
 * Recursively constructs a hierarchical object representing the descendant groups of a given group.
 * The hierarchy object contains a nodes list and an edges list.
 * The nodes list contains objects with id, label, shape, and color keys.
 * The edges list contains objects with from, to, and color keys.
 * The color key is used to highlight the path from the target group to the root group.
 * @param {Object} options - An object containing the following properties:
 *   - {string} userEmail - The email address of the user to impersonate.
 *   - {Object} groupObj - The group object of the target group.
 *   - {Object} hierarchy - The object representing the hierarchy.
 *   - {Object[]} directMembersOfTheGroup - An array of direct members of the group.
 *   - {Object[]} indirectMembersOfTheGroup - An array of indirect members of the group.
 *   - {Object[]} allMembersOfTheGroup - An array of all members of the group.
 *   - {Object} [client=null] - An existing impersonated auth client for Directory API.
 * @returns {Promise<Object>} - A promise that resolves to the constructed hierarchy object.
 */
async function getDescendantHierarchy({
  userEmail,
  groupObj,
  hierarchy,
  directMembersOfTheGroup,
  indirectMembersOfTheGroup,
  allMembersOfTheGroup,
  client,
}) {
  //TODO: refactor the code to reduce the number of API calls(postponed till the next iteration)

  //filter users, "all organizastion users" and group members separately
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

    if (!alreadyExists(hierarchy, group.email, 'edge', groupObj.email)) {
      hierarchy.edges.push({
        from: groupObj.email,
        to: group.email,
        color: 'green',
      })
    }
  })

  //if there are no indirect members, return the hierarchy
  if (indirectMembersOfTheGroup.length === 0) return hierarchy

  //filter out only groups from all members of the group
  const childGroups = allMembersOfTheGroup.filter((member) => member.type === 'GROUP')

  if (childGroups.length === 0) return hierarchy

  //if the target group has indirect members, create a "family" Map with them
  //the only purpose of creating the Map is so that the "getDirectMembersArray" function can be reused
  const childGroupFamily = new Map()

  childGroups.forEach((childGroup) => {
    childGroupFamily.set(childGroup.email, {
      group: {
        email: childGroup.email,
      },
    })
  })

  //get an array of direct members for each group in the downstreamfamily
  const directMembersOfChildGroups = await getDirectMembersArray({
    userEmail,
    family: childGroupFamily,
    client,
  })

  //loop through each descendant group and its direct member array and create a node(if it doesn't already exist) and edge for each group and member
  //this is the hierarchy building "algorithm"
  childGroups.forEach((childGroup, index) => {
    const directMemberArray = directMembersOfChildGroups[index]

    if (!alreadyExists(hierarchy, childGroup.email)) {
      hierarchy.nodes.push({ id: childGroup.email, label: childGroup.email, shape: 'box' })
    }

    directMemberArray.forEach((directMember) => {
      if (directMember.type !== 'GROUP') return //we don't count users in child groups, only other groups

      if (!alreadyExists(hierarchy, directMember.email)) {
        hierarchy.nodes.push({ id: directMember.email, label: directMember.email, shape: 'box' })
      }

      if (!alreadyExists(hierarchy, directMember.email, 'edge', childGroup.email)) {
        hierarchy.edges.push({
          from: childGroup.email,
          to: directMember.email,
        })
      }
    })
  })

  return hierarchy
}

/**
 * Constructs a hierarchical representation of ancestor groups for a specified group or user.
 *
 * This function iterates over a family map of groups, fetching direct members
 * to build a hierarchy of nodes and edges. Direct relationships to the target
 * group or user are highlighted in the hierarchy.
 *
 * @param {Object} options - An object containing the following properties:
 *   - {string} userEmail - The email address of the user to impersonate.
 *   - {Map} family - A map containing group objects and their members.
 *   - {string} theGroupOrUser - The email address of the target group or user.
 *   - {Object[]} allGroups - An array of all groups to assist in determining if the target is a group.
 *   - {Object} [client] - An existing impersonated auth client for Directory API.
 * @returns {Promise<Object>} - A promise that resolves to the constructed hierarchy object.
 */
async function getAncestorHierarchy({ userEmail, family, theGroupOrUser, allGroups, client }) {
  //TODO: refactor the code to reduce the number of API calls(postponed till the next iteration)
  //prepare the hierarchical object
  const hierarchy = {
    nodes: [],
    edges: [],
  }

  //for each group in the family, fetch all its direct members
  const directMembers = await getDirectMembersArray({
    userEmail,
    family,
    client,
  })

  //for each ancestor group, create JSON object containing membership details
  family.forEach((group, index) => {
    //create a node for the parent group
    if (!alreadyExists(hierarchy, group.group.email)) {
      hierarchy.nodes.push({ id: group.group.email, label: group.group.email, shape: 'box' })
    }

    //retrieve an array with direct members of the ancestor group
    const entries = Array.from(family.entries())
    const arrayIndex = entries.findIndex(([key, value]) => key === index)
    const directMemberArray = directMembers[arrayIndex]

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
        //I have removed the code to prevent edge duplicates, because otherwise some edges in cases when a member has both direct and indirect memberships were missing
        hierarchy.edges.push(edgeObj)
      }

      //if an ancestor group has a member called 'CUSTOMER'(i.e. all organizations members), then add it to the hierarchy(only applied when the target is a user)
      if (directMember.type === 'CUSTOMER' && !isGroup(allGroups, theGroupOrUser)) {
        if (!alreadyExists(hierarchy, theGroupOrUser)) {
          hierarchy.nodes.push({
            id: theGroupOrUser,
            label: theGroupOrUser,
            shape: 'box',
            color: 'red',
          })
        }

        if (!alreadyExists(hierarchy, theGroupOrUser, 'edge', group.group.email)) {
          hierarchy.edges.push({
            from: group.group.email,
            to: theGroupOrUser,
            color: 'red',
          })
        }
      }
    })
  })

  return hierarchy
}

/**
 * Retrieves a hierarchical representation of groups for a given email address.
 *
 * The hierarchy represents both the upward and downward family of the target group/user.
 * The upward family is the set of all ancestor groups of the target group/user.
 * The downward family is the set of all descendant groups and users of the target group.
 *
 * @param {Object} options - An object containing the following properties:
 *   - {string} userEmail - The email address of the user to impersonate.
 *   - {string} queryEmail - The email address of the group or user to query.
 * @returns {Promise<Object>} - A promise that resolves to the group hierarchy object.
 *   The hierarchy object contains a nodes and an edges list.
 *   The nodes list contains objects with id, label, shape, and color keys.
 *   The edges list contains objects with from, to, and color keys.
 *   The color key is used to highlight the path from the target group to the root group.
 */
async function getHierarchy({ userEmail, queryEmail }) {
  const theGroupOrUser = queryEmail

  //fetch an impersonated directory client
  //the reason I'm using directoryClient and not just client is because in the future
  //we may need add other services such as reportsClient, for example to add joined timestamps to the hierarchy nodes
  const directoryClient = await getImpersonatedClientInstanceForAdmin(userEmail, 'directory')

  //get a list of all groups in customer organization
  const allGroups = await groupsService.listGroups({
    userEmail,
    client: directoryClient,
  })

  //leave out groups with no members to reduce number of API calls(for the upper hierarchy)
  const groups = allGroups.filter((group) => group.directMembersCount > 0)

  //get an array of parent group objects
  const family = await getFamilyWithAllMembers({
    userEmail,
    groups,
    theGroupOrUser,
    client: directoryClient,
  })

  //get a hierarchy object for the upward family of the target group/user
  let hierarchy = await getAncestorHierarchy({
    userEmail,
    family,
    theGroupOrUser,
    allGroups,
    client: directoryClient,
  })

  //if the hierarchy is empty, add the target group/user to the hierarchy
  //this is done for error handling to differentiate from server errors
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

  //if the target is not a group, return the hierarchy
  if (!isGroup(allGroups, theGroupOrUser)) return hierarchy

  //get the group object
  const groupObj = allGroups.find((group) => group.email === theGroupOrUser)

  //if the group has no members, return the hierachy
  if (groupObj.directMembersCount === 0) return hierarchy

  //get all direct and indirect members of the target group
  const allMembersOfTheGroup = await groupsService.listGroupMembers({
    userEmail,
    groupEmail: groupObj.email,
    includeDerivedMembership: true,
    client: directoryClient,
  })

  //get direct members of the group
  const directMembersOfTheGroup = await groupsService.listGroupMembers({
    userEmail,
    groupEmail: groupObj.email,
    includeDerivedMembership: false,
    client: directoryClient,
  })

  //get indirect members of the group by subtracting direct members from all members
  //we have to do it because google API doesn't provide information about which member is direct and which is indirect
  const indirectMembersOfTheGroup = allMembersOfTheGroup.filter(
    (member) => !directMembersOfTheGroup.some((directMember) => directMember.email === member.email)
  )

  //construct the downstream hierarchy
  hierarchy = getDescendantHierarchy({
    userEmail,
    groupObj,
    hierarchy,
    directMembersOfTheGroup,
    indirectMembersOfTheGroup,
    allMembersOfTheGroup,
    client: directoryClient,
  })

  return hierarchy
}

module.exports = {
  getNestedTable,
  getHierarchy,
}
