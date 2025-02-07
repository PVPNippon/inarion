function getUserEmailsToIdsObj(users) {
  if (!Array.isArray(users)) {
    users = [users]
  }

  const emailsToIdsObj = {}

  users.forEach((user) => {
    const id = user.id

    // Resource: users ref: https://developers.google.com/admin-sdk/directory/reference/rest/v1/users
    user.emails.forEach(({ address }) => (emailsToIdsObj[address] = id))
  })

  return emailsToIdsObj
}

function sortUsersByEmail(users) {
  users.sort((u1, u2) => {
    primaryEmail1 = u1.primaryEmail.toLowerCase()
    primaryEmail2 = u2.primaryEmail.toLowerCase()

    if (primaryEmail1 < primaryEmail2) return -1
    if (primaryEmail1 > primaryEmail2) return 1
    return 0
  })
}

module.exports = {
  getUserEmailsToIdsObj,
  sortUsersByEmail,
}
