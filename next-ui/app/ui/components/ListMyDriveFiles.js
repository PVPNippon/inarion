'use client'

import React, { useState, useEffect, useContext } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import axios from 'axios'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

// Helper function to get the formatted file type
const getFileType = (mimeType) => {
  const type = mimeType.split('application/vnd.google-apps.')[1]
  return type ? type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ') : 'Unknown'
}

const ListMyDriveFiles = () => {
  const [filesData, setFilesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedFolders, setExpandedFolders] = useState({})
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
        setFilesData(response.data)
        setLoading(false)
      } catch (err) {
        setError(err)
        setLoading(false)
      }
    }

    fetchFiles()
  }, [email, projectData])

  const toggleFolder = (id) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const renderChildren = (children, level = 1) => {
    return children.map((child) => (
      <React.Fragment key={child.id}>
        <TableRow
          className="cursor-pointer"
          onClick={() => toggleFolder(child.id)}
          style={{ paddingLeft: `${level * 20}px` }} // Add indentation based on level
        >
          <TableCell className="pl-8">
            {child.mimeType === 'application/vnd.google-apps.folder' ? <>📁 {child.name}</> : <>📄 {child.name}</>}
          </TableCell>
          <TableCell>{getFileType(child.mimeType)}</TableCell>
          <TableCell>{child.modifiedTime}</TableCell>
        </TableRow>
        {/* Recursively render children if folder is expanded */}
        {expandedFolders[child.id] && child.children && child.children.length > 0 && (
          <>{renderChildren(child.children, level + 1)}</> // Increment level for nested children
        )}
      </React.Fragment>
    ))
  }

  if (loading) return <p>Loading folders...</p>
  if (error) return <p>Error loading folders: {error.message}</p>

  if (filesData.length === 0) {
    return <p>No folders found.</p>
  }

  return (
    <div className="max-h-screen overflow-auto p-4">
      {filesData.map((userFiles, index) => (
        <div key={index} className="mb-8">
          <h3 className="text-lg font-bold mb-2 text-white">
            {userFiles.email}'s Drive ({userFiles.driveName})
          </h3>

          <div className="overflow-auto max-h-[400px]">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Folder Name</TableHead>
                  <TableHead>MIME Type</TableHead>
                  <TableHead>Last Modified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-white">
                {userFiles.children && userFiles.children.length > 0 ? (
                  userFiles.children
                    .filter((child) => child.mimeType === 'application/vnd.google-apps.folder') // Only display folders
                    .map((folder) => (
                      <React.Fragment key={folder.id}>
                        <TableRow
                          className="border-b border-gray-200 cursor-pointer"
                          onClick={() => toggleFolder(folder.id)}
                        >
                          <TableCell>
                            <Badge className="bg-white-14">📁 {folder.name}</Badge>
                          </TableCell>
                          <TableCell>{getFileType(folder.mimeType)}</TableCell>
                          <TableCell>{folder.modifiedTime}</TableCell>
                        </TableRow>
                        {/* Render folder's children with indentation */}
                        {expandedFolders[folder.id] && folder.children && folder.children.length > 0 && (
                          <>{renderChildren(folder.children, 2)}</> // Start at level 2 for children
                        )}
                      </React.Fragment>
                    ))
                ) : (
                  <TableRow>
                    <TableCell className="text-center text-white" colSpan={3}>
                      No folders available in this drive.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ListMyDriveFiles
