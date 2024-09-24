'use client'

import NavLinks from './nav-links'

export default function SideNav({ isCollapsed }) {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <div
        className={`flex grow flex-col bg-white-14 rounded-md bg-contain items-left transition-all duration-300 ${
          isCollapsed ? 'pr-0' : 'pr-10'
        }`}
      >
        <NavLinks isCollapsed={isCollapsed} />
      </div>
    </div>
  )
}
