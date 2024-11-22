'use client'
import { LoggedInUserProvider } from '../../../ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '../../../ui/contexts/ProjectDataContext'
import NestedGroupsLister from '../../../ui/components/NestedGroupsLister'
import VisualizeHierarchy from '../../../ui/components/VisualizeHierarchy'

/**
 * A wrapper component for the Nested Groups page.
 *
 * This component provides the necessary context providers for
 * logged in user and project data, and renders the main content
 * of the nested groups page. It includes a heading, a placeholder
 * paragraph, and components for listing nested groups and visualizing
 * their hierarchy.
 *
 * @returns {JSX.Element} A JSX element representing the nested groups page.
 */
function NestedGroupsPageWrapper() {
  return (
    <LoggedInUserProvider>
      <ProjectDataProvider>
        <main>
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
