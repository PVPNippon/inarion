'use client'
import { LoggedInUserProvider } from '../../../ui/contexts/LoggedInUserContext'
import NestedGroupsLister from '../../../ui/components/NestedGroupsLister'

function GroupsNestedMembershipPage() {
  return (
    <LoggedInUserProvider>
      <main>
        <NestedGroupsLister></NestedGroupsLister>
      </main>
    </LoggedInUserProvider>
  )
}

export default GroupsNestedMembershipPage
