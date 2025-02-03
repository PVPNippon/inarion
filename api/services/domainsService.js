const { getImpersonatedClientInstanceForAdmin } = require('./authService')
const logger = require('../logger/logger')(__filename, 'Domains Service')

async function listDomains({ userEmail, client }) {
  logger.debug('Reached listDomains endpoint.')
  //Retrieve an existing impersonated auth client for Directory API or create a new one
  const directory = client ?? (await getImpersonatedClientInstanceForAdmin(userEmail, 'directory'))
  const domains = [] // Container for all domains retrieved
  let domainsResponse // Response from the API

  // Create request object
  const requestObj = {
    customer: 'my_customer',
    // domains.list API doesn't have maxResults or orderBy parameters or nextPageToken field in the response
    // ref: https://developers.google.com/admin-sdk/directory/reference/rest/v1/domains/list
  }

  // Fetch all domains
  domainsResponse = await directory.domains.list(requestObj)

  // Append the fetched users to the users array
  domains.push(...domainsResponse.data.domains)

  return domains // Return all fetched domains
}

module.exports = {
  listDomains,
}
