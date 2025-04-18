/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import React, { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'

import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'

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

  return <div>{JSON.stringify(usersList)}</div>
}

export default ListDomainUsers
