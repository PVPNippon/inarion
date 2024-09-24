'use client'
import React, { useContext } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'

/**
 * LoggedInUserDetails component displays the email of the currently
 * logged in user.
 *
 * It uses the LoggedInUserContext to get the email of the logged in user.
 *
 * @returns {React.ReactElement} The JSX element with the email display.
 */
function LoggedInUserDetails() {
  const { email } = useContext(LoggedInUserContext) // Get the stored number and adminEmail from context

  return (
    <div>
      <p className="text-white">Admin Email currently logged in: {email}</p> {/* Display the stored admin email */}
    </div>
  )
}

export default LoggedInUserDetails
