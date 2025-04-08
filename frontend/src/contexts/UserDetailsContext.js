/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import React, { createContext, useState, useEffect } from 'react'

// // Create the context
export const UserDetailsContext = createContext()

// // Create a provider component
export const UserDetailsProvider = ({ children }) => {
  // Initialize the state from localStorage or use an empty string
  const [userEmail, setUserEmail] = useState(() => {
    return window.localStorage.getItem('userEmail') || ''
  })

  // Save userEmail to localStorage whenever it changes
  useEffect(() => {
    window.localStorage.setItem('userEmail', userEmail)
  }, [userEmail])

  return <UserDetailsContext.Provider value={{ userEmail, setUserEmail }}>{children}</UserDetailsContext.Provider>
}
