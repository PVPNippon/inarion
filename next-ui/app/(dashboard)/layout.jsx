'use client'

import { useState } from 'react'
import Header from '../ui/dashboard/header'
import SideNav from '../ui/dashboard/sidenav'

export const experimental_ppr = true

/**
 * A top-level component for rendering a dashboard page.
 *
 * This component is responsible for rendering the overall layout of the page,
 * including the header, side navigation, and main content area. It accepts
 * a single child element, which will be rendered in the main content area.
 *
 * The side navigation is initially collapsed to a narrow width, and can be
 * expanded or collapsed by clicking the toggle button in the header.
 *
 * @param {React.ReactElement} children - The child element to render in the
 * content area.
 * @returns {React.ReactElement} The rendered dashboard layout.
 */
export default function Layout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  /**
   * Toggle the collapsed state of the side navigation.
   */
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
        <div className="flex-grow p-6 md:overflow-y-auto md:p-12 bg-black">{children}</div>
      </div>
    </div>
  )
}
