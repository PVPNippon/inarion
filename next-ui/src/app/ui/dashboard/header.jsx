'use client'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import FoxLogo from '../images/logo.png' // Ensure you have this logo in your public folder
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import LocaleSwitcher from '../components/LocaleSwitcher'
import { SidebarTrigger } from '@/components/ui/sidebar'

/**
 * The Header component renders the top navigation bar of the app.
 *
 * @param {{ toggleNav: () => void }} props - Component props.
 * @prop {() => void} toggleNav - A function that toggles the visibility of the
 * sidebar navigation.
 *
 * @returns {JSX.Element} The JSX element representing the navigation bar.
 */
export default function Header({ toggleNav }) {
  return (
    <header className="w-full flex items-center justify-between border-b border-gray-200 py-3 pr-4 pl-6">
      {/* Left Section - Logo and Title */}
      <div className="flex items-center space-x-2">
        <SidebarTrigger />
        {/* Logo */}
        <Image src={FoxLogo} alt="Logo" width={24} height={24} />
        {/* Title */}
        <h1 className="font-medium text-lg">Inarion</h1>
      </div>

      {/* Right Section - User Profile */}
      <div className="flex items-center">
        <LocaleSwitcher />
        {/* User Profile Image */}
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
