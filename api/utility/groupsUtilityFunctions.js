function getGroupEmailsToIdsObj(groups) {
  if (!Array.isArray(groups)) {
    groups = [groups]
  }

  const emailsToIdsObj = {}

  groups.forEach(group => {
    const id = group.id

    if (group.email) {
      emailsToIdsObj[group.email] = id
    }

    if (group.aliases) {
      group.aliases.forEach(alias => emailsToIdsObj[alias] = id)
    }

    if (group.nonEditableAliases) {
      group.nonEditableAliases.forEach(nonEditableAlias => emailsToIdsObj[nonEditableAlias] = id)
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

module.exports = {
  getGroupEmailsToIdsObj,
  sortGroupsByEmail,
}