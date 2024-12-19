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

// DONE
// キャッシュに存在する全てのグループ ID を重複なしで配列で返す.
// key がキャッシュに存在しなければ [] を返す.
async function getAllGroupIds() {
  const key = `${process.env.DOMAIN}:groups:id`
  const groupIds = await cacheService.getHashValues(key)
  const uniqueGroupIds = [...new Set(groupIds)]

  return uniqueGroupIds
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
// json.mSet() を使う必要はない（逆に使わないほうがパフォーマンス的に良さそう?）
function setGroupInfos(groupInfos) {
  return Promise.all(groupInfos.map(groupInfo => setGroupInfo(groupInfo)))
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

// 全てのグループの情報の配列を得る
// <'list' : 'list'> がグループ ID のハッシュに含まれていなければ, キャッシュでは情報を得られないとして Google API を呼ぶ動作にする
// ちょっとその場しのぎ感あるが動くからとりあえずこのままにしておく
async function getAllGroupInfos() {
  const groupIds = await getAllGroupIds()

  const idx = groupIds.indexOf('list')
  if (idx === -1) {
    return []
  }
  groupIds.splice(idx, 1)

  const groupInfos = await getGroupInfosByIds(groupIds)

  // この時点で groupInfos には null が含まれる可能性があるのでそれらを取り除く
  const groupInfosWithoutNull = groupInfos.filter(groupInfo => groupInfo !== null)
  
  return groupInfosWithoutNull
}

// グループのメールアドレスから対応するグループの情報を得る
// キャッシュに情報がなければ null を返す
async function getGroupInfo(groupEmail) {
  // VALIDATION: groupEmail should be a string.

  const groupId = await getGroupId(groupEmail)
  if (groupId === null) {
    return null
  }

  const groupInfo = await getGroupInfoById(groupId)

  return groupInfo
}

// グループのメールアドレスの配列から対応するグループの情報の配列を得る
// キャッシュに情報がないグループについては null を返す
async function getGroupInfos(groupEmails) {
  // VALIDATION: groupEmails should be an array.
  // VALIDATION: Every element of groupEmails should be a string.

  const groupIds = await getGroupIds(groupEmails)

  const groupIdsWithoutNull = groupIds.filter(groupId => groupId !== null)

  const rawGroupInfos = await getGroupInfosByIds(groupIdsWithoutNull)

  let idx = 0
  const groupInfos = groupIds.map(groupId => (groupId === null) ? null : rawGroupInfos[idx++])

  return groupInfos
}


// <DOMAIN>:groups:members:<groupId> をキーとしてグループメンバーをハッシュで保存
// ハッシュ内の field はメンバー ID, value は JSON.stringify() で文字列化したメンバー情報とする
// 使わないかな
function setMembersById(groupId, members) {
  const key = `${process.env.DOMAIN}:groups:${groupId}:members`

  const membersObj = {}
  members.forEach(member => membersObj[member.id] = JSON.stringify(member))

  const ttl = Number(process.env.TTL)

  return cacheService.setHash(key, membersObj, ttl, 'NX')
}

// setGroupMembersById() と同様だが, まず古いメンバー情報のハッシュを削除する
// キーに TTL も追加
// groupsController.listAllGroups() の際に使用
function overwriteMembersById(groupId, members) {
  const key = `${process.env.DOMAIN}:groups:${groupId}:members`

  const idsToMembersObj = {}
  members.forEach(member => idsToMembersObj[member.id] = JSON.stringify(member))
  idsToMembersObj['membersCount'] = `${members.length}`

  const ttl = Number(process.env.TTL)

  return cacheService.overwriteHash(key, idsToMembersObj, ttl)
}

// グループメンバーをハッシュで保存するが, 与えられるのが groupId ではなく groupEmail という点で setGroupMembersById() と異なる.
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

  const settings = await getGroupSettingsById(groupId)

  return settings
}

// // <DOMAIN>:groups:id -> Hash {
// //   group1@example.com: "id1",
// //   group2@example.com: "id2",
// //   ...
// // }
// // Returns a Promise object varying depending on `groupEmails`:
// //
// // (A) undefined:
// //       The returned Promise object resolves to an array of IDs of all groups in the organization.
// //       The array is empty if there are no groups in the organization or no group IDs are cached.
// //
// // (B) array:
// //       The returned Promise object resolves to an array of corresponding group IDs (let's call it `groupIds`).
// //       If `groupEmails` is empty ([]), `groupIds` is also empty.
// //       If `groupEmails` is not empty, for each 0 <= i < groupEmails.length, groupIds[i] is:
// //         - The group ID of the group which has groupEmails[i] as one of its email addresses.
// //         - null if groupEmails[i] does not exist in the cache.
// //
// // (C) Neither undefined nor array:
// //       This function assumes that `groupEmails` is a single group email (string), and returns a Promise object which resolves to:
// //       - The group ID of the group which has the group email as one of its email addresses.
// //       - null if the group email does not exist in the cache.
// //
// // (A) `groupEmails` が undefined ならば, 全てのグループの ID の配列を返す
// // (B) `groupEmails` が配列ならば, 対応するグループ ID (グループ ID がキャッシュになければ null）の配列を返す
// // (C) `groupEmails` が undefined でも配列でもなければ, これを１つのアドレスとみなし, 対応するグループの ID を返す
// async function getGroupIds(groupEmails) {
//   const key = `${process.env.DOMAIN}:groups:id`

//   const groupIds = await cacheService.getHashValues(key, groupEmails)

//   return isUndefined(groupEmails) ? [...new Set(groupIds)] : groupIds
// }

// // <DOMAIN>:groups:id -> Hash {
// //   group1@example.com: "id1",
// //   group2@example.com: "id2",
// //   ...
// // }
// function setGroupIds(emailsToIdsObj) {
//   const key = `${process.env.DOMAIN}:groups:id`

//   return cacheService.setHash(key, emailsToIdsObj)
// }

// function overwriteGroupIds(emailsToIdsObj, ttl) {
//   const key = `${process.env.DOMAIN}:groups:id`

//   return cacheService.overwriteHash(key, emailsToIdsObj, ttl)
// }

// // (A) `groupEmails` が undefined ならば, 全てのグループの情報の配列を返す
// // (B) `groupEmails` が配列ならば, 対応するグループ情報 (グループ情報がキャッシュになければ null）の配列を返す
// // (C) `groupEmails` が undefined でも配列でもなければ, これを１つのアドレスとみなし, 対応するグループの情報を返す
// async function getGroupInfos(groupEmails) {
//   const groupIds = await getGroupIds(groupEmails)

//   if (Array.isArray(groupIds)) {
//     const keys = groupIds.map(groupId => `${process.env.DOMAIN}:groups:info:${groupId}`)
//     const groupInfos = await cacheService.getJSONs(keys)
//     return groupInfos

//   }

//   const key = `${process.env.DOMAIN}:groups:info:${groupIds}`
//   const groupInfo = await cacheService.getJSON(key)
//   return groupInfo
// }

// function setGroupInfos(groupInfos, ttl) {
//   if (Array.isArray(groupInfos)) {
//     return Promise.all(groupInfos.map(groupInfo => cacheService.setJSON(`${process.env.DOMAIN}:groups:info:${groupInfo.id}`, groupInfo)))
//   }

//   return cacheService.setJSON(`${process.env.DOMAIN}:groups:info:${groupInfos.id}`, groupInfos)
// }

// async function getGroupMembers(groupEmail) {
//   const groupId = await getGroupIds(groupEmail)
//   if (groupId === null) {
//     return null
//   }

//   const key = `${process.env.DOMAIN}:groups:members:${groupId}`
//   const rawGroupMembers = await cacheService.getHashValues(key)

//   if (rawGroupMembers.length === 0) {
//     return null
//   }

//   if (rawGroupMembers[0] === 'noMembers') {
//     return []
//   }

//   const groupMembers = rawGroupMembers.map(rawGroupMember => JSON.parse(rawGroupMember))

//   return groupMembers
// }

// async function setGroupMembers(groupEmail, groupMembers) {
//   const groupId = await getGroupIds(groupEmail)
//   if (groupId === null) {
//     return null
//   }

//   const key = `${process.env.DOMAIN}:groups:members:${groupId}`

//   if (groupMembers.length === 0) {
//     await cacheService.setHash(key, { noMembers: 'noMembers' })
//     return null
//   }

//   const groupMembersObj = {}
//   groupMembers.forEach(member => groupMembersObj[member.id] = JSON.stringify(member))
//   return await cacheService.overwriteHash(key, groupMembersObj)
// }

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