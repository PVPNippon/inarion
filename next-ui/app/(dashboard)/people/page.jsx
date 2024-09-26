'use client'
/**
 * A placeholder component for the people page.
 *
 * @returns {JSX.Element} A JSX element with a heading and a paragraph that says
 * this is a placeholder for the people page.
 */
import { LoggedInUserProvider } from '../../ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '../../ui/contexts/ProjectDataContext'
import ListDomainUsers from '../../ui/components/ListDomainUsers'
export default function People() {
  return (
    <LoggedInUserProvider>
      <ProjectDataProvider>
        <h2 className="text-white">People</h2>
        <p className="text-white">This is a placeholder for the people page.</p>
        <ListDomainUsers></ListDomainUsers>
      </ProjectDataProvider>
    </LoggedInUserProvider>
  )
}
