'use client'
import { LoggedInUserProvider } from '@/app/ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '@/app/ui/contexts/ProjectDataContext'
import ListGroups from '@/app/ui/components/ListGroups'
import GetGroup from '@/app/ui/components/GetGroup'
import ListDirectMembers from '@/app/ui/components/ListDirectMembers'
import ListAllMembers from '@/app/ui/components/ListAllMembers'
import ListGroupsActivities from '@/app/ui/components/ListGroupActivities'
import ListGroupJoinedActivities from '@/app/ui/components/ListGroupJoinedActivities'
import ExportGroups from '@/app/ui/components/ExportGroups'
import DeleteMembersViaCsv from '@/app/ui/components/DeleteMembersViaCsv'
import DeleteMemberFromGroups from '@/app/ui/components/DeleteMemberFromGroups'
import CreateGroup from '@/app/ui/components/CreateGroup'
import ListGroupSettings from '@/app/ui/components/ListGroupSettings'

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
        <main className="overflow-auto">
          <h2>Google Groups Page</h2>
          <p>This is a placeholder for the groups page.</p>
          <ListGroups></ListGroups>
          <ListGroupsActivities></ListGroupsActivities>
          <ListGroupJoinedActivities></ListGroupJoinedActivities>
          <GetGroup></GetGroup>
          <ListDirectMembers></ListDirectMembers>
          <ListAllMembers></ListAllMembers>
          <ExportGroups></ExportGroups>
          <DeleteMembersViaCsv></DeleteMembersViaCsv>
          <DeleteMemberFromGroups></DeleteMemberFromGroups>
          <CreateGroup></CreateGroup>
          <ListGroupSettings></ListGroupSettings>
        </main>
      </ProjectDataProvider>
    </LoggedInUserProvider>
  )
}

export default GroupsDashboard
