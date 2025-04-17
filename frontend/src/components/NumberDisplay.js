/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import React, { useContext } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'

function NumberDisplay() {
  const { number, adminEmail } = useContext(LoggedInUserContext) // Get the stored number and adminEmail from context

  return (
    <div>
      <h2>Display Numbersss</h2>
      <p>Stored Number: {number}</p> {/* Display the stored number */}
      <p>Admin Email: {adminEmail}</p> {/* Display the stored admin email */}
    </div>
  )
}

export default NumberDisplay
