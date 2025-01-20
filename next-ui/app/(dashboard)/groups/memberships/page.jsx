'use client'
import { LoggedInUserProvider } from '../../../ui/contexts/LoggedInUserContext'
import NestedGroupsLister from '../../../ui/components/NestedGroupsLister'

function GroupsNestedMembershipPage() {
  return (
    <LoggedInUserProvider>
      <NestedGroupsLister></NestedGroupsLister>
    </LoggedInUserProvider>
  )
}

export default GroupsNestedMembershipPage
