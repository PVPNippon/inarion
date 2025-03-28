'use client'
import axios from 'axios'

// Function to fetch ALL users data
export const fetchAllUsers = async (userEmail) => {
  try {
    const { data: users } = await axios.get(`http://localhost:4000/api/users?userEmail=${userEmail}`)
    return users
  } catch (error) {
    console.error(error)
    throw error
  }
}

// Function to fetch all OU path for filter
export const createOUListForFilter = async (userEmail) => {
  try {
    let ouList = []
    const { data: orgunits } = await axios.get(`http://localhost:4000/api/users/orgunits?userEmail=${userEmail}`)

    for (let orgunit of orgunits.organizationUnits) {
      ouList = [...ouList, orgunit.name]
    }
    return ouList
  } catch (error) {
    console.error(error)
    throw error
  }
}

// Function to fetch primary domain and subdomains name for filter
export const createDomainListForFilter = async (userEmail) => {
  try {
    let domainList = []
    const { data: domains } = await axios.get(`http://localhost:4000/api/domains?userEmail=${userEmail}`)

    for (let domain of domains) {
      domainList = [...domainList, domain.domainName]
    }

    return domainList
  } catch (error) {
    console.error(error)
    throw error
  }
}

// Function to fetch all group address for filter
export const createGroupListForFilter = async (userEmail) => {
  try {
    let groupList = []
    const { data: groups } = await axios.get(`http://localhost:4000/api/groups?userEmail=${userEmail}`)

    for (let group of groups) {
      groupList = [...groupList, group.email]
    }

    return groupList
  } catch (error) {
    console.error(error)
    throw error
  }
}

// Function to fetch all role name for filter
export const createRoleListForFilter = async (userEmail) => {
  try {
    let roleList = []
    const { data: roles } = await axios.get(`http://localhost:4000/api/users/role/names?userEmail=${userEmail}`)

    for (let role of roles) {
      roleList = [...roleList, role.roleName]
    }

    return roleList
  } catch (error) {
    console.error(error)
    throw error
  }
}
