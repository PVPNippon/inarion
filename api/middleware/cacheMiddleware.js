const groupsCacheService = require('../services/groupsCacheService.js')
const groupsUtilityFunctions = require('../utility/groupsUtilityFunctions.js')
const groupsService = require('../services/groupsService.js')

async function getAllGroupInfosFromCache(req, res, next) {
  try {
    const groups = await groupsCacheService.getAllGroupInfos(true)
    if (groups) {
      groupsUtilityFunctions.sortGroupInfosByEmail(groups)
      res.locals.data = groups
      res.locals.cached = true
    }
  } catch (error) {
    console.log('Error fetching all groups\' info from cache:', error)
  }

  next()
}

async function setAllGroupInfosInCache(req, res, next) {
  next()

  if (res.locals.cached) {
    return
  }

  try {
    const groupInfos = res.locals.data

    const emailsToIdsObj = groupsUtilityFunctions.getGroupEmailsToIdsObj(groupInfos)
    emailsToIdsObj['hasAllGroups'] = 'hasAllGroups'

    const result = await Promise.all([
      groupsCacheService.overwriteGroupIds(emailsToIdsObj),
      groupsCacheService.setGroupInfos(groupInfos)
    ])

    console.log('Stored all groups\' ids and info in cache:', result)
  } catch (error) {
    console.log('Error storing all groups\' info in cache:', error)
  }
}

async function getGroupInfoFromCache(req, res, next) {
  const { groupEmail } = req.body

  try {
    const groupInfo = await groupsCacheService.getGroupInfo(groupEmail)
    if (groupInfo) {
      res.locals.data = groupInfo
      res.locals.cached = true
    }
  } catch (error) {
    console.log('Error fetching groupInfo from cache:', error)
  }
  
  // Call the Google API if data could not be retrieved from cache for some reason.
  next()
}

async function setGroupInfoInCache(req, res, next) {
  next()

  if (res.locals.cached) {
    return
  }

  const groupInfo = res.locals.data
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
}

async function getGroupMembersFromCache(req, res, next) {
  const { groupEmail } = req.body

  try {
    const members = await groupsCacheService.getMembers(groupEmail)
    if (members) {
      res.locals.data = members
      res.locals.cached = true
    }
  } catch (error) {
    console.log('Error fetching groupInfo from cache:', error)
  }
  
  // Call the Google API if data could not be retrieved from cache for some reason.
  next()
}

async function setGroupMembersInCache(req, res, next) {
  next()

  if (res.locals.cached) {
    return
  }

  const { groupEmail } = req.body
  const members = res.locals.data

  try {
    // グループ ID をキャッシュから取得
    const cachedGroupId = await groupsCacheService.getGroupId(groupEmail)

    // グループ ID がキャッシュから取得できれば, グループ ID をキーにしてメンバー情報をキャッシュに保存して処理を終える
    // グループ ID がキャッシュにない（cachedGroupId === null）場合は Google API でグループ情報を取得する必要がある
    // グループ ID がネガティブキャッシュされている（cachedGroupId === 'negativeCache'）場合, このミドルウェアまで処理が到達している時点でグループは存在するはずなのでやはり Google API でグループ情報を取得
    if (cachedGroupId !== null && cachedGroupId !== 'negativeCache') {
      const result = await groupsCacheService.overwriteMembersById(cachedGroupId, members)
      console.log('Stored members in cache:', result);
      return
    }
  } catch (error) {
    // グループ ID をキャッシュから取得する際に何らかのエラーが発生した場合はログを表示して処理を継続
    console.log('Error fetching groupId from cache and storing members in cache:', error)
  }

  // グループ ID がキャッシュから取得できなければ, Google API をコール
  // この時ついでにグループ情報も取得
  try {
    const { userEmail } = req.body
    const groupInfo = await groupsService.getGroupByEmail({
      userEmail,
      groupEmail,
    })

    const groupId = groupInfo.id

    const emailsToIdsObj = groupsUtilityFunctions.getGroupEmailsToIdsObj(groupInfo)

    const result = await Promise.allSettled([
        groupsCacheService.setGroupIds(emailsToIdsObj),
        groupsCacheService.setGroupInfo(groupInfo),
        groupsCacheService.overwriteMembersById(groupId, members)
    ])

    console.log('Stored the group\'s id, info and members in cache:', result)
    
  } catch (error) {
    console.log('Error storing the group\'s id, info and members in cache:', error)
  }
}

async function getGroupDescendantsFromCache(req, res, next) {
  const { groupEmail } = req.body

  try {
    const descendants = await groupsCacheService.getDescendants(groupEmail)
    if (descendants) {
      res.locals.data = descendants
      res.locals.cached = true
    }
  } catch (error) {
    console.log('Error fetching descendants from cache:', error)
  }
  
  // Call the Google API if data could not be retrieved from cache for some reason.
  next()
}

async function setGroupDescendantsInCache(req, res, next) {
  next()

  if (res.locals.cached) {
    return
  }

  const { groupEmail } = req.body
  const descendants = res.locals.data

  try {
    // グループ ID をキャッシュから取得
    const cachedGroupId = await groupsCacheService.getGroupId(groupEmail)

    // グループ ID がキャッシュから取得できれば, グループ ID をキーにしてメンバー情報をキャッシュに保存して処理を終える
    // グループ ID がキャッシュにない（cachedGroupId === null）場合は Google API でグループ情報を取得する必要がある
    // グループ ID がネガティブキャッシュされている（cachedGroupId === 'negativeCache'）場合, このミドルウェアまで処理が到達している時点でグループは存在するはずなのでやはり Google API でグループ情報を取得
    if (cachedGroupId !== null && cachedGroupId !== 'negativeCache') {
      const result = await groupsCacheService.overwriteDescendantsById(cachedGroupId, descendants)
      console.log('Stored descendants in cache:', result);
      return
    }
  } catch (error) {
    // グループ ID をキャッシュから取得する際に何らかのエラーが発生した場合はログを表示して処理を継続
    console.log('Error fetching groupId from cache and storing descendants in cache:', error)
  }

  // グループ ID がキャッシュから取得できなければ, Google API をコール
  // この時ついでにグループ情報も取得
  try {
    const { userEmail } = req.body
    const groupInfo = await groupsService.getGroupByEmail({
      userEmail,
      groupEmail,
    })

    const groupId = groupInfo.id

    const emailsToIdsObj = groupsUtilityFunctions.getGroupEmailsToIdsObj(groupInfo)

    const result = await Promise.allSettled([
        groupsCacheService.setGroupIds(emailsToIdsObj),
        groupsCacheService.setGroupInfo(groupInfo),
        groupsCacheService.overwriteDescendantsById(groupId, descendants)
    ])

    console.log('Stored the group\'s id, info and descendants in cache:', result)
    
  } catch (error) {
    console.log('Error storing the group\'s id, info and descendants in cache:', error)
  }
}



async function getGroupSettingsFromCache(req, res, next) {
  const { groupEmail } = req.body

  try {
    const groupSettings = await groupsCacheService.getGroupSettings(groupEmail)
    if (groupSettings) {
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