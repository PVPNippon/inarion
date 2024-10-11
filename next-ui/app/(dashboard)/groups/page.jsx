'use client'
import { LoggedInUserProvider } from '../../ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '../../ui/contexts/ProjectDataContext'
import ListGroups from '../../ui/components/ListGroups'
import GetGroup from '../../ui/components/GetGroup'

function GroupsDashboard() {
  return (
    <LoggedInUserProvider>
      <ProjectDataProvider>
        <main className="text-white">
          <h2>Google Groups Page</h2>
          <p>This is a placeholder for the groups page.</p>
          <ListGroups></ListGroups>
          <GetGroup></GetGroup>
        </main>
      </ProjectDataProvider>
    </LoggedInUserProvider>
  )
}

export default GroupsDashboard
