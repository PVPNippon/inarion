'use client'
import { LoggedInUserProvider } from '../../../ui/contexts/LoggedInUserContext'
import NestedGroupsLister from '../../../ui/components/NestedGroupsLister'

function GroupsNestedMembershipPage() {
  return (
    <LoggedInUserProvider>
      <main>
        <h2>Nested Groups Page</h2>
        <p>This is a placeholder for the nested groups page.</p>
        <NestedGroupsLister></NestedGroupsLister>
      </main>
    </LoggedInUserProvider>
  )
}

export default GroupsNestedMembershipPage
