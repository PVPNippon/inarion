'use client'

import NavLinks from './nav-links'

/**
 * A top-level component for rendering the side navigation bar. It accepts one
 * prop, `isCollapsed`, which determines whether the navigation bar is collapsed
 * or not. When collapsed, only the icons are shown, and the sub-routes are hidden.
 *
 * @param {boolean} isCollapsed - Whether the navigation bar is collapsed or not
 * @returns {React.ReactElement} The rendered side navigation bar
 */
export default function SideNav({ isCollapsed }) {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      {/* The outermost container */}
      <div
        className={`flex grow flex-col bg-white-14 rounded-md bg-contain items-left transition-all duration-300 ${
          isCollapsed ? 'pr-0' : 'pr-10'
        }`}
      >
        {/* The NavLinks component, which renders the navigation links */}
        <NavLinks isCollapsed={isCollapsed} />
      </div>
    </div>
  )
}
