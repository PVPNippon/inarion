function isUndefined(target) {
  return typeof target === 'undefined'
}

function isNotUndefined(target) {
  return typeof target !== 'undefined'
}

function isEmptyArray(target) {
  return Array.isArray(target) && target.length === 0
}

function isEmptyObject(target) {
  if (typeof target !== 'object') {
    return false
  }

  if (target === null) {
    return false
  }

  return Object.getOwnPropertyNames(target).length === 0
}

function removeProperties(targetObj, propertiesToRemove) {
  if (typeof targetObj === 'object' && targetObj != null && Array.isArray(propertiesToRemove)) {
    propertiesToRemove.forEach(property => delete targetObj[property])
  }
  return targetObj
}

function getGroupEmailsToIdsObj(groupInfos) {
  if (!Array.isArray(groupInfos)) {
    groupInfos = [groupInfos]
  }

  const emailsToIdsObj = {}

  groupInfos.forEach(groupInfo => {
    const groupId = groupInfo.id

    if (groupInfo.email) {
      emailsToIdsObj[groupInfo.email] = groupId
    }

    if (groupInfo.aliases) {
      groupInfo.aliases.forEach(alias => emailsToIdsObj[alias] = groupId)
    }

    if (groupInfo.nonEditableAliases) {
      groupInfo.nonEditableAliases.forEach(nonEditableAlias => emailsToIdsObj[nonEditableAlias] = groupId)
    }
  })

  return emailsToIdsObj
}

function sortGroupInfosByEmail(groupInfos) {
  groupInfos.sort((g1, g2) => {
    email1 = g1.email.toLowerCase()
    email2 = g2.email.toLowerCase()

    if (email1 < email2) return -1
    if (email1 > email2) return 1
    return 0
  })
}

module.exports = {
  isUndefined,
  isNotUndefined,
  isEmptyArray,
  isEmptyObject,
  removeProperties,
  getGroupEmailsToIdsObj,
  sortGroupInfosByEmail,
}