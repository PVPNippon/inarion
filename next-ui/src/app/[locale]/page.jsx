'use client'

import GoogleLoginButton from '../ui/components/GoogleAuth/googleLogin'

import { useTranslations, useLocale } from 'next-intl'

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
  const t = useTranslations('calendar')

  return (
    <div>
      {/* <RegisteOrLogin></RegisteOrLogin> */}
      <GoogleLoginButton></GoogleLoginButton>
    </div>
  )
}
