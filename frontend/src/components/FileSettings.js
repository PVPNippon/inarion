/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import axios from 'axios'
import React, { useState, useEffect, useContext } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'

function FileSettings() {
  const { fileId } = useParams() // This extracts the fileId from the URL
  const location = useLocation()
  const [fileDetails, setFileDetails] = useState([])
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)

  // Extract the email from the query parameters
  const queryParams = new URLSearchParams(location.search)
  const emailToImpersonate = queryParams.get('email')

  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        const response = await axios.post(
          `http://localhost:4000/api/drive/file/${fileId}`,
          {
            email: email,
            emailToImpersonate: emailToImpersonate,
            projectId: projectData.projectData.projectId,
            serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
            serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
          },
          {
            withCredentials: true,
          }
        )
        setFileDetails(response.data)
      } catch (err) {
        console.error('Error fetching file details:', err)
      }
    }
    fetchFileDetails()
  }, [fileId, email])

  return <div>{JSON.stringify(fileDetails)}</div>
}

export default FileSettings
