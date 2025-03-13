'use client'

import ListGroups from '@/app/ui/components/ListGroups'
import GetGroup from '@/app/ui/components/GetGroup'
import ListDirectMembers from '@/app/ui/components/ListDirectMembers'
import ListAllMembers from '@/app/ui/components/ListAllMembers'
import ListGroupsActivities from '@/app/ui/components/ListGroupActivities'
import ListGroupJoinedActivities from '@/app/ui/components/ListGroupJoinedActivities'
import ExportGroups from '@/app/ui/components/ExportGroups'
import DeleteMembersViaCsv from '@/app/ui/components/DeleteMembersViaCsv'
import DeleteMemberFromGroups from '@/app/ui/components/DeleteMemberFromGroups'
import { CreateGroups, CreateGroupsWithSerialNumbers } from '@/app/ui/components/CreateGroups'
import ListGroupSettings from '@/app/ui/components/ListGroupSettings'
import { Separator } from '@/components/ui/separator'
import DeleteMembersViaCsv2 from '@/app/ui/components/DeleteMembersViaCsv2'
import AddMembersViaCsv from '@/app/ui/components/AddMembersViaCsv'

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
    <main className="overflow-auto">
      <h2>Google Groups Page</h2>
      <p>This is a placeholder for the groups page.</p>
      <ListGroups></ListGroups>
      <Separator className="my-4" />
      <ListGroupsActivities></ListGroupsActivities>
      <Separator className="my-4" />
      <ListGroupJoinedActivities></ListGroupJoinedActivities>
      <Separator className="my-4" />
      <GetGroup></GetGroup>
      <Separator className="my-4" />
      <ListDirectMembers></ListDirectMembers>
      <Separator className="my-4" />
      <ListAllMembers></ListAllMembers>
      <Separator className="my-4" />
      <ExportGroups></ExportGroups>
      <Separator className="my-4" />
      <DeleteMembersViaCsv></DeleteMembersViaCsv>
      <Separator className="my-4" />
      <DeleteMembersViaCsv2></DeleteMembersViaCsv2>
      <Separator className="my-4" />
      <DeleteMemberFromGroups></DeleteMemberFromGroups>
      <Separator className="my-4" />
      <CreateGroups></CreateGroups>
      <Separator className="my-4" />
      <CreateGroupsWithSerialNumbers></CreateGroupsWithSerialNumbers>
      <Separator className="my-4" />
      <ListGroupSettings></ListGroupSettings>
      <Separator className="my-4" />
      <AddMembersViaCsv></AddMembersViaCsv>
      <Separator className="my-4" />
    </main>
  )
}

export default GroupsDashboard
