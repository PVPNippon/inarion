'use client'
import { LoggedInUserProvider } from '../../ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '../../ui/contexts/ProjectDataContext'
import ListGroups from '../../ui/components/ListGroups'
import GetGroup from '../../ui/components/GetGroup'
import ListDirectMembers from '../../ui/components/ListDirectMembers'
import ListAllMembers from '../../ui/components/ListAllMembers'
import ListGroupsActivities from '../../ui/components/ListGroupActivities'

function GroupsDashboard() {
  return (
    <LoggedInUserProvider>
      <ProjectDataProvider>
        <main className="text-white">
          <h2>Google Groups Page</h2>
          <p>This is a placeholder for the groups page.</p>
          <ListGroups></ListGroups>
          <ListGroupsActivities></ListGroupsActivities>
          <GetGroup></GetGroup>
          <ListDirectMembers></ListDirectMembers>
          <ListAllMembers></ListAllMembers>
        </main>
      </ProjectDataProvider>
    </LoggedInUserProvider>
  )
}

export default GroupsDashboard
