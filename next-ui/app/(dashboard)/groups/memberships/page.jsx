'use client'
import { LoggedInUserProvider } from '../../../ui/contexts/LoggedInUserContext'
import NestedGroupsLister from '../../../ui/components/NestedGroupsLister'

function GroupsNestedMembershipPage() {
  return (
    <LoggedInUserProvider>
      <div>
        <NestedGroupsLister></NestedGroupsLister>
      </div>
    </LoggedInUserProvider>
  )
}

export default GroupsNestedMembershipPage
