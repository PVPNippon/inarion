import React, { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import { CSVLink } from 'react-csv' // Import CSVLink from react-csv
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'

// Recursive function to render folders and files
const renderFileTree = (node) => {
  return (
    <ul key={node.id || node.path}>
      <li>
        {/* Check if it's a folder or file */}
        {node.mimeType === 'application/vnd.google-apps.folder' ? (
          <strong>📁 {node.name}</strong>
        ) : (
          <span>📄 {node.name}</span>
        )}

        {/* Recursively render children if present */}
        {node.children && node.children.length > 0 && <ul>{node.children.map((child) => renderFileTree(child))}</ul>}
      </li>
    </ul>
  )
}

/**
 * Displays a list of files in the shared drive.
 *
 * This component fetches the list of files in the shared drive from the API endpoint
 * and displays them in a hierarchical structure. Each folder is indented and each
 * file is linked to the `FileSettings` page with the file ID and impersonating email
 * as query parameters.
 *
 * @returns {React.ReactElement} The JSX for the component.
 */
function ListSharedDriveFiles() {
  const [sharedDrivesData, setsharedDrivesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.post(
          'http://localhost:4000/api/drive/shared-drives',
          {
            userEmail: email,
            //   projectId: projectData.projectData.projectId,
            serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
            //   serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
          },
          {
            withCredentials: true,
          }
        )
        console.log(response.data)
        setsharedDrivesData(response.data)
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
  //   const csvData = sharedDrivesData.flatMap(userFiles =>
  //     userFiles.files.map(file => ({
  //       email: userFiles.email,
  //       fileName: file.name,
  //       mimeType: file.mimeType,
  //       fileId: file.id,
  //     }))
  //   );

  return (
    <div className="text-white">
      <h2>Shared Drive Files</h2>
      {sharedDrivesData.length === 0 ? (
        <p>No files found in the shared drive.</p>
      ) : (
        <div>
          {sharedDrivesData.map((drive, index) => (
            <div key={index}>
              <h3>Drive Name: {drive.driveName}</h3>
              {drive.children && drive.children.length > 0 ? (
                drive.children.map((child) => renderFileTree(child))
              ) : (
                <p>No files in this drive.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ListSharedDriveFiles
