const redisCacheService = require('../services/redisCacheService')
const config = require('../config/config')
// TODO (m.okamoto): implement logger in Redis (#267)

/**
 * Retrieves an array of all domain names stored in the cache.
 * NOTE: This function does not retrieve domain aliases. The array is assumed to contain the primary domain and all subdomains.
 * This is because domain aliases are always under the primary domain or subdomains.
 * ref: https://developers.google.com/admin-sdk/directory/reference/rest/v1/domainAliases
 *
 * This function creates a search pattern by replacing the domain name part of the Redis key with a wildcard
 * and queries Redis using the pattern. It then retrieves the domain names from the returned keys.
 *
 * @returns {Promise<Array<string>>} A Promise object which resolves to an array of domain names.
 */
async function getDomainNames() {
  // TODO(m.okamoto): Domain names: ${config.DOMAIN_TEST} will eventually stop being hard-coded
  const key = `${config.DOMAIN_TEST}:domains:*:info`
  const keys = await redisCacheService.scanSpecificKeys(key)
  // Since the key is made from the domain name, retrieve the domain name from the key again.
  const domainNames = keys.map((key) => key.split(':')[2])

  return domainNames
}

/**
 * Retrieves an array of domain instances from Redis by their names.
 *
 * @param {Array<string>} domainNames - An array of strings, each of which is a domain name.
 *   For example, if there are two domains, `example.com` and `example.net`,
 *   the function takes `['example.com', 'example.net']` as an argument.
 * @returns {Promise<Array<Object>>} A Promise object which resolves to an array of objects.
 *   The array contains domain instances in the organization.
 *   For example, if there are two domains, `example.com` and `example.net`,
 *   the function returns `[domainInstance_1, domainInstance_2]`.
 *   Each element of the array is a JSON object, which contains all information about a domain.
 */
function getDomainsByNames(domainNames) {
  // TODO(m.okamoto): VALIDATION: domainName should be an array of non-empty strings.
  const keys = domainNames.map((domainName) => `${config.DOMAIN_TEST}:domains:${domainName}:info`)
  return redisCacheService.getJsons(keys)
}

/**
 * Stores domain instances in Redis.
 *
 * @param {Array<Object>} domains - An array of objects, each of which represents a domain.
 *   Each object should contain all information about a domain.
 *   For example, if there are two domains, `example.com` and `example.net`,
 *   the function takes `[domainInstance_1, domainInstance_2]` as an argument.
 * @returns {Promise<void>} A Promise object which resolves to `undefined`.
 */
function setDomains(domains) {
  const ttl = Number(config.TTL)
  const domainsObj = {}

  domains.forEach((domain) => {
    const domainName = domain.domainName
    const key = `${config.DOMAIN_TEST}:domains:${domainName}:info`
    domainsObj[key] = domain
  })

  return redisCacheService.setJsonsWithTtlMode(domainsObj, ttl)
}

module.exports = {
  getDomainNames,
  getDomainsByNames,
  setDomains,
}
