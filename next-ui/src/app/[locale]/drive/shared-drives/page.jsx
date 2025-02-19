'use client'
import React from 'react'
import ListSharedDriveFiles from '@/app/ui/components/ListSharedDriveFiles'
import { LoggedInUserProvider } from '@/app/ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '@/app/ui/contexts/ProjectDataContext'

/**
 * Page component that displays the list of shared drives in the GCP project.
 *
 * The page uses the LoggedInUserProvider and ProjectDataProvider to get the email
 * of the currently logged in user and the project data from the context.
 *
 * The page displays a heading and the ListSharedDriveFiles component to display the list of
 * shared drives and their files.
 */
function page() {
  return (
    <LoggedInUserProvider>
      <ProjectDataProvider>
        <h2>Shared drives</h2>
        <ListSharedDriveFiles></ListSharedDriveFiles>
      </ProjectDataProvider>
    </LoggedInUserProvider>
  )
}

export default page
