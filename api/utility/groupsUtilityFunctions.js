/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

function getGroupEmailsToIdsObj(groups) {
  if (!Array.isArray(groups)) {
    groups = [groups]
  }

  const emailsToIdsObj = {}

  groups.forEach((group) => {
    const id = group.id

    if (group.email) {
      emailsToIdsObj[group.email] = id
    }

    if (group.aliases) {
      group.aliases.forEach((alias) => (emailsToIdsObj[alias] = id))
    }

    if (group.nonEditableAliases) {
      group.nonEditableAliases.forEach((nonEditableAlias) => (emailsToIdsObj[nonEditableAlias] = id))
    }
  })

  return emailsToIdsObj
}

function sortGroupsByEmail(groups) {
  groups.sort((g1, g2) => {
    email1 = g1.email.toLowerCase()
    email2 = g2.email.toLowerCase()

    if (email1 < email2) return -1
    if (email1 > email2) return 1
    return 0
  })
}

function extractEmailsFromGroup(group) {
  if (!group) {
    return null
  }

  const emails = [group.email]
  if (group.aliases) {
    emails.push(...group.aliases)
  }
  if (group.nonEditableAliases) {
    emails.push(...group.nonEditableAliases)
  }
  return emails
}

// Should be in usersUtilityFunctions.js
function extractEmailsFromUser(user) {
  if (!user) {
    return null
  }

  const emails = user.emails.map((email) => email.address)

  return emails
}

function getGroupJoinTimestamp(joinLogs, groupEmail, memberEmailsSet) {
  let timestamp

  for (const joinLog of joinLogs) {
    if ((timestamp = extractTimestampFromGroupJoinLog(joinLog, groupEmail, memberEmailsSet))) {
      return timestamp
    }
  }
  return null
}

function extractTimestampFromGroupJoinLog(joinLog, groupEmail, memberEmailsSet) {
  switch (joinLog.id.applicationName) {
    case 'admin':
      return extractTimestampFromGroupJoinLogForAdmin(joinLog, groupEmail, memberEmailsSet)

    case 'groups':
      return extractTimestampFromGroupJoinLogForGroups(joinLog, groupEmail, memberEmailsSet)

    case 'groups_enterprise':
      return extractTimestampFromGroupJoinLogForGroupsEnterprise(joinLog, groupEmail, memberEmailsSet)
  }

  return null
}

function extractTimestampFromGroupJoinLogForAdmin(joinLog, groupEmail, memberEmailsSet) {
  // applicationName: admin
  // eventName: ADD_GROUP_MEMBER

  let groupEmailInLog
  let memberEmailInLog

  for (const event of joinLog.events) {
    // groupEmail is in parameters[].value where parameters[].name === GROUP_EMAIL
    groupEmailInLog = event.parameters.find((parameter) => parameter.name === 'GROUP_EMAIL')?.value

    if (!groupEmailInLog || groupEmailInLog !== groupEmail) {
      continue
    }

    // memberEmail is in parameters[].value where parameters[].name === USER_EMAIL
    memberEmailInLog = event.parameters.find((parameter) => parameter.name === 'USER_EMAIL')?.value

    if (memberEmailInLog && memberEmailsSet.has(memberEmailInLog)) {
      return joinLog.id.time
    }
  }

  return null
}

function extractTimestampFromGroupJoinLogForGroups(joinLog, groupEmail, memberEmailsSet) {
  // applicationName: groups

  let groupEmailInLog
  let memberEmailInLog

  for (const event of joinLog.events) {
    // groupEmail is in parameters[].value where parameters[].name === group_email
    groupEmailInLog = event.parameters.find((parameter) => parameter.name === 'group_email')?.value

    if (!groupEmailInLog || groupEmailInLog !== groupEmail) {
      continue
    }

    if (event.name === 'add_user' || event.name === 'approve_join_request') {
      // For eventName: add_user, approve_join_request
      // memberEmail is in parameters[].value where parameters[].name === user_email
      memberEmailInLog = event.parameters.find((parameter) => parameter.name === 'user_email')?.value
    } else {
      // For eventName: accept_invitation, join, join_via_mail
      // memberEmail is in actor.email
      memberEmailInLog = joinLog.actor.email
    }

    if (memberEmailInLog && memberEmailsSet.has(memberEmailInLog)) {
      return joinLog.id.time
    }
  }

  return null
}

function extractTimestampFromGroupJoinLogForGroupsEnterprise(joinLog, groupEmail, memberEmailsSet) {
  // applicationName: groups_enterprise

  let groupEmailInLog
  let memberEmailInLog

  for (const event of joinLog.events) {
    // groupEmail is in parameters[].value where parameters[].name === group_id
    groupEmailInLog = event.parameters.find((parameter) => parameter.name === 'group_id')?.value

    if (!groupEmailInLog || groupEmailInLog !== groupEmail) {
      continue
    }

    if (event.name === 'add_member' || event.name === 'approve_join_request') {
      // For eventName: add_member, approve_join_request
      // memberEmail is in parameters[].value where parameters[].name === member_id
      memberEmailInLog = event.parameters.find((parameter) => parameter.name === 'member_id')?.value
    } else {
      // For eventName: accept_invitation, join
      // memberEmail is in actor.email
      memberEmailInLog = joinLog.actor.email
    }

    if (memberEmailInLog && memberEmailsSet.has(memberEmailInLog)) {
      return joinLog.id.time
    }
  }

  return null
}

module.exports = {
  getGroupEmailsToIdsObj,
  sortGroupsByEmail,
  extractEmailsFromGroup,
  extractEmailsFromUser,
  getGroupJoinTimestamp,
}
