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
  if (!domain) return
  let domains

  try {
    //geting email and token from local storage is a temporary measure, therefore no refactoring or optimization
    const email = userEmail ?? window.localStorage.getItem('email')
    console.log('email:', email)

    const token = authToken ?? localStorage.getItem('jwtToken')
    console.log('TOKEN', token)

    if (!domainList || domainList.length === 0) {
      domains = await getDomainList(email, token)
    } else {
      domains = domainList
    }

    //Important: for now, I return true if the domain list is unavailable or empty because for now it's important to display the table to confirm the UI.
    //In case something changes unexpectedly in BE and domains are not fetched successfully.
    //When ready, remove the condition.
    if (!domains || (domains.length > 0 && domains.includes(domain))) {
      return true
    } else {
      return false
    }
  } catch (error) {
    console.log(error)
  }
}
