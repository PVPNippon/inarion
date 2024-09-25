import ListMyDriveFiles from '../../ui/components/ListMyDriveFiles'
import { LoggedInUserProvider } from '../../ui/contexts/LoggedInUserContext'

export default function MyDriveFiles() {
  return (
    <div className="text-white w-[910px]">
      <p className="text-2xl leading-8 pb-6">Drive Analyzer</p>
      <p className="text-lg">List of Files, Folders, or Drives</p>
      <div className="flex items-center mt-6 place-content-between gap-2 ">
        {/* Combined Dropdown and Search Input */}
        <div
          className="w-3/5 relative flex items-center rounded-lg px-4 py-2"
          style={{ background: 'rgba(255, 255, 255, 0.13)' }}
        >
          {/* Dropdown */}
          <select
            className="w-[120px] h-[30px] bg-white bg-opacity-13 text-white placeholder-gray-500 rounded-[6px] px-3 py-1 border-transparent caret-white focus:border-white mr-2"
            style={{ background: 'rgba(255, 255, 255, 0.13)' }}
          >
            <option value="id">ID</option>
            <option value="name">Name</option>
            <option value="parentFolderId">Parent Folder ID</option>
          </select>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search"
            className="w-full p-2 text-black placeholder-gray-500 rounded-lg border-transparent caret-white bg-transparent focus:border-white focus:outline-none"
          />
        </div>

        {/* Toggle Button */}
        <label className="ml-4 flex items-center cursor-pointer">
          <input type="checkbox" className="hidden" />
          <span className="relative inline-block w-12 h-6 rounded-full bg-gray-300">
            <span className="absolute left-0 top-0 w-6 h-6 bg-blue-500 rounded-full transition-transform duration-200 transform"></span>
          </span>
          <span className="ml-2 text-white">Filter for deleted items</span>
        </label>
      </div>

      {/* <LoggedInUserProvider>
        <div>
          <ListMyDriveFiles />
        </div>
      </LoggedInUserProvider> */}
    </div>
  )
}
