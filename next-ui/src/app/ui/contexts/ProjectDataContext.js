/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'
// contexts/ProjectDataContext.js
import React, { createContext, useState, useEffect } from 'react'

export const ProjectDataContext = createContext()

export const ProjectDataProvider = ({ children }) => {
  console.log('Inside Project Data context')

  const [projectData, setProjectData] = useState(() => {
    if (typeof window !== 'undefined') {
      //added this to prevent rendering error when running next build
      const storedData = window.localStorage.getItem('projectData')
      return storedData ? JSON.parse(storedData) : null // Parse the JSON string
    } else {
      return null
    }
  })

  useEffect(() => {
    // Update localStorage whenever projectData changes
    if (typeof window !== 'undefined') {
      if (projectData) {
        window.localStorage.setItem('projectData', JSON.stringify(projectData))
      } else {
        window.localStorage.removeItem('projectData')
      }
    } else {
      return null
    }
  }, [projectData])

  return <ProjectDataContext.Provider value={{ projectData, setProjectData }}>{children}</ProjectDataContext.Provider>
}
