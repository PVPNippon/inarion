'use client'
/**
 * A placeholder component for the people page.
 *
 * @returns {JSX.Element} A JSX element with a heading and a paragraph that says
 * this is a placeholder for the people page.
 */
import { LoggedInUserProvider } from '@/app/ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '@/app/ui/contexts/ProjectDataContext'
import ListDomainUsers from '@/app/ui/components/ListDomainUsers'
export default function People() {
  return (
    <LoggedInUserProvider>
      <ProjectDataProvider>
        <h2>People</h2>
        <p>This is a placeholder for the people page.</p>
        <ListDomainUsers></ListDomainUsers>
      </ProjectDataProvider>
    </LoggedInUserProvider>
  )
}
