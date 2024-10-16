const { google } = require('googleapis')
const { getClient } = require('../utility/groupsUtilityFunctions')

//WARNING:
//the logic below is neither optimized nor checked properly.
//Don't look down here for the sake of your sanity.
async function getNestedTable(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey, queryEmail) {
  const jwtClient = await getClient(serviceAccountEmail, serviceAccountPrivateKey, userEmail)

  try {
    const directory = google.admin({
      version: 'directory_v1',
      auth: jwtClient,
    })
    const theGroup = queryEmail
    const response = await directory.groups.list({
      customer: 'my_customer',
      maxResults: 200, //max allowed value
      orderBy: 'email',
    })

    let groups = response.data.groups
    groups = groups.filter((group) => group.directMembersCount > 0)

    async function getFamily(groups) {
      const promises = []
      const family = []
      groups.forEach(async (group) => {
        const x = new Promise((resolve, reject) => {
          resolve(
            directory.members.list({
              groupKey: group.email,
              maxResults: 200, //max allowed value
              includeDerivedMembership: true,
            })
          )
        })
        promises.push(x)
      })
      await Promise.all(promises).then((values) => {
        values.forEach((value) => {
          family.push(value.data.members)
        })
      })
      return family
    }

    const allMembers = await getFamily(groups)

    const family = []

    allMembers.forEach((members) => {
      members.forEach((member) => {
        if (member.email === theGroup) {
          const index = allMembers.indexOf(members)
          const groupAndAllMembers = {
            group: groups[index],
            members: members,
          }
          family.push(groupAndAllMembers)
        }
      })
    })

    function hasRelation(suspectedParent, indirectParent, family) {
      const indirectParentObj = family.find((group) => group.group.email === indirectParent)
      const directMembers = indirectParentObj.members
      const target = directMembers.filter((member) => member.email === suspectedParent)
      if (target.length > 0) {
        return true
      } else {
        return false
      }
    }
    function getTransitive(family, directMembersArray, theGroup, indirectParent) {
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
          const target = members.filter((member) => member.email === theGroup)
          if (target.length > 0 && hasRelation(group.group.email, indirectParent, fullFamily)) {
            directParent = group.group.email
          }
        })
      while (directParent === '')
      return directParent
    }

    async function getTimestamps() {
      try {
        const response = await fetch('http://localhost:4000/groups/get-group-joined-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: userEmail,
            projectId: projectId,
            serviceAccountEmail: serviceAccountEmail,
            serviceAccountPrivateKey: serviceAccountPrivateKey,
          }),
        })
        const data = await response.json()
        return data
      } catch (error) {
        console.log(error)
      }
    }

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

    async function getTable(family) {
      const table = []
      const promises = []
      const relations = []

      family.forEach(async (group) => {
        const directMembers = new Promise((resolve, reject) => {
          resolve(
            directory.members.list({
              groupKey: group.group.email,
              maxResults: 200, //max allowed value
              includeDerivedMembership: false,
            })
          )
        })
        promises.push(directMembers)
      })
      await Promise.all(promises).then((values) => {
        values.forEach((value) => {
          relations.push(value.data.members)
        })
      })

      relations.forEach((relation) => {
        const index = relations.indexOf(relation)
        const group = family[index]
        const obj = {
          email: group.group.email,
          timestamp: '',
        }

        const targetGroup = relation.filter((member) => member.email === theGroup)

        if (targetGroup.length > 0) {
          obj.membership = 'Direct'
          obj.inherited = ''
        } else {
          const inheritedVia = getTransitive(family, relations, theGroup, group.group.email) || ''
          obj.membership = 'Inherited'
          obj.inherited = inheritedVia
        }
        table.push(obj)
      })

      return table
    }

    const table = await getTable(family)
    async function updateTable(table) {
      const allActivities = await getTimestamps()
      const updatedTable = table

      updatedTable.forEach((member) => {
        let parentEmail
        if (member.membership === 'Inherited') {
          parentEmail = member.inherited
        } else if (member.membership === 'Direct') {
          parentEmail = member.email
        }
        member.timestamp = getJoinedTime(allActivities, theGroup, parentEmail)
      })

      return updatedTable
    }
    const updatedTable = await updateTable(table)
    return updatedTable
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  getNestedTable,
}
