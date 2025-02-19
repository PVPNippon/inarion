'use client'
import { LoggedInUserProvider } from '../../ui/contexts/LoggedInUserContext'
import LoggedInUserDetails from '../../ui/components/LoggedInUserDetails'

/**
 * Profile component displays the email of the currently logged in user.
 *
 * It is a client-side component that wraps the LoggedInUserDetails
 * component with the LoggedInUserProvider, which sets up the context
 * for accessing the email of the logged in user.
 *
 * @returns {React.ReactElement} The JSX element for the profile page.
 */
export default function Profile() {
  return (
    <LoggedInUserProvider>
      <h1>Profile</h1>
      <LoggedInUserDetails />
    </LoggedInUserProvider>
  )
}
