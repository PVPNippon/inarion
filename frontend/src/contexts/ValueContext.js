/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

// src/contexts/ValueContext.js
import React, { createContext, useState } from 'react'

export const ValueContext = createContext()

export const ValueProvider = ({ children }) => {
  const [email, setEmail] = useState('')

  return <ValueContext.Provider value={{ email, setEmail }}>{children}</ValueContext.Provider>
}
