'use client'
import { LoggedInUserProvider } from '../../ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '../../ui/contexts/ProjectDataContext'
import HomePage from '../../ui/components/HomePage'

//at the moment this page is a dummy with some hard-coded data. You can view it by running the ui folder on localhost:3000 or docker and accessing it with http://localhost:3000/home-page
//you can see some white space at the bottom of the page. It's probably because the body is screen size, but this page is vertically longer than the screen(depends on window size)
//we will adjust the shared layout later when we have more pages with real contents.
/**
 * The HomePage component renders the home page of the app.
 *
 * @returns {JSX.Element} The JSX element representing the home page.
 */
export default function HP() {
  return (
    <LoggedInUserProvider>
      <ProjectDataProvider>
        <HomePage></HomePage>
      </ProjectDataProvider>
    </LoggedInUserProvider>
  )
}
