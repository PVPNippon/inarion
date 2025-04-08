/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import React, { useState, useEffect, useContext } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import axios from 'axios'
import { SettingsAccess } from './settings-access'
import { SquarePlusIcon, ChevronDownIcon, EllipsisIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Helper function to get the formatted file type
const getFileType = (mimeType) => {
  const type = mimeType.split('application/vnd.google-apps.')[1]
  return type ? type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ') : 'Unknown'
}

function FileCardRow({ name, itemId, mimeType, owner, sharedExternally, trashed, onChevronClick, isExpanded }) {
  return (
    <Card className="flex items-center justify-between py-3 px-5 mb-3 border rounded-lg custom-shadow">
      {/* Row Content */}
      <div className="flex w-full items-center">
        {/* Name */}
        <div className="flex-1">
          <span className="font-medium">{name}</span>
        </div>
        {/* Item ID - truncated */}
        <div className="flex-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className="text-gray-600 truncate">{itemId.slice(0, 10)}...</span>
              </TooltipTrigger>
              <TooltipContent>{itemId}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* MIME Type */}
        <div className="flex-1">
          <span>{mimeType}</span>
        </div>

        {/* Owner */}
        <div className="flex-1">
          <span>{owner}</span>
        </div>

        {/* Shared Externally */}
        <div className="flex-1">
          <span>{sharedExternally ? 'No' : 'Yes'}</span>
        </div>

        {/* Trashed */}
        <div className="flex-1">
          <span>{trashed}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <SquarePlusIcon className="h-5 w-5 cursor-pointer" />
          <ChevronDownIcon
            className={`h-5 w-5 cursor-pointer transition-transform duration-400 ${isExpanded ? 'rotate-180' : ''}`}
            onClick={onChevronClick}
          />
        </div>
      </div>
    </Card>
  )
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
          'http://localhost:4000/api/drive/all-drives',
          {
            adminEmail: email,
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

  if (loading) return <p>Loading folders...</p>
  if (error) return <p>Error loading folders: {error.message}</p>

  if (filesData.length === 0) {
    return <p>No data available.</p>
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">Drive Files</h3>

      <Card className="flex items-center justify-between py-3 px-5 mb-3 border rounded-lg custom-shadow">
        {/* Row Content */}
        <div className="flex w-full items-center">
          {/* Name */}
          <div className="flex-1">
            <span>Name</span>
          </div>

          {/* Item ID */}
          <div className="flex-1">
            <span>Item ID</span>
          </div>

          {/* Type */}
          <div className="flex-1">
            <span>Type</span>
          </div>

          {/* Owner */}
          <div className="flex-1">
            <span>Owner</span>
          </div>

          {/* Shared Externally */}
          <div className="flex-1">
            <span>Shared Externally?</span>
          </div>

          {/* Trashed */}
          <div className="flex-1">
            <span>Trashed</span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <EllipsisIcon className="h-5 w-5 cursor-pointer" />
            <ChevronDownIcon className="h-5 w-5 text-white" />
          </div>
        </div>
      </Card>

      {/* File Rows */}
      {filesData.map((userFiles, index) => (
        <React.Fragment key={index}>
          {userFiles.children
            .filter((child) => child.mimeType === 'application/vnd.google-apps.folder')
            .map((folder) => (
              <React.Fragment key={folder.id}>
                <FileCardRow
                  name={folder.name}
                  itemId={folder.id}
                  mimeType={getFileType(folder.mimeType)}
                  owner={userFiles.email}
                  sharedExternally="No"
                  trashed={folder.trashed ? 'Yes' : 'No'}
                  onChevronClick={() => toggleFolder(folder.id)}
                  isExpanded={expandedFolders[folder.id]}
                />
                <div
                  className={`overflow-hidden  animate-fade-in transition-all duration-500 ease-in-out ${
                    expandedFolders[folder.id] ? ' opacity-100 my-5' : 'max-h-0 opacity-0 my-0'
                  }`}
                >
                  <SettingsAccess />
                </div>
              </React.Fragment>
            ))}
        </React.Fragment>
      ))}
    </div>
  )
}

export default ListMyDriveFiles
