import ListMyDriveFiles from '../../ui/components/ListMyDriveFiles'
import { LoggedInUserProvider } from '../../ui/contexts/LoggedInUserContext'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button, buttonVariants } from '@/components/ui/button'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectDataProvider } from '../../ui/contexts/ProjectDataContext'

/**
 * A placeholder component for the Drive page.
 *
 * @returns {JSX.Element} A JSX element with a heading and a paragraph that says
 * this is a placeholder for the Drive page.
 */
export default function MyDriveFiles() {
  return (
    <div>
      <div className="text-white w-[950px] overflow-auto">
        <p className="text-2xl leading-8 pb-6">Drive Analyzer</p>
        <p className="text-lg">List of Files, Folders, or Drives</p>
        <div className="flex items-center mt-6 place-content-between gap-12 ">
          {/* Combined Dropdown and Search Input */}
          <div
            className="w-full relative flex items-center rounded-lg px-4 py-2 gap-4"
            style={{ background: 'rgba(255, 255, 255, 0.13)' }}
          >
            {/* Dropdown */}
            <Select>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="--Search By--" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">ID</SelectItem>
                <SelectItem value="parentFolder">Parent Folder ID</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search"
              className="w-full p-2 text-black placeholder-gray-500 rounded-lg border-transparent caret-white bg-transparent focus:border-white focus:outline-none"
            />
          </div>

          {/* Toggle Button */}
          <div className="w-1/3 flex items-center space-x-2 justify-between">
            <Label className="text-white">Filter for deleted items</Label>
            <Switch id="filter" />
          </div>
        </div>
        <div className="w-full relative flex items-center rounded-lg  py-2 gap-2 mt-4">
          {/* Multiple Selects */}
          <Select>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="--Search By--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">ID</SelectItem>
              <SelectItem value="parentFolder">Parent Folder ID</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="--Search By--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">ID</SelectItem>
              <SelectItem value="parentFolder">Parent Folder ID</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="--Search By--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">ID</SelectItem>
              <SelectItem value="parentFolder">Parent Folder ID</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="--Search By--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">ID</SelectItem>
              <SelectItem value="parentFolder">Parent Folder ID</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="--Search By--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">ID</SelectItem>
              <SelectItem value="parentFolder">Parent Folder ID</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="--Search By--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">ID</SelectItem>
              <SelectItem value="parentFolder">Parent Folder ID</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full relative flex items-center rounded-lg  py-2 gap-[10px] mt-4">
          {/* Go Button: White background with black text */}
          <Button className="bg-white text-black hover:bg-gray-200 rounded-[24px]">Go</Button>

          {/* Clear All Filters Button: Transparent background with white outline */}
          <Button
            variant="outline"
            className="rounded-[24px] border-white bg-transparent text-white hover:bg-white hover:text-black"
          >
            Clear all Filters
          </Button>
        </div>
      </div>
      <div className="w-full h-50 overflow-auto mt-10">
        <LoggedInUserProvider>
          <ProjectDataProvider>
            <ListMyDriveFiles></ListMyDriveFiles>
          </ProjectDataProvider>
        </LoggedInUserProvider>
      </div>
    </div>
  )
}
