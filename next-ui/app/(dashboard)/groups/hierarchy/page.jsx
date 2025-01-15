'use client'
import { LoggedInUserProvider } from '../../../ui/contexts/LoggedInUserContext'
import VisualizeHierarchy from '../../../ui/components/VisualizeHierarchy'

/**
 * A component that displays a placeholder for the Groups Hierarchy page.
 *
 * It uses the `LoggedInUserProvider` context provider to provide the `LoggedInUserContext` to its children.
 * It displays a heading and a paragraph explaining that it is a placeholder.
 * It also renders a `VisualizeHierarchy` component, which is a temporary component for development purposes.
 *
 * @returns {JSX.Element} A JSX element representing the Groups Hierarchy page.
 */
function GroupsHierarchyPage() {
  return (
    <LoggedInUserProvider>
      <main>
        <h2>Groups Hierarchy Page</h2>
        <p>This is a placeholder for the Groups Hierarchy page.</p>
        <VisualizeHierarchy></VisualizeHierarchy>
      </main>
    </LoggedInUserProvider>
  )
}

export default GroupsHierarchyPage
