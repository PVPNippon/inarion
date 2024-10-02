import React, { useState } from 'react'
import Link from 'next/link'
import {
  HomeIcon,
  CalendarIcon,
  FolderIcon,
  UserGroupIcon,
  BellIcon,
  Cog8ToothIcon,
  ArrowRightStartOnRectangleIcon,
  UserIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

import { ValueProvider } from '../contexts/ValueContext'
import { LoggedInUserProvider } from '../contexts/LoggedInUserContext'

const links = [
  { name: 'Home', href: '/', icon: HomeIcon },
  {
    name: 'Drive & Docs',
    icon: FolderIcon,
    sublinks: [
      { name: 'My Drive', href: '/drive', icon: UserIcon },
      { name: 'Shared Drives', href: '/drive/shared-drives', icon: UsersIcon },
    ],
  },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Groups & Users', href: '/people', icon: UserGroupIcon },
  { name: 'Alert Center', href: '/notifications', icon: BellIcon },
  { name: 'Settings', href: '/settings', icon: Cog8ToothIcon },
  { name: 'Logout', href: '/logout', icon: ArrowRightStartOnRectangleIcon },
]

/**
 * A component that renders a navigation bar with links to various pages in the app.
 * The navbar is collapsible, with a parent link that expands to show sub-routes when
 * clicked. The links are rendered as buttons with icons and optional text labels,
 * depending on whether the navbar is collapsed or not.
 *
 * @param {boolean} isCollapsed - Whether the navbar is collapsed or not. When
 * collapsed, only the icons are shown, and the sub-routes are hidden.
 */
export default function NavLinks({ isCollapsed }) {
  const [open, setOpen] = useState(false)

  /**
   * Toggles the accordion open/closed state.
   */
  const toggleAccordion = () => {
    setOpen(!open)
  }

  return (
    <ValueProvider>
      <LoggedInUserProvider>
        <div className="flex flex-col space-y-2 p-2">
          {/* Loop through the links array and render each link */}
          {links.map((link) => (
            <div key={link.name}>
              {/* If the link has sublinks, render a parent link with an icon */}
              {link.sublinks ? (
                <>
                  <button
                    onClick={toggleAccordion}
                    className="flex items-center text-white rounded-md p-2 hover:bg-gray-700 w-full text-left"
                  >
                    {/* Show the icon, and if the navbar is not collapsed, show the link text */}
                    <link.icon className="h-5 w-5 mr-2" />
                    {!isCollapsed && <span>{link.name}</span>}
                  </button>

                  {/* If the accordion is open, show the sub-routes */}
                  {open && (
                    <div className="pl-6">
                      {/* Loop through the sublinks array and render each sub-route */}
                      {link.sublinks.map((sublink) => (
                        <Link
                          key={sublink.name}
                          href={sublink.href}
                          className="flex items-center text-white rounded-md p-2 hover:bg-gray-600"
                        >
                          {/* Show the sub-route's specific icon, whether collapsed or not */}
                          <sublink.icon className="h-5 w-5 mr-2" />
                          {/* If the navbar is not collapsed, show the sub-route's text */}
                          {!isCollapsed && <span>{sublink.name}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={link.href} className="flex items-center text-white rounded-md p-2 hover:bg-gray-700">
                  {/* Show the icon, and if the navbar is not collapsed, show the link text */}
                  <link.icon className="h-5 w-5 mr-2" />
                  {!isCollapsed && <span>{link.name}</span>}
                </Link>
              )}
            </div>
          ))}
        </div>
      </LoggedInUserProvider>
    </ValueProvider>
  )
}
