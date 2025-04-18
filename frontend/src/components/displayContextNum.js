/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import React, { useContext } from 'react'
import { NumContext } from '../contexts/NumContext'

function DisplayNumContextValue() {
  const { contextNum } = useContext(NumContext)

  return (
    <div>
      <p>{contextNum}</p>
    </div>
  )
}

export default DisplayNumContextValue
