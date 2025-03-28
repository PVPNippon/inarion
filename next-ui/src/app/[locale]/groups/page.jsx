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
import { CreateGroup, CreateGroupsByCsv, CreateGroupsWithSerialNumbers } from '@/app/ui/components/CreateGroups'
import ListGroupSettings from '@/app/ui/components/ListGroupSettings'
import { Separator } from '@/components/ui/separator'
import AddMembersViaCsv from '@/app/ui/components/AddMembersViaCsv'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function GroupsDashboard() {
  return (
    <main className="overflow-auto space-y-7">
      <h2 className="text-3xl font-semibold text-center">Temporary Page for Google Groups</h2>
      <Tabs defaultValue="devtools">
        <TabsList className="flex m-auto w-fit">
          <TabsTrigger value="devtools" className="text-md ">
            DevTools
          </TabsTrigger>
          <TabsTrigger value="features" className="text-md">
            Features
          </TabsTrigger>
          <TabsTrigger value="apis" className="text-md">
            Backend response data
          </TabsTrigger>
        </TabsList>
        <TabsContent value="devtools">
          <CreateGroup></CreateGroup>
          <Separator className="my-4" />
          <CreateGroupsByCsv></CreateGroupsByCsv>
          <Separator className="my-4" />
          <CreateGroupsWithSerialNumbers></CreateGroupsWithSerialNumbers>
          <Separator className="my-4" />
          <AddMembersViaCsv></AddMembersViaCsv>
          <Separator className="my-4" />
        </TabsContent>
        <TabsContent value="features">
          <ExportGroups></ExportGroups>
          <Separator className="my-4" />
          <DeleteMembersViaCsv></DeleteMembersViaCsv>
          <Separator className="my-4" />
          <DeleteMemberFromGroups></DeleteMemberFromGroups>
          <Separator className="my-4" />
        </TabsContent>
        <TabsContent value="apis">
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
          <ListGroupSettings></ListGroupSettings>
          <Separator className="my-4" />
        </TabsContent>
      </Tabs>
    </main>
  )
}

export default GroupsDashboard
