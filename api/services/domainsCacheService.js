// TODO(m.okamoto): cacheService の関数を redisCacheService に置き換える
const cacheService = require('./cacheService.js')
const redisCacheService = require('../services/redisCacheService')
const config = require('../config/config')

/**
 * Retrieves an array of domain names stored in the cache.
 * NOTE: This function does not retrieve domain aliases. The array is assumed to contain the primary domain and all subdomains.
 * This is because domain aliases are always under the primary domain or subdomains.
 * ref: https://developers.google.com/admin-sdk/directory/reference/rest/v1/domainAliases
 *
 * This function queries the cache with a pattern to obtain all keys of domains.
 * The keys are then processed to obtain the domain names.
 * @returns {Promise<Array<string>>} A Promise object that resolves to an array of domain names.
 * @see {@link redisCacheService.scanKeys|scanKeys}
 */
async function getDomainNames() {
  const key = `${config.DOMAIN_TEST}:domains:*:info`
  const keys = await redisCacheService.scanSpecificKeys(key)
  console.log('scanKeys:', keys)
  // Since the key is made from the domain name, retrieve the domain name from the key again.
  const domainNames = keys.map((key) => key.split(':')[2])

  return domainNames
}

/**
 * Retrieves {@link https://developers.google.com/admin-sdk/directory/reference/rest/v1/domains#resource:-domain|domain instances} by their names from the cache.
 *
 * This function takes an array of domain names and returns an array of corresponding domain instances.
 * If a domain with a name in the provided array is not found in the cache, the corresponding element in the returned array is `null`.
 *
 * @param {Array<string>} domainNames - An array of domain names to retrieve.
 * @returns {Promise<Array<Object|null>>} A Promise object which resolves to an array of domain instances.
 *   The length of the array is the same as the length of `domainNames`.
 *   If `domainNames` is empty, the returned array is also empty.
 *   For each `0 <= i < domainNames.length`, the `i`-th element is:
 *   - The domain instance associated with `domainNames[i]` if it is found in the cache.
 *   - `null` if no domain instance is found for `domainNames[i]` in the cache.
 * @see {@link cacheService.getJsons|getJsons}
 */
function getDomainsByNames(domainNames) {
  // console.log('domainNames:', domainNames)
  // TODO(m.okamoto): VALIDATION: domainName should be an array of non-empty strings.
  const keys = domainNames.map((domainName) => `${config.DOMAIN_TEST}:domains:${domainName}:info`)
  return cacheService.getJsons(keys)
}

/**
 * Stores multiple {@link https://developers.google.com/admin-sdk/directory/reference/rest/v1/domains#resource:-domain|domain instances} in the cache.
 *
 * Each domain instance is stored with a key of `<DOMAIN>:domains:<domainName>:info` and a TTL.
 * An old domain instance with the same key and an old TTL set to it will be overwritten.
 *
 * @param {Array<Object>} domains - The domain instances to store in the cache.
 * @returns {Promise<Array<string|boolean>>} A Promise object which resolves to an array whose length is `N+1`, where `N` is the length of `domains`.
 *   - The first element of the array is a string 'OK'.
 *   - The `i+2`-th element (`0 <= i < N`) is `true` (the meaning of this value is that the TTL was set to the key of `domains[i]`).
 * @see {@link cacheService.setJsons|setJsons}
 */
function setDomains(domains) {
  // console.log('domains:', domains)
  const ttl = Number(config.TTL)
  const domainsObj = {}

  domains.forEach((domain) => {
    const domainName = domain.domainName
    const key = `${config.DOMAIN_TEST}:domains:${domainName}:info`
    domainsObj[key] = domain
  })

  return cacheService.setJsons(domainsObj, ttl)
}

module.exports = {
  getDomainNames,
  getDomainsByNames,
  setDomains,
}
