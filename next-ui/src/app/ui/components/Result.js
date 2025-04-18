/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'
// src/components/Result.js
import React, { useContext } from 'react'
import { ValueContext } from '../contexts/ValueContext'

const Result = () => {
  const { email } = useContext(ValueContext)

  return (
    <div>
      <h2>Result</h2>
      <p>Email: {email}</p>
    </div>
  )
}

export default Result
