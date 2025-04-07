'use client'
import { useState, useEffect } from 'react'
const email = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL //temporarily bypass login and jwttoken check

/**
 * Custom React hook to fetch and manage a list of domains associated with the current user.
 *
 * This hook retrieves the email and authentication token from local storage and
 * uses them to fetch the domain list from the backend server. The fetched domain
 * list is then processed and stored in the component's state.
 *
 * @returns {Object} An object containing the domain list array.
 */

export function useDomainList() {
  const [domainList, setDomainList] = useState([])

  useEffect(() => {
    const fetchDomainList = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/domains/?userEmail=${email}`, {
          headers: {
            //  Authorization: `Bearer ${token}`, //Note: the domains module doesn't require the token for now, but it will probably need it in the future.
          },
        })

        if (response.ok) {
          const responseData = await response.json()
          setDomainList(createDomainList(responseData))
        } else {
          setDomainList([]) //in case of error set empty list, because now displaying the table is priotity. If no domains, the request will be sent regardless of domain validation
        }
      } catch (error) {
        console.log(error)
      }
    }

    fetchDomainList()
  }, [])
  return { domainList }
}

/**
 * Processes the JSON response from the backend server and creates an array of domain names.
 *
 * If a domain is primary, it adds its name and all its aliases' names to the array.
 * If a domain is not primary, it adds only its name to the array.
 *
 * @param {Object} jsonResponse - The JSON response from the backend server.
 * @returns {Array<string>} An array of domain names.
 */
export function createDomainList(jsonResponse) {
  try {
    let domainList = []
    const domains = jsonResponse

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
