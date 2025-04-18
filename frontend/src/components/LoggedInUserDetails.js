/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import React, { useContext } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'

function LoggedInUserDetails() {
  const { email } = useContext(LoggedInUserContext) // Get the stored number and adminEmail from context

  return (
    <div>
      <p>Admin Email curentlky logged in: {email}</p> {/* Display the stored admin email */}
    </div>
  )
}

export default LoggedInUserDetails
