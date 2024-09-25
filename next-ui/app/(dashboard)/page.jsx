'use client'

import RegisteOrLogin from '../ui/components/RegisterOrLoginForm'
import { LoggedInUserProvider } from '../ui/contexts/LoggedInUserContext'
import { ValueProvider } from '../ui/contexts/ValueContext'

/**
 * The Home component is the main entry point for the client side of the
 * application. It wraps the RegisteOrLogin component with the
 * LoggedInUserProvider and ValueProvider context providers. This allows the
 * RegisteOrLogin to access the context values and update them when the user
 * logs in or registers.
 *
 * @returns {React.ReactElement} The JSX element for the home page.
 */
export default function Home() {
  return (
    <ValueProvider>
      <LoggedInUserProvider>
        <div>
          <RegisteOrLogin></RegisteOrLogin>
        </div>
      </LoggedInUserProvider>
    </ValueProvider>
  )
}
