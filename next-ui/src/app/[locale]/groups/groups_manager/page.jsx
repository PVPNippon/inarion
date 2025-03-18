'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/utils/apiClient'
import {
  ExternalLinkIcon,
  SearchIcon,
  Ellipsis,
  CircleAlert,
  ChevronDownIcon,
  UserRoundCog,
  UserRound,
  UsersRound,
  Building,
  Check,
} from 'lucide-react'
import { groupsStyles } from '@/app/ui/variables/group-variables'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import CsvDownloadButton from 'react-json-to-csv'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CustomIconUserArrow } from '@/app/ui/svg-icons/custom-icons'
import {
  CustomTable,
  CustomTableHeader,
  CustomTableBody,
  CustomTableRow,
  CustomTableCell,
  CustomTableHead,
} from '@/components/ui/custom-table'
import { Checkbox } from '@/components/ui/checkbox'
import { customTableHandler, classListHandler } from '@/utils/virtualDOMHackers'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function GroupsManager() {
  const [groupList, setGroupList] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emptyResult, setEmptyResult] = useState(false)
  const [query, setQuery] = useState('')
  const [hiddenClass, setHiddenClass] = useState('')
  const email = 'testadmin@pvp-test-domain2.com'

  useEffect(() => {
    const controller = new AbortController()

    function fetchGroupsTable() {
      if (query === '') return

      try {
        //reset states
        setIsLoading(true)
        setError('')
        setGroupList([])
        setEmptyResult(false)

        const groupsDummyData = [
          {
            name: 'group1',
            email: 'group1@pvp-test-domain2.com',
            members: 50,
            hasExternalMembers: true,
            restrictFromLeaving: true,
            emailAliases: ['group1@sub.pvp-test-domain2.com', 'group1@alias.pvp-test-domain2.com'],
            // settings: [
            settings: {
              access: [
                {
                  owners: {
                    canContact: true,
                    canViewConversations: true,
                    canPost: true,
                    canViewMembers: true,
                    canManageMembers: true,
                  },
                },
                {
                  managers: {
                    canContact: true,
                    canViewConversations: true,
                    canPost: true,
                    canViewMembers: true,
                    canManageMembers: true,
                  },
                },
                {
                  members: {
                    canContact: true,
                    canViewConversations: true,
                    canPost: true,
                    canViewMembers: true,
                    canManageMembers: false,
                  },
                },
                {
                  organization: {
                    canContact: true,
                    canViewConversations: true,
                    canPost: true,
                    canViewMembers: false,
                    canManageMembers: false,
                  },
                },
                {
                  external: {
                    canContact: true,
                    canViewConversations: true,
                    canPost: true,
                    canViewMembers: true,
                    canManageMembers: false,
                  },
                },
              ],

              whoCanJoin: 'anyone',
              allowExternalMembers: true,
              restrictFromLeaving: true,
            },
            //  ],
          },
          // {
          //   name: 'group2',
          //   email: 'group2@pvp-test-domain2.com',
          //   members: 100,
          //   hasExternalMembers: false,
          //   restrictFromLeaving: false,
          //   emailAliases: ['dev@pvp-test-domain2.com', 'group2@alias.pvp-test-domain2.com'],

          //   settings: [
          //     {
          //       access: [
          //         {
          //           owners: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: true,
          //           },
          //         },
          //         {
          //           managers: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: true,
          //           },
          //         },
          //         {
          //           members: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: false,
          //           },
          //         },
          //         {
          //           organization: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: false,
          //             canManageMembers: false,
          //           },
          //         },
          //         {
          //           external: {
          //             canContact: true,
          //             canViewConversations: false,
          //             canPost: false,
          //             canViewMembers: false,
          //             canManageMembers: false,
          //           },
          //         },
          //       ],
          //     },
          //     { whoCanJoin: 'organization' },
          //     { allowExternalMembers: false },
          //     { restrictFromLeaving: false },
          //   ],
          // },
          // {
          //   name: 'group3',
          //   email: 'group3@pvp-test-domain2.com',
          //   members: 10,
          //   hasExternalMembers: true,
          //   restrictFromLeaving: false,
          //   emailAliases: ['group3@alias.pvp-test-domain2.com'],
          //   settings: [
          //     {
          //       access: [
          //         {
          //           owners: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: true,
          //           },
          //         },
          //         {
          //           managers: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: true,
          //           },
          //         },
          //         {
          //           members: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: false,
          //           },
          //         },
          //         {
          //           organization: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: false,
          //             canManageMembers: false,
          //           },
          //         },
          //         {
          //           external: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: false,
          //           },
          //         },
          //       ],
          //     },
          //     { whoCanJoin: 'anyone' },
          //     { allowExternalMembers: true },
          //     { restrictFromLeaving: false },
          //   ],
          // },

          // {
          //   name: 'dummy group g-g-g-g-g',
          //   email: 'dummy-group-email-for-testing@pvp-test-domain2.com',
          //   members: 1,
          //   hasExternalMembers: false,
          //   restrictFromLeaving: false,
          //   emailAliases: ['dummy-alias@alias.pvp-test-domain2.com'],
          //   settings: [
          //     {
          //       access: [
          //         {
          //           owners: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: true,
          //           },
          //         },
          //         {
          //           managers: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: true,
          //           },
          //         },
          //         {
          //           members: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: false,
          //           },
          //         },
          //         {
          //           organization: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: false,
          //             canManageMembers: false,
          //           },
          //         },
          //         {
          //           external: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: false,
          //           },
          //         },
          //       ],
          //     },
          //     { whoCanJoin: 'anyone' },
          //     { allowExternalMembers: false },
          //     { restrictFromLeaving: false },
          //   ],
          // },
          // {
          //   name: 'dummy group g-g-g-g-g2',
          //   email: 'dummy-group-email-for-testing2@pvp-test-domain2.com',
          //   members: 888,
          //   hasExternalMembers: false,
          //   restrictFromLeaving: false,
          //   emailAliases: ['dummy-alias2@alias.pvp-test-domain2.com'],
          //   settings: [
          //     {
          //       access: [
          //         {
          //           owners: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: true,
          //           },
          //         },
          //         {
          //           managers: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: true,
          //           },
          //         },
          //         {
          //           members: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: false,
          //           },
          //         },
          //         {
          //           organization: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: false,
          //             canManageMembers: false,
          //           },
          //         },
          //         {
          //           external: {
          //             canContact: true,
          //             canViewConversations: true,
          //             canPost: true,
          //             canViewMembers: true,
          //             canManageMembers: false,
          //           },
          //         },
          //       ],
          //     },
          //     { whoCanJoin: 'anyone' },
          //     { allowExternalMembers: false },
          //     { restrictFromLeaving: false },
          //   ],
          // },
        ]

        console.log('groupsDummyData', groupsDummyData)
        setGroupList(groupsDummyData)
      } catch (error) {
        setError(error)
      } finally {
        setTimeout(() => {
          setIsLoading(false)
        }, 3000)
      }
    }
    fetchGroupsTable()

    // Abort the API call when the component unmounts
    return function () {
      controller.abort()
    }
  }, [query])
  return (
    <div style={{ height: emptyResult && `calc(100vh - 288px)` }} className="mx-8 mb-6">
      {/* apply custom height only when emptyResult is displayed(maybe it should also be set when there is an error screen in the future) */}
      <p className="mb-3.5 text-2xl font-medium leading-7">Groups Manager</p>
      <p className="text-lg text-muted-foreground mb-3 leading-5">List groups</p>

      <InputForm query={query} setQuery={setQuery} hiddenClass={hiddenClass} groupList={groupList} />
      {isLoading && <Loader />}
      {!isLoading && !error && query && (
        <TopPanel query={query} hiddenClass={hiddenClass} setHiddenClass={setHiddenClass} groupList={groupList} />
      )}
      {!isLoading && !error && groupList.length > 0 && <GroupsTable groupList={groupList} />}
      {error && <ErrorMessage message={error.message} />}
      {emptyResult && <EmptyResult />}
    </div>
  )
}

export default GroupsManager

function InputForm({ query, setQuery, hiddenClass, groupList }) {
  // Define the schema with Zod
  const FormSchema = z.object({
    query: z.string(),
  })

  // Initialize the form using react-hook-form and Zod resolver for validation
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      query: '',
    },
  })

  function onSubmit(data) {
    setQuery(data.query)
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={hiddenClass}>
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  className={`text-muted-foreground ${groupsStyles.searchBarWidth} `}
                  type="string"
                  name="query"
                  placeholder="Enter a group name or group email address"
                  hasIcon={true}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-x-4 my-6">
          <Button className={`${groupsStyles.buttonPadding}`} type="submit">
            Go
          </Button>
        </div>
      </form>
    </Form>
  )
}

/**
 * A simple loader component that displays a loading message.
 *
 * @returns {JSX.Element} The JSX element containing the loading message.
 */

function Loader() {
  return <p>Loading...</p>
}

/**
 * A component that displays an error message.
 *
 * @param {{ message: string }} props The props object.
 * @prop {string} message The error message to display.
 *
 * @returns {JSX.Element} The JSX element containing the error message.
 */
function ErrorMessage({ message }) {
  return <p>{message}</p>
}

function EmptyResult() {
  return (
    <div className={`${groupsStyles.roundBorder} w-full h-full mt-3 pb-7 flex flex-col items-center justify-center`}>
      <SearchIcon size={116} className="text-muted-foreground" />
      <p className="text-2xl font-medium leading-10">There are no matching results</p>
      <p className="text-xs leading-6">Try another search, or find items by changing your filters.</p>
    </div>
  )
}

function TopPanel({ query, hiddenClass, setHiddenClass }) {
  return (
    <div className={`flex items-center justify-between ${hiddenClass === 'hidden' ? '' : 'hidden'}`}>
      <div className={`py-3 px-4`}>
        <span className={`text-sm my-3 py-1 px-3 ${groupsStyles.roundBorder} ${groupsStyles.thinShadow}`}>
          Showing search result of <span className="font-semibold">{`'${query}'`}</span>
        </span>
      </div>
      <div className="flex flex-col lg:flex-row gap-x-4">
        <Button
          className={`${groupsStyles.buttonPadding}`}
          onClick={() => {
            if (hiddenClass === 'hidden') {
              setHiddenClass('')
            }
          }}
        >
          Refine search conditions
        </Button>
      </div>
    </div>
  )
}

function GroupsTable({ groupList }) {
  const tableRef = useRef(null)
  const customTableRowRefs = useRef([])

  useEffect(() => {
    if (tableRef.current) {
      customTableHandler({ tableRef, classesToRemove: 'h-[200px]' })

      customTableRowRefs.current.forEach((ref) => {
        ref.classList.remove('border-none')
      })
    }
  }, [customTableRowRefs])

  return (
    <CustomTable ref={tableRef}>
      <CustomTableHeader>
        <CustomTableRow>
          <CustomTableHead className={`px-0`}></CustomTableHead>
          <CustomTableHead className={` w-[1px] px-0`}></CustomTableHead>
          <CustomTableHead className="text-nowrap ">
            <Checkbox />
            <span className="ms-3">Name</span>
          </CustomTableHead>
          <CustomTableHead className="text-nowrap">Email address</CustomTableHead>
          <CustomTableHead className="text-nowrap">Members</CustomTableHead>
          <CustomTableHead className="text-nowrap">Has external members?</CustomTableHead>
          <CustomTableHead className="text-nowrap">Restrict members from leaving</CustomTableHead>
          <CustomTableHead className="text-nowrap">Alias address</CustomTableHead>
          <CustomTableHead className=" mx-0 px-0 w-[1px] leading-none"></CustomTableHead>
          <CustomTableHead className={`px-2`}></CustomTableHead>
        </CustomTableRow>
      </CustomTableHeader>
      <CustomTableBody>
        <CustomTableRow key={'empty-row'} className={`border-none py-0`}>
          <CustomTableCell className={`text-[8px] py-0 leading-none bg-background`}>&nbsp;</CustomTableCell>
        </CustomTableRow>
        {groupList.map((group, index) => (
          <React.Fragment key={`${group.email}-fragment-${index}`}>
            <CustomTableRow
              key={`${group.email}-row-${index}`} // Use a unique key for each row based on group.email}
              className="hover:bg-background"
              ref={(ref) => (customTableRowRefs.current[index] = ref)}
            >
              <CustomTableCell className={`!w-[4px] !bg-background !hover:bg-background px-0 leading-none`}>
                &nbsp;
              </CustomTableCell>
              <CustomTableCell className={`w-[4px] text-nowrap border border-r-0 border-input rounded-l-lg ps-0 flex`}>
                &nbsp;
              </CustomTableCell>
              <CustomTableCell className="text-nowrap border border-y border-input border-x-0">
                <Checkbox />
                <span className="ms-3"> {group.name}</span>
              </CustomTableCell>
              <CustomTableCell className="text-nowrap border-y border-input">{group.email}</CustomTableCell>
              <CustomTableCell className="text-nowrap border-y border-input ">{group.members}</CustomTableCell>
              <CustomTableCell className="text-nowrap border-y border-input">
                {group.hasExternalMembers === true ? 'Yes' : 'No'}
              </CustomTableCell>
              <CustomTableCell className="text-nowrap border-y border-input">
                {group.restrictFromLeaving === true ? 'Yes' : 'No'}
              </CustomTableCell>
              <CustomTableCell className="text-nowrap border-y border-input">{group.emailAliases[0]}</CustomTableCell>
              <CustomTableCell
                className={`!w-[8px] !bg-background !hover:bg-background  flex rounded-r-lg border border-l-0 border-input px-0 `}
              >
                &nbsp;
              </CustomTableCell>
              <CustomTableCell className={`!w-[4px] !bg-background !hover:bg-background px-0 leading-none`}>
                &nbsp;
              </CustomTableCell>
            </CustomTableRow>

            <CustomTableRow key={`${group.email}-separator-${index}`} className={`border-none rounded-b-md py-0 `}>
              <CustomTableCell className={`text-[8px] py-0 leading-none bg-background`}>&nbsp;</CustomTableCell>
            </CustomTableRow>
            <CustomTableRow key={`${group.email}-card-${index}`} className="hover:bg-background">
              <CustomTableCell className={`!w-[4px] !bg-background !hover:bg-background px-0 leading-none`}>
                &nbsp;
              </CustomTableCell>
              <CustomTableCell colSpan={8} className="hover:bg-background px-0">
                <GroupCard groupSettings={group.settings} />
              </CustomTableCell>
              <CustomTableCell className={`!w-[4px] !bg-background !hover:bg-background px-0 leading-none`}>
                &nbsp;
              </CustomTableCell>
            </CustomTableRow>
            <CustomTableRow key={'bottom-row'} className={`border-none py-0`}>
              <CustomTableCell className={`text-[8px] py-0 leading-none bg-background`}>&nbsp;</CustomTableCell>
            </CustomTableRow>
          </React.Fragment>
        ))}
      </CustomTableBody>
    </CustomTable>
  )
}

function GroupCard({ groupSettings }) {
  console.log('Group settings:', groupSettings.access)
  return (
    <Card className="rounded-lg w-full">
      <CardHeader>
        <CardTitle>Group Settings</CardTitle>
        <CardDescription>Review key settings applied to this group.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-rows-2 grid-cols-2 gap-x-[74px] gap-y-8">
          <GroupCardItem title="Access settings">
            <AccessSettingsGrid accessData={groupSettings.access} />
          </GroupCardItem>
          <GroupCardItem title="Who can join the group?">Content here</GroupCardItem>
          <GroupCardItem title="Allow external users to join?">Content here</GroupCardItem>
          <GroupCardItem title="Restrict members from leaving the group?">Content here</GroupCardItem>
        </div>
      </CardContent>
    </Card>
  )
}

function GroupCardItem({ title, children }) {
  return (
    <div className="flex flex-col gap-y-5 ">
      <div className="font-medium bg-sidebar-accent text-base/5 py-2 px-5 rounded">{title}</div>
      <div>{children}</div>
    </div>
  )
}

function AccessSettingsGrid({ accessData }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell>&nbsp;</TableCell> {/* empty cell for row headers */}
          <TableCell>
            <TableHeaderCell columnName={'Owners'}>
              <UserRoundCog />
            </TableHeaderCell>
          </TableCell>
          <TableCell>
            <TableHeaderCell columnName={'Managers'}>
              <UserRound />
            </TableHeaderCell>
          </TableCell>
          <TableCell>
            <TableHeaderCell columnName={'Members'}>
              <UsersRound />
            </TableHeaderCell>
          </TableCell>
          <TableCell>
            <TableHeaderCell columnName={'Entire Organization'}>
              <Building />
            </TableHeaderCell>
          </TableCell>
          <TableCell>
            <TableHeaderCell columnName={'External Users'}>
              <CustomIconUserArrow />
            </TableHeaderCell>
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className={`${groupsStyles.gridRow}`}>
          <TableCell>Who can contact group owners</TableCell>
          {accessData.map((item) => (
            <TableCell key={Object.keys(item)[0]}>
              {item[Object.keys(item)[0]].canContact ? <GrayCheck /> : null}
            </TableCell>
          ))}
        </TableRow>
        <TableRow className={`${groupsStyles.gridRow}`}>
          <TableCell>Who can view conversations</TableCell>
          {accessData.map((item) => (
            <TableCell key={Object.keys(item)[0]}>
              {item[Object.keys(item)[0]].canViewConversations ? <GrayCheck /> : null}
            </TableCell>
          ))}
        </TableRow>
        <TableRow className={`${groupsStyles.gridRow}`}>
          <TableCell>Who can post</TableCell>
          {accessData.map((item) => (
            <TableCell key={Object.keys(item)[0]}>
              {item[Object.keys(item)[0]].canPost ? <GrayCheck /> : null}
            </TableCell>
          ))}
        </TableRow>
        <TableRow className={`${groupsStyles.gridRow}`}>
          <TableCell>Who can view members</TableCell>
          {accessData.map((item) => (
            <TableCell key={Object.keys(item)[0]}>
              {item[Object.keys(item)[0]].canViewMembers ? <GrayCheck /> : null}
            </TableCell>
          ))}
        </TableRow>
        <TableRow className={`${groupsStyles.gridRow}`}>
          <TableCell>Who can manage members</TableCell>
          {accessData.map((item) => (
            <TableCell key={Object.keys(item)[0]}>
              {item[Object.keys(item)[0]].canManageMembers ? <GrayCheck /> : null}
            </TableCell>
          ))}
        </TableRow>
      </TableBody>
    </Table>
  )
}

const TableHeaderCell = ({ children, columnName }) => (
  <div className={groupsStyles.gridHeader}>
    <span className="flex items-center">
      {React.cloneElement(children, { size: 24, strokeWidth: 1.5, className: 'stroke-muted-foreground' })}
    </span>
    <span className={groupsStyles.gridColumnName}>{columnName}</span>
  </div>
)

function GrayCheck() {
  return (
    <div className="justify-items-center">
      <Check size={24} className="stroke-muted-foreground" strokeWidth={1} />
    </div>
  )
}
