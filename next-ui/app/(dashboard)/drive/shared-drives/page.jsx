'use client'
import React from 'react'
import ListSharedDriveFiles from '../../../ui/components/ListSharedDriveFiles'
import { LoggedInUserProvider } from '../../../ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '../../../ui/contexts/ProjectDataContext'

function page() {
  return (
    <LoggedInUserProvider>
      <ProjectDataProvider>
        <h2 className="text-white">Shared drives</h2>
        <ListSharedDriveFiles></ListSharedDriveFiles>
      </ProjectDataProvider>
    </LoggedInUserProvider>
  )
}

export default page
