/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import React, { useState, useEffect, useRef, use } from 'react'
import { fetchAllUsers } from './usersApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CustomTable,
  CustomTableHeader,
  CustomTableBody,
  CustomTableRow,
  CustomTableCell,
  CustomTableHead,
} from '@/components/ui/custom-table'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogPortal,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import CsvDownloadButton from 'react-json-to-csv'
import { ExternalLinkIcon, SearchIcon, EyeIcon, Ellipsis, CircleAlert } from 'lucide-react'
import { CustomIconExport } from '@/app/ui/svg-icons/custom-icons'
import { groupsStyles, groupElementIds, groupStrings } from '@/app/ui/variables/group-variables'
import DeleteUsersViaCsvDialog from '@/app/ui/components/user-delete-in-bulk'
import TurnOff2svViaCsvDialog from '@/app/ui/components/user-2sv-off-in-bulk'

const columnHeaders = [
  'Name',
  'Email address',
  'Organizational Unit',
  'Enrolled in 2-step verification?',
  '2-step verification enforced?',
] //column headers

const UserResultsTable = () => {
  const tableRef = useRef(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [fileName, setFileName] = useState('')

  const [users, setUsers] = useState([])
  const userEmail = localStorage.getItem('email')

  // Fetch all users from the API
  useEffect(() => {
    fetchAllUsers(userEmail).then((data) => {
      setUsers(data)
    })
  }, [])

  // console.log('users:', users)

  // TODO(m.okamoto): Fetch users by filters

  return (
    <>
      <CustomTable ref={tableRef}>
        <CustomTableHeader>
          <CustomTableRow className="sm:text-nowrap">
            <CustomTableHead className={`${groupsStyles.tableHeaderText} px-0`}></CustomTableHead>
            <CustomTableHead className={`${groupsStyles.tableHeaderText} ps-4 md:pe-[100px]`}>
              <Checkbox className="mr-2" />
              {columnHeaders[0] /* Name */}
            </CustomTableHead>
            <CustomTableHead className={`md:pe-[100px]`}>{columnHeaders[1] /* Email address */}</CustomTableHead>
            <CustomTableHead className={`md:pe-[100px]`}>{columnHeaders[2] /* OU */}</CustomTableHead>
            <CustomTableHead className={`md:pe-[100px]`}>{columnHeaders[3] /* 2sv Enrolled */}</CustomTableHead>
            <CustomTableHead className={`md:pe-[100px]`}>
              <span>{columnHeaders[4] /* 2sv Enforced */}</span>
              {/* <span className="text-nowrap">{columnHeaders[3]}</span> */}
            </CustomTableHead>
            <CustomTableHead className="w-[25px] pe-2.5">
              <Dialog>
                <DropdownMenu open={isMenuOpen} onOpenChange={(open) => setIsMenuOpen(open)}>
                  <DropdownMenuTrigger asChild>
                    <Ellipsis
                      className={`cursor-pointer hover:stroke-primary active:stroke-primary focus:stroke-primary  ${
                        isMenuOpen ? 'stroke-primary' : ''
                      }`}
                      size={20}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" alignOffset={-194} avoidCollisions="true" hideWhenDetached="true">
                    <DialogTrigger asChild>
                      <dev>
                        <DropdownMenuItem
                          className="focus:bg-background hover:bg-background cursor-pointer"
                          onClick={() => {
                            setFileName(`${groupStrings.defaultExportFileName}`) // ${query}
                          }}
                        >
                          <div className={`flex items-center my-1 mx-0 py-2 px-1 bg-accent rounded-md`}>
                            <div className="flex items-center py-1 px-2 gap-3 text-s w-[188px] bg-accent">
                              <CustomIconExport />
                              <span>Manage data columns</span>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      </dev>
                    </DialogTrigger>
                    {<TurnOff2svViaCsvDialog />}
                    {<DeleteUsersViaCsvDialog />}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DialogPortal>
                  <DialogContent className="[&>button]:hidden p-8" aria-describedby={undefined}>
                    <DialogHeader>
                      <DialogTitle className="text-2xl/6 mb-6">Export Search Results</DialogTitle>
                      <div className="text-base/5 font-medium pb-4">Name your export</div>
                      <Input
                        className="text-foreground mb-7"
                        placeholder="Add a name"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                      />
                      <div className="text-base/5 font-medium pb-4">Choose a format</div>
                      <RadioGroup defaultValue="Export_name" className="border border-input rounded-md p-4 gap-y-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="option-one" id={groupElementIds.exportWindowOption1} disabled />
                          <Label htmlFor="option-one" className="text-muted-foreground">
                            Google Sheet (coming soon)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="option-two" id={groupElementIds.exportWindowOption2} checked />
                          <Label htmlFor="option-two">CSV</Label>
                        </div>
                      </RadioGroup>
                      <div className="flex flex-col items-center justify-center sm:flex-row sm:justify-end sm:gap-x-4 pt-8">
                        <DialogClose asChild>
                          <Button
                            id={groupElementIds.closeExportDialog}
                            type="button"
                            variant="outline"
                            className={`${groupsStyles.buttonPaddingWide} w-[108px]`}
                          >
                            Cancel
                          </Button>
                        </DialogClose>

                        <CsvDownloadButton
                          data={users}
                          headers={columnHeaders}
                          filename={fileName === '' ? `${groupStrings.defaultExportFileName}` : fileName} // ${query}
                          className="hidden"
                          id={groupElementIds.csvDownloadButton}
                        >
                          {/* Nesting buttons is not allowed in html, so I hid the csv button and added a fn onclick to the export button. */}
                          {/* Even with nesting it was working fine, but I didn't want the warning. */}
                        </CsvDownloadButton>
                        <Button
                          className={`${groupsStyles.buttonPaddingWide}`}
                          onClick={() => {
                            document.getElementById(groupElementIds.csvDownloadButton).click()
                            setTimeout(() => {
                              // Close the Dialog window component in a very ungraceful way("Cody" has no better ideas)
                              document.getElementById(groupElementIds.closeExportDialog).click()
                            }, 500)
                          }}
                        >
                          Export
                        </Button>
                      </div>
                    </DialogHeader>
                  </DialogContent>
                </DialogPortal>
              </Dialog>
            </CustomTableHead>
          </CustomTableRow>
        </CustomTableHeader>
        <CustomTableBody>
          <CustomTableRow className={`py-0`}></CustomTableRow>
          {users &&
            users.map((user) => (
              <CustomTableRow className={`border-none hover:bg-accent min-w-2xl`} key={user.primaryEmail}>
                <CustomTableCell className={`!w-[4px] !bg-background !hover:bg-background px-0 leading-none`}>
                  &nbsp;
                </CustomTableCell>
                <CustomTableCell className={`${groupsStyles.tableRowPadding} ps-4 font-normal rounded-l-md`}>
                  <Checkbox className="mr-2" />
                  {user.name.fullName}
                </CustomTableCell>
                <CustomTableCell className={`${groupsStyles.tableRowPadding}`}>{user.primaryEmail}</CustomTableCell>
                <CustomTableCell className={`${groupsStyles.tableRowPadding}`}>{user.orgUnitPath}</CustomTableCell>
                <CustomTableCell className={`${groupsStyles.tableRowPadding}`}>
                  {user.isEnrolledIn2Sv ? 'Yes' : 'No'}
                </CustomTableCell>
                <CustomTableCell className={`${groupsStyles.tableRowPadding}`}>
                  {user.isEnforcedIn2Sv ? 'Yes' : 'No'}
                </CustomTableCell>
                <CustomTableCell className={`${groupsStyles.tableRowPadding}`}></CustomTableCell>
                <CustomTableCell className={`${groupsStyles.tableRowPadding} sm:text-nowrap`}></CustomTableCell>
                <CustomTableCell className={`${groupsStyles.tableRowPadding} rounded-r-md`}> </CustomTableCell>
                <CustomTableCell className={`!w-[4px] !bg-background !hover:bg-background leading-none`}>
                  &nbsp;
                </CustomTableCell>
              </CustomTableRow>
            ))}
          {/* A dummy row at the end for the sake of the radius and padding */}
          <CustomTableRow className={`border-none rounded-b-md py-0`}>
            <CustomTableCell className={`text-[8px] py-0 leading-none bg-background`}>&nbsp;</CustomTableCell>
          </CustomTableRow>{' '}
        </CustomTableBody>
      </CustomTable>
    </>
  )
}

export default UserResultsTable
