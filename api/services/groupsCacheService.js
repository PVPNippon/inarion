const cacheService = require('./cacheService.js')
const groupsUtilityFunctions = require('../utility/groupsUtilityFunctions.js')

// DONE
// <DOMAIN>:groups:id のハッシュに emailsToIdsObj の情報を基に [groupEmail : groupId] の項目を複数追加
// ハッシュがなければキーに TTL も追加
function setGroupIds(emailsToIdsObj) {
  const key = `${process.env.DOMAIN}:groups:id`
  const ttl = Number(process.env.TTL)
  return cacheService.setHash(key, emailsToIdsObj, ttl, 'NX')
}

// DONE
// <DOMAIN>:groups:id のハッシュを一旦削除し, emailsToIdsObj の情報を基にしたハッシュを同じキーで作成
// キーに TTL も追加
// groupsController.listAllGroups() の際に使用
function overwriteGroupIds(emailsToIdsObj) {
  const key = `${process.env.DOMAIN}:groups:id`
  const ttl = Number(process.env.TTL)
  return cacheService.overwriteHash(key, emailsToIdsObj, ttl)
}

// DONE
// groupEmail (string) を持つグループの ID を返す
// キャッシュに存在しなければ null を返す
function getGroupId(groupEmail) {
  // VALIDATION: groupEmail should be a string

  const key = `${process.env.DOMAIN}:groups:id`
  return cacheService.getHashValues(key, groupEmail)
}

// DONE
// groupEmails の各要素に対応する ID の配列を得る
// groupEmails: string -> 戻り値は ただ一つのグループ ID (string). グループ ID がない場合は null
// groupEmails: array -> 戻り値はグループ ID の配列. グループ ID がない要素は null になる
// groupEmails: undefined -> 戻り値は全てのグループ ID の配列. 要素に null は含まれない
function getGroupIds(groupEmails) {
  // VALIDATION: groupEmails is an array.
  // VALIDATION: Every element of groupEmails should be a string.

  const key = `${process.env.DOMAIN}:groups:id`
  return cacheService.getHashValues(key, groupEmails)
}

// - isStrict が true のとき
//   - キャッシュに存在する全てのグループ ID を重複なしで配列で返す.
//   - キャッシュがないか, キャッシュが groupsService.listGroups() によって得られたものでなければ null を返す.
// - isStrict が false のとき（デフォルト）
//   - キャッシュに存在する全てのグループ ID を重複なしで配列で返す.
//   - キャッシュがなければ null を返す.
async function getAllGroupIds(isStrict) {
  const key = `${process.env.DOMAIN}:groups:id`
  const groupEmailsToIdsObj = await cacheService.getHash(key)

  // キャッシュがなければ null を返す
  if (groupEmailsToIdsObj === null) {
    return null
  }

  // groupsService.listGroups() で全てのグループ情報を得, キャッシュに保存しているか
  // ※ 'hasAllGroups' は仮決め
  const hasAllGroups = 'hasAllGroups' in groupEmailsToIdsObj
  if (hasAllGroups) {
    delete groupEmailsToIdsObj['hasAllGroups']
  } else if (isStrict) {
    return null
  }

  // 重複する ID を削除
  const uniqueGroupIdsSet = new Set(Object.values(groupEmailsToIdsObj))

  // ネガティブキャッシュを取り除く
  // ※ 'negativeCache' は仮決め
  uniqueGroupIdsSet.delete('negativeCache')

  // groupsService.listGroups() を呼んだ上でネガティブキャッシュしかないのであれば, 組織にグループが存在しないということなので, この場合は [] を返す
  // groupsService.listGroups() を呼んでおらずネガティブキャッシュしかないのであれば, 実質的にキャッシュは存在しないということなので, この場合は null を返す
  if (uniqueGroupIdsSet.size === 0) {
    return hasAllGroups ? [] : null
  }

  return [...uniqueGroupIdsSet]
}

// DONE
// <DOMAIN>:groups:info:<groupId> をキーとしてグループ情報を JSON で保存
// キーに TTL も追加
// ※キーがすでに存在する場合, JSON はハッシュと違って overwrite される
function setGroupInfo(groupInfo) {
  const groupId = groupInfo.id
  const key = `${process.env.DOMAIN}:groups:${groupId}:info`
  const ttl = Number(process.env.TTL)
  return cacheService.setJSON(key, groupInfo, ttl)
}

// <DOMAIN>:groups:info:<groupId> をキーとしてグループ情報を JSON で複数保存
// キーに TTL も追加
// ※キーがすでに存在する場合, JSON はハッシュと違って overwrite される
// json.mSet() を使う必要はないと思うが検討の余地あり
function setGroupInfos(groupInfos) {
  return Promise.allSettled(groupInfos.map(groupInfo => setGroupInfo(groupInfo)))
}

// グループ ID から対応するグループの情報を得る
// グループ情報がキャッシュに存在しなければ null を返す
function getGroupInfoById(groupId) {
  // VALIDATION: groupId should be a string.

  const key = `${process.env.DOMAIN}:groups:${groupId}:info`
  return cacheService.getJSONs(key)
}

// グループ ID の配列から対応するグループの情報の配列を得る
// キャッシュに情報がないグループについては null を返す
function getGroupInfosByIds(groupIds) {
  // VALIDATION: groupIds should be an array.
  // VALIDATION: Every elements of groupIds should be a string.

  const keys = groupIds.map(groupId => `${process.env.DOMAIN}:groups:${groupId}:info`)
  return cacheService.getJSONs(keys)
}

// グループのメールアドレスから対応するグループの情報を得る
// キャッシュに情報がなければ null を返す
// ID のネガティブキャッシュがあれば（とりあえず） {} を返す
async function getGroupInfo(groupEmail) {
  // VALIDATION: groupEmail should be a string.

  const groupId = await getGroupId(groupEmail)

  if (groupId === null) {
    return null
  }

  // ここは何を返すのがベストだ？
  if (groupId === 'negativeCache') {
    return {}
  }

  const groupInfo = await getGroupInfoById(groupId)

  return groupInfo
}

// グループのメールアドレスの配列から対応するグループの情報の配列を得る
// キャッシュに ID or info がないグループについては null を返す
// ID のネガティブキャッシュがあれば（とりあえず） {} を返す
async function getGroupInfos(groupEmails) {
  // VALIDATION: groupEmails should be an array.
  // VALIDATION: Every element of groupEmails should be a string.

  const rawGroupIds = await getGroupIds(groupEmails)

  const groupIds = rawGroupIds.filter(rawGroupId => rawGroupId !== null && rawGroupId !== 'negativeCache')

  const rawGroupInfos = await getGroupInfosByIds(groupIds)

  let idx = 0
  const groupInfos = rawGroupIds.map(rawGroupId => {
    if (rawGroupId ===  null) {
      return null
    }

    if (rawGroupId === 'negativeCache') {
      return {}
    }

    return rawGroupInfos[idx++]
  })

  return groupInfos
}

// 全てのグループの情報の配列を得る
async function getAllGroupInfos(isStrict) {
  const groupIds = await getAllGroupIds(isStrict)

  if (groupIds === null) {
    return null
  }

  const groupInfos = await getGroupInfosByIds(groupIds)

  // groupInfos には null が含まれる可能性があるのでそれらを取り除く
  return groupInfos.filter(groupInfo => groupInfo !== null)
}

// <DOMAIN>:groups:members:<groupId> をキーとしてグループメンバーをハッシュで保存
// ハッシュ内の field はメンバー ID, value は JSON.stringify() で文字列化したメンバー情報とする
// 使わないかな
function setMembersById(groupId, members) {
  const key = `${process.env.DOMAIN}:groups:${groupId}:members`

  const idsToMembersObj = {}
  members.forEach(member => idsToMembersObj[member.id] = JSON.stringify(member))

  const ttl = Number(process.env.TTL)

  return cacheService.setHash(key, idsToMembersObj, ttl, 'NX')
}

// setGroupMembersById() と同様だが, まず古いメンバー情報のハッシュを削除する
// キーに TTL も追加
function overwriteMembersById(groupId, members) {
  const key = `${process.env.DOMAIN}:groups:${groupId}:members`

  const idsToMembersObj = {}
  members.forEach(member => idsToMembersObj[member.id] = JSON.stringify(member))
  idsToMembersObj['membersCount'] = `${members.length}`

  const ttl = Number(process.env.TTL)

  return cacheService.overwriteHash(key, idsToMembersObj, ttl)
}

function setMembersByEmail(groupEmail, members) {}

function overwriteMembersByEmail(groupEmail, groupMembers) {}

async function getMembersById(groupId) {
  const key = `${process.env.DOMAIN}:groups:${groupId}:members`

  const rawMembersObj = await cacheService.getHash(key)

  if (rawMembersObj === null) {
    return null
  }

  delete rawMembersObj['membersCount']

  const members = Object.values(rawMembersObj).map(rawMember => JSON.parse(rawMember))

  return members
}

async function getMembers(groupEmail) {
  const groupId = await getGroupId(groupEmail)
  if (groupId === null) {
    return null
  }

  if (groupId === 'negativeCache') {
    return []
  }

  const members = await getMembersById(groupId)

  return members
}



function setDescendantsById(groupId, descendants) {
  const key = `${process.env.DOMAIN}:groups:${groupId}:descendants`

  const descendantsObj = {}
  descendants.forEach(descendant => descendantsObj[descendant.id] = JSON.stringify(descendant))

  const ttl = Number(process.env.TTL)

  return cacheService.setHash(key, descendantsObj, ttl, 'NX')
}

function overwriteDescendantsById(groupId, descendants) {
  const key = `${process.env.DOMAIN}:groups:${groupId}:descendants`

  const idsToDescendantsObj = {}
  descendants.forEach(descendant => idsToDescendantsObj[descendant.id] = JSON.stringify(descendant))
  idsToDescendantsObj['descendantsCount'] = `${descendants.length}`

  const ttl = Number(process.env.TTL)

  return cacheService.overwriteHash(key, idsToDescendantsObj, ttl)
}

async function getDescendantsById(groupId) {
  const key = `${process.env.DOMAIN}:groups:${groupId}:descendants`

  const rawDescendantsObj = await cacheService.getHash(key)

  if (rawDescendantsObj === null) {
    return null
  }

  delete rawDescendantsObj['descendantsCount']

  const descendants = Object.values(rawDescendantsObj).map(rawDescendant => JSON.parse(rawDescendant))

  return descendants
}

async function getDescendants(groupEmail) {
  const groupId = await getGroupId(groupEmail)
  if (groupId === null) {
    return null
  }

  const descendants = await getDescendantsById(groupId)

  return descendants
}






function setGroupParentsById(groupId, groupParents) {

}

function setGroupParentsByEmail(groupEmail, groupParents) {

}

function overwriteGroupParentsById(groupId, groupParents) {

}

function overwriteGroupParentsByEmail(groupEmail, groupParents) {

}

function getGroupParentsById(groupId) {

}

function getGroupParentsByEmail(groupEmail) {

}

function setGroupSettingsById(groupId, groupSettings) {
  const key = `${process.env.DOMAIN}:groups:${groupId}:settings`
  const ttl = Number(process.env.TTL)
  return cacheService.setHash(key, groupSettings, ttl)
}

function overwriteGroupSettingsById(groupId, groupSettings) {
  const key = `${process.env.DOMAIN}:groups:${groupId}:settings`
  const ttl = Number(process.env.TTL)
  return cacheService.overwriteHash(key, groupSettings, ttl)
}

function setGroupSettingsByEmail(groupEmail, groupSettings) {

}

function getGroupSettingsById(groupId) {
  const key = `${process.env.DOMAIN}:groups:${groupId}:settings`
  return cacheService.getHash(key)
}

async function getGroupSettings(groupEmail) {
  const groupId = await getGroupId(groupEmail)
  if (groupId === null) {
    return null
  }

  if (groupId === 'negativeCache') {
    return {}
  }

  const settings = await getGroupSettingsById(groupId)

  return settings
}

module.exports = {
  setGroupIds,
  overwriteGroupIds,
  getGroupId,
  
  setGroupInfo,
  setGroupInfos,
  getGroupInfo,
  getGroupInfos,
  getAllGroupInfos,

  overwriteMembersById,
  getMembers,

  overwriteDescendantsById,
  getDescendants,
  
  setGroupSettingsById,
  getGroupSettings,
}