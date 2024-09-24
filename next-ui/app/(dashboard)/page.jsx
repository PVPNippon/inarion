'use client'

import RegisteOrLogin from '../ui/components/RegisterOrLoginForm'
import { LoggedInUserProvider } from '../ui/contexts/LoggedInUserContext'
import { ValueProvider } from '../ui/contexts/ValueContext'

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
