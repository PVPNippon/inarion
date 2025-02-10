export const getDomainListAsJson = async (email, token) => {
  try {
    const response = await fetch(`http://localhost:4000/api/domains/?userEmail=${email}`, {
      // headers: {
      //   Authorization: `Bearer ${token}`,
      // },
      // Accept: 'application/json',
      method: 'GET',
      cache: 'no-store', //this disables cache
    })
    if (response.ok) {
      const responseData = await response.json()
      return responseData
    }
  } catch (error) {
    console.log(error)
  }
}

export const getDomainList = async (email, token) => {
  try {
    let domainList = []
    const domains = await getDomainListAsJson(email, token)
    console.log('DOMAINS', domains)
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
