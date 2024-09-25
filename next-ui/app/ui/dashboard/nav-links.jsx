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
  { name: 'Drive & Docs', href: '/drive', icon: FolderIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Groups & Users', href: '/people', icon: UserGroupIcon },
  { name: 'Alert Center', href: '/notifications', icon: BellIcon },
  { name: 'Settings', href: '/settings', icon: Cog8ToothIcon },
  { name: 'Logout', href: '/logout', icon: ArrowRightStartOnRectangleIcon },
]

export default function NavLinks({ isCollapsed }) {
  return (
    <ValueProvider>
      <LoggedInUserProvider>
        <div className="flex flex-col space-y-2 p-2">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center text-white rounded-md p-2 hover:bg-gray-700"
            >
              <link.icon className="h-5 w-5 mr-2" />
              {!isCollapsed && <span>{link.name}</span>}
            </Link>
          ))}
        </div>
      </LoggedInUserProvider>
    </ValueProvider>
  )
}
