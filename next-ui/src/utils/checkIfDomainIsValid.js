'use client'
import { getDomainList } from './getDomains'

/**
 * Checks if a given domain is valid by verifying its presence in a list of domains.
 *
 * This function retrieves the list of domains associated with the user's email
 * and authentication token if a domain list is not provided. It then checks
 * if the specified domain is present in the list.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.domain - The domain to be validated.
 * @param {string[]} [params.domainList] - Optional. A predefined list of domains to check against.
 * @param {string} [params.userEmail] - Optional. The user's email address. If not provided, it is retrieved from localStorage.
 * @param {string} [params.authToken] - Optional. The authentication token. If not provided, it is retrieved from localStorage.
 * @returns {Promise<boolean>} A promise that resolves to true if the domain is valid, otherwise false.
 */

export const checkIfDomainIsValid = async ({ domain, domainList, userEmail, authToken }) => {
  const email = userEmail ?? window.localStorage.getItem('email')
  console.log('email:', email)

  const token = authToken ?? localStorage.getItem('jwtToken')
  console.log('TOKEN', token)

  const domains = domainList ?? (await getDomainList(email, token))

  if (domains.includes(domain)) {
    return true
  } else {
    return false
  }
}
