'use client'
import { LoggedInUserProvider } from '@/app/ui/contexts/LoggedInUserContext'
import Logout from '@/app/ui/components/Logout'

/**
 * A Next.js page that wraps the Logout component in a LoggedInUserProvider.
 *
 * This is a test page that can be used to test the Logout component.
 *
 * @returns {React.ReactElement} A React element that renders the Logout
 * component wrapped in a LoggedInUserProvider.
 */
export default function LogoutTest() {
  return (
    <LoggedInUserProvider>
      <Logout />
    </LoggedInUserProvider>
  )
}
