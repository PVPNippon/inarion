/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import React, { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { CSVLink } from 'react-csv' // Import CSVLink from react-csv
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'

// Recursive function to display folders and files
const renderFileTree = (node) => {
  return (
    <ul key={node.id || node.path}>
      <li>
        {/* Show folder or file based on mimeType */}
        {node.mimeType === 'application/vnd.google-apps.folder' ? (
          <strong>📁 {node.name}</strong>
        ) : (
          <span>📄 {node.name}</span>
        )}

        {/* Render children if present */}
        {node.children && node.children.length > 0 && <ul>{node.children.map((child) => renderFileTree(child))}</ul>}
      </li>
    </ul>
  )
}

function ListMyDriveFiles() {
  const [filesData, setFilesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.post(
          'http://localhost:4000/api/drive/personal-drives',
          {
            userEmail: email,
            projectId: projectData.projectData.projectId,
            serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
            serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
          },
          {
            withCredentials: true,
          }
        )
        console.log(`response data personal drive files: ${response.data}`)
        setFilesData(response.data)
        setLoading(false)
      } catch (err) {
        setError(err)
        setLoading(false)
      }
    }

    fetchFiles()
  }, [email])

  if (loading) return <p>Loading files...</p>
  if (error) return <p>Error loading files: {error.message}</p>

  // Prepare data for CSV export
  // const csvData = filesData.flatMap(userFiles =>
  //   userFiles.files.map(file => ({
  //     email: userFiles.email,
  //     fileName: file.name,
  //     mimeType: file.mimeType,
  //     fileId: file.id,
  //   }))
  // );

  if (filesData.length === 0) {
    return <p>No files found.</p>
  }

  return (
    <div>
      {/* <p>{JSON.stringify(filesData)}</p> */}
      <div>
        <h2>Google Drive Files</h2>
        {filesData.map((userFiles, index) => (
          <div key={index}>
            <h3>User Email: {userFiles.email}</h3>
            <p>Drive Name: {userFiles.driveName}</p>
            <div>
              {userFiles.children && userFiles.children.length > 0 ? (
                userFiles.children.map((child) => renderFileTree(child))
              ) : (
                <p>No files available in this drive.</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* <CSVLink data={csvData} filename="drive_files.csv" className="btn btn-primary">
        Export to CSV
      </CSVLink> */}
    </div>
  )
}

export default ListMyDriveFiles
