'use client'
import { LoggedInUserProvider } from '../../ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '../../ui/contexts/ProjectDataContext'
import ListGroups from '../../ui/components/ListGroups'

function GroupsDashboard() {
  return (
    <LoggedInUserProvider>
      <ProjectDataProvider>
        <h2 className="text-white">Google Groups Page</h2>
        <p className="text-white">This is a placeholder for the groups page.</p>
        <ListGroups></ListGroups>
      </ProjectDataProvider>
    </LoggedInUserProvider>
  )
}

export default GroupsDashboard
