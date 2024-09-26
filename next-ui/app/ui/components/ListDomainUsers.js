'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'

/**
 * A component that fetches and displays the list of users in the domain that the currently
 * logged in user is an admin of. The list of users is fetched from the server using an
 * HTTP POST request to 'http://localhost:4000/users/users-list'. The request body contains
 * the currently logged in user's email, the project ID, the service account email, and the
 * service account private key. The response is then stored in the component's state and
 * displayed as a JSON string.
 */
function ListDomainUsers() {
  const [usersList, setUsersList] = useState([])
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)

  useEffect(() => {
    const fetchDomainUsers = async (req, res) => {
      const response = await axios.post(
        'http://localhost:4000/users/users-list',
        {
          userEmail: email,
          projectId: projectData.projectData.projectId,
          serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
          serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
        },
        { withCredentials: true }
      )

      setUsersList(response.data)
    }
    fetchDomainUsers()
  }, [])

  return <div className="text-white">{JSON.stringify(usersList)}</div>
}

export default ListDomainUsers
