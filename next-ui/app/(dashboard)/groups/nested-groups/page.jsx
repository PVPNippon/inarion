'use client'
import { LoggedInUserProvider } from '../../../ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '../../../ui/contexts/ProjectDataContext'
import NestedGroupsLister from '../../../ui/components/NestedGroupsLister'
import VisualizeHierarchy from '../../../ui/components/VisualizeHierarchy'

function NestedGroupsPageWrapper() {
  return (
    <LoggedInUserProvider>
      <ProjectDataProvider>
        <main className="text-white">
          <h2>Nested Groups Page</h2>
          <p>This is a placeholder for the nested groups page.</p>
          <NestedGroupsLister></NestedGroupsLister>
          <VisualizeHierarchy></VisualizeHierarchy>
        </main>
      </ProjectDataProvider>
    </LoggedInUserProvider>
  )
}

export default NestedGroupsPageWrapper
