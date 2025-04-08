/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import React, { createContext, useState, useEffect } from 'react'

export const NumContext = createContext()

export const NumProvider = ({ children }) => {
  const [contextNum, setContextNum] = useState(0)

  useEffect(() => {}, [contextNum])

  return <NumContext.Provider value={{ contextNum, setContextNum }}>{children}</NumContext.Provider>
}
