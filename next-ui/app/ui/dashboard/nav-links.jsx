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
} from '@heroicons/react/24/outline'

import { ValueProvider } from '../contexts/ValueContext'
import { LoggedInUserProvider } from '../contexts/LoggedInUserContext'

const links = [
  { name: 'Home', href: '/', icon: HomeIcon },
  {
    name: 'Drive & Docs',
    icon: FolderIcon,
    sublinks: [
      { name: 'My Drive', href: '/drive' },
      { name: 'Shared Drives', href: '/drive/shared-drives' },
    ],
  },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Groups & Users', href: '/people', icon: UserGroupIcon },
  { name: 'Alert Center', href: '/notifications', icon: BellIcon },
  { name: 'Settings', href: '/settings', icon: Cog8ToothIcon },
  { name: 'Logout', href: '/logout', icon: ArrowRightStartOnRectangleIcon },
]

export default function NavLinks({ isCollapsed }) {
  const [open, setOpen] = useState(false)

  const toggleAccordion = () => {
    setOpen(!open)
  }

  return (
    <ValueProvider>
      <LoggedInUserProvider>
        <div className="flex flex-col space-y-2 p-2">
          {links.map((link) => (
            <div key={link.name}>
              {link.sublinks ? (
                <>
                  <button
                    onClick={toggleAccordion}
                    className="flex items-center text-white rounded-md p-2 hover:bg-gray-700 w-full text-left"
                  >
                    <link.icon className="h-5 w-5 mr-2" />
                    {!isCollapsed && <span>{link.name}</span>}
                  </button>
                  {open && (
                    <div className="pl-6">
                      {link.sublinks.map((sublink) => (
                        <Link
                          key={sublink.name}
                          href={sublink.href}
                          className="flex items-center text-white rounded-md p-2 hover:bg-gray-600"
                        >
                          <span>{sublink.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={link.href} className="flex items-center text-white rounded-md p-2 hover:bg-gray-700">
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
