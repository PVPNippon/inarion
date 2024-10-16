'use client'
import { LoggedInUserProvider } from '../../ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '../../ui/contexts/ProjectDataContext'
import ListGroups from '../../ui/components/ListGroups'
import GetGroup from '../../ui/components/GetGroup'
import ListDirectMembers from '../../ui/components/ListDirectMembers'
import ListAllMembers from '../../ui/components/ListAllMembers'
import ListGroupsActivities from '../../ui/components/ListGroupActivities'
import ListGroupJoinedActivities from '../../ui/components/ListGroupJoinedActivities'

/**
 * A component that displays a Google Groups page.
 *
 * It is a placeholder that contains examples of all the components that can be used to display information about Google Groups.
 *
 * @returns {JSX.Element} A JSX element that displays a Google Groups page.
 */
//A temporary page for groups feature development.
//It reflects data for various groups routes in the UI, for dev purposes.
function GroupsDashboard() {
  return (
    <LoggedInUserProvider>
      <ProjectDataProvider>
        <main className="text-white">
          <h2>Google Groups Page</h2>
          <p>This is a placeholder for the groups page.</p>
          <ListGroups></ListGroups>
          <ListGroupsActivities></ListGroupsActivities>
          <ListGroupJoinedActivities></ListGroupJoinedActivities>
          <GetGroup></GetGroup>
          <ListDirectMembers></ListDirectMembers>
          <ListAllMembers></ListAllMembers>
        </main>
      </ProjectDataProvider>
    </LoggedInUserProvider>
  )
}

export default GroupsDashboard
