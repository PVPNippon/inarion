'use client'

import { useState } from 'react'
import Header from '../ui/dashboard/header'
import SideNav from '../ui/dashboard/sidenav'

export const experimental_ppr = true

export default function Layout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  const toggleNav = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <Header toggleNav={toggleNav} />

      {/* Main Content Area */}
      <div className="flex flex-grow">
        {/* Side Navigation */}
        <div
          className={`${
            isCollapsed
              ? 'w-16 md:w-20' // Narrow width when collapsed
              : 'w-64 md:w-72' // Expanded width
          } transition-all duration-300 bg-black hidden md:flex`}
        >
          <SideNav isCollapsed={isCollapsed} />
        </div>

        {/* Content Area */}
        <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
      </div>
    </div>
  )
}
