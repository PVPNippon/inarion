/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import React, { createContext, useState, useEffect } from 'react'
// Create the context
export const LoggedInUserContext = createContext()

// Create a provider component
export const LoggedInUserProvider = ({ children }) => {
  // Initialize the states from localStorage or use empty strings
  console.log('Inside loggedin user context')
  const [email, setEmail] = useState(() => {
    return window.localStorage.getItem('email') || ''
  })

  // Use effect to store the email in localStorage whenever it changes
  useEffect(() => {
    window.localStorage.setItem('email', email)
  }, [email])

  return <LoggedInUserContext.Provider value={{ email, setEmail }}>{children}</LoggedInUserContext.Provider>
}
