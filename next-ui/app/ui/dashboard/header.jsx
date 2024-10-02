import { Bars3BottomLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline'

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
    <header className="w-full flex items-center justify-between p-4 bg-black">
      {/* Menu Icon */}
      <div className="flex items-center">
        <button onClick={toggleNav}>
          <Bars3BottomLeftIcon className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Title and Logo */}
      <div className="flex items-center justify-center">
        <h1 className="text-white text-3xl font-bold mr-4">Placeholder Title</h1>
        <div className="h-12 w-12 bg-gray-500"></div>
      </div>

      {/* User Profile Icon */}
      <div className="flex items-center">
        <UserCircleIcon className="h-8 w-8 text-white" />
      </div>
    </header>
  )
}
