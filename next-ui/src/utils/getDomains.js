'use server'

/**
 * Retrieves a list of domains from the backend server in JSON format. (the response from google admin sdk)
 * @param {string} email - The email address of the user.
 * @param {string} token - The authentication token. //not used for now, but will probably be used in the future
 * @returns {Promise<Object[]>} A Promise object which resolves to an array of domain objects.
 * @throws {Error} - Throws an error if the network request fails.
 */
export const getDomainListAsJson = async (email, token) => {
  let currentController
  if (currentController) {
    currentController.abort()
  }

  currentController = new AbortController()
  const signal = currentController.signal
  try {
    const response = await fetch(`http://localhost:4000/api/domains/?userEmail=${email}`, {
      // headers: {
      //   Authorization: `Bearer ${token}`,
      // },
      // Accept: 'application/json',
      signal,
      next: { revalidate: 60 }, // revalidate every 60 seconds
    })

    if (response.ok) {
      const responseData = await response.json()

      return responseData
    }
  } catch (error) {
    console.log(error)
    throw new Error('Network request failed to fetch domains: ' + error.message)
  }
}

/**
 * Retrieves a list of domains from the backend server and flattens the result into an array
 * of strings.
 * @param {string} email - The email address of the user.
 * @param {string} token - The authentication token. //not used for now, but will probably be used in the future
 * @returns {Promise<string[]>} A Promise object which resolves to an array of domain names.
 * @throws {Error} - Throws an error if the network request fails.
 */
export const getDomainList = async (email, token) => {
  try {
    let domainList = []
    const domains = await getDomainListAsJson(email, token) //get the list of domains

    //if domain is primary, get its and all its aliases' names,
    //otherwise, get only its domain name

    for (let domain of domains) {
      if (domain.isPrimary === true) {
        domainList = [...domainList, domain.domainName]
        if (domain.domainAliases && domain.domainAliases.length > 0) {
          for (let alias of domain.domainAliases) {
            domainList = [...domainList, alias.domainAliasName]
          }
        }
      } else {
        domainList = [...domainList, domain.domainName]
      }
    }

    return domainList
  } catch (error) {
    console.log(error)
  }
}
