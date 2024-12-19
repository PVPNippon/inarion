const groupsCacheService = require('../services/groupsCacheService.js')
const groupsUtilityFunctions = require('../utility/groupsUtilityFunctions.js')
const groupsService = require('../services/groupsService.js')
const { groupssettings } = require('googleapis/build/src/apis/groupssettings/index.js')

async function getAllGroupInfosFromCache(req, res, next) {
  try {
    const groupInfos = await groupsCacheService.getAllGroupInfos()
    if (groupInfos.length > 0) {
      groupsUtilityFunctions.sortGroupInfosByEmail(groupInfos)

      // testing
      return res.status(200).json({
        type: 'cache',
        groups: groupInfos
      })
    }
  } catch (error) {
    console.log('Error fetching all groups\' info from cache:', error)
  }

  next()
}

async function setAllGroupInfosInCache(req, res, next) {
  try {
    const { groupInfos } = res.locals

    const emailsToIdsObj = groupsUtilityFunctions.getGroupEmailsToIdsObj(groupInfos)
    emailsToIdsObj['list'] = 'list'

    const result = await Promise.all([
      groupsCacheService.overwriteGroupIds(emailsToIdsObj),
      groupsCacheService.setGroupInfos(groupInfos)
    ])

    console.log('Stored all groups\' ids and info in cache:', result)
  } catch (error) {
    console.log('Error storing all groups\' info in cache:', error)
  }

  next()
}

async function getGroupInfoFromCache(req, res, next) {
  const { groupEmail } = req.body

  try {
    const groupInfo = await groupsCacheService.getGroupInfo(groupEmail)
    if (groupInfo) {
      return res.status(200).json(groupInfo)
    }
  } catch (error) {
    console.log('Error fetching groupInfo from cache:', error)
  }
  
  // Call the Google API if data could not be retrieved from cache for some reason.
  next()
}

async function setGroupInfoInCache(req, res, next) {
  const { groupInfo } = res.locals
  const emailsToIdsObj = groupsUtilityFunctions.getGroupEmailsToIdsObj(groupInfo)

  try {
    const result = await Promise.all([
      groupsCacheService.setGroupIds(emailsToIdsObj),
      groupsCacheService.setGroupInfo(groupInfo)
    ])
    console.log('Stored the group\'s id and info in cache:', result)
  } catch (error) {
    console.log('Error storing groupInfo in cache:', error)
  }

  next()
}






async function getGroupMembersFromCache(req, res, next) {
  const { groupEmail } = req.body

  try {
    const groupMembers = await groupsCacheService.getMembers(groupEmail)
    if (groupMembers) {
      return res.status(200).json(groupMembers)
    }
  } catch (error) {
    console.log('Error fetching groupInfo from cache:', error)
  }
  
  // Call the Google API if data could not be retrieved from cache for some reason.
  next()
}

async function setGroupMembersInCache(req, res) {
  const { groupEmail } = req.body
  const { groupMembers } = res.locals
  
  try {
    let groupId = await groupsCacheService.getGroupId(groupEmail)

    if (groupId !== null) {
      const result = await groupsCacheService.overwriteMembersById(groupId, groupMembers)
      console.log('Stored members in cache:', result)
      return
    }

    const { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey } = req.body
    const groupInfo = await groupsService.getGroupByEmail({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmail,
    })

    groupId = groupInfo.id

    const emailsToIdsObj = groupsUtilityFunctions.getGroupEmailsToIdsObj(groupInfo)

    const result = await Promise.all([
        groupsCacheService.setGroupIds(emailsToIdsObj),
        groupsCacheService.setGroupInfo(groupInfo),
        groupsCacheService.overwriteMembersById(groupId, groupMembers)
    ])

    console.log('Stored id, info and members in cache:', result)
    
  } catch (error) {
    console.log('Error storing groupInfo in cache:', error)
  }
}

async function getGroupDescendantsFromCache(req, res, next) {
  const { groupEmail } = req.body

  try {
    const groupDescendants = await groupsCacheService.getDescendants(groupEmail)
    if (groupDescendants) {
      return res.status(200).json(groupDescendants)
    }
  } catch (error) {
    console.log('Error fetching descendants from cache:', error)
  }
  
  // Call the Google API if data could not be retrieved from cache for some reason.
  next()
}

async function setGroupDescendantsInCache(req, res) {
  const { groupEmail } = req.body
  const { groupDescendants } = res.locals
  
  try {
    let groupId = await groupsCacheService.getGroupId(groupEmail)

    if (groupId !== null) {
      const result = await groupsCacheService.overwriteDescendantsById(groupId, groupDescendants)
      console.log('Stored members in cache:', result)
      return
    }

    const { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey } = req.body
    const groupInfo = await groupsService.getGroupByEmail({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmail,
    })

    groupId = groupInfo.id

    const emailsToIdsObj = groupsUtilityFunctions.getGroupEmailsToIdsObj(groupInfo)

    const result = await Promise.all([
        groupsCacheService.setGroupIds(emailsToIdsObj),
        groupsCacheService.setGroupInfo(groupInfo),
        groupsCacheService.overwriteDescendantsById(groupId, groupDescendants)
    ])

    console.log('Stored id, info and descendants in cache:', result)
    
  } catch (error) {
    console.log('Error storing groupInfo in cache:', error)
  }
}

async function getGroupSettingsFromCache(req, res, next) {
  const { groupEmail } = req.body

  try {
    const groupSettings = await groupsCacheService.getGroupSettings(groupEmail)
    if (groupssettings) {
      return res.status(200).json(groupSettings)
    }
  } catch (error) {
    console.log('Error fetching groupInfo from cache:', error)
  }
  
  // Call the Google API if data could not be retrieved from cache for some reason.
  next()
}

async function setGroupSettingsInCache(req, res, next) {
  const { groupEmail } = req.body
  const { groupSettings } = res.locals
  
  try {
    let groupId = await groupsCacheService.getGroupId(groupEmail)

    if (groupId !== null) {
      const result = await groupsCacheService.setGroupSettingsById(groupId, groupSettings)
      console.log('Stored settings in cache:', result)
      return
    }

    const { userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey } = req.body
    const groupInfo = await groupsService.getGroupByEmail({
      userEmail,
      projectId,
      serviceAccountEmail,
      serviceAccountPrivateKey,
      groupEmail,
    })

    groupId = groupInfo.id

    const emailsToIdsObj = groupsUtilityFunctions.getGroupEmailsToIdsObj(groupInfo)

    const result = await Promise.all([
        groupsCacheService.setGroupIds(emailsToIdsObj),
        groupsCacheService.setGroupInfo(groupInfo),
        groupsCacheService.setGroupSettingsById(groupId, groupSettings)
    ])

    console.log('Stored id, info and settings in cache:', result)
    
  } catch (error) {
    console.log('Error storing settings in cache:', error)
  }
}

module.exports = {
  getAllGroupInfosFromCache,
  setAllGroupInfosInCache,
  getGroupInfoFromCache,
  setGroupInfoInCache,

  getGroupMembersFromCache,
  setGroupMembersInCache,

  getGroupDescendantsFromCache,
  setGroupDescendantsInCache,

  getGroupSettingsFromCache,
  setGroupSettingsInCache,
}