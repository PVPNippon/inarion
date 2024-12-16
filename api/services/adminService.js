const { default: axios } = require('axios')
const { extractEmails } = require('../utility/utilityFunctions.js')
const API_BASE_URL = process.env.API_BASE_URL

// Helper function to fetch a list of all the users in the domain
const fetchUsersList = async (adminEmail, serviceAccountEmail, serviceAccountPrivateKey) => {
  let usersEmailsList = await axios.post(
    `${API_BASE_URL}/users/users-list`,
    {
      userEmail: adminEmail,
      serviceAccountEmail: serviceAccountEmail,
      serviceAccountPrivateKey: serviceAccountPrivateKey,
    },
    {
      withCredentials: true, // Include session cookies
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  const emailList = extractEmails(usersEmailsList.data)

  return emailList
}

module.exports = {
  fetchUsersList,
}
