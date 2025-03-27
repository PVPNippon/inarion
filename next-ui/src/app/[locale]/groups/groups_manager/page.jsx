'use client'
import React, { useState, useEffect, useRef, useReducer } from 'react'
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
  X,
  XCircle,
} from 'lucide-react'
import { groupsStyles, groupElementIds, groupStrings } from '@/app/ui/variables/group-variables'
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
import { CustomIconExport, CustomIconUserArrow } from '@/app/ui/svg-icons/custom-icons'
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CustomSelectTrigger } from '@/components/ui/custom-filter-select'
import { PopoverClose } from '@radix-ui/react-popover'
import { Switch } from '@/components/ui/switch'
import {
  CustomListAccordion,
  CustomListAccordionItem,
  CustomListAccordionTrigger,
  CustomListAccordionContent,
} from '@/components/ui/custom-list-accordion'

//constants
//Object with strings for the "Who can join" field of the groups's card. Used to get strings with title and description by the setting name.
const whoCanJoinStrings = {
  ANYONE_CAN_JOIN: {
    title: 'Anyone can join',
    description: 'Any internet user, both inside and outside your organization, can join the group.',
  },
  ALL_IN_DOMAIN_CAN_JOIN: {
    title: 'Anyone in the organization can join',
    description: 'Users in the organization can add themselves to the group directly.',
  },
  INVITED_CAN_JOIN: {
    title: 'Only invited users',
    description: 'Users can join the group only if they are invited.',
  },
  CAN_REQUEST_TO_JOIN: {
    title: 'Anyone in the organization can ask',
    description: 'Users in the organization need to ask first to join the group.',
  },
}
const filterTitles = {
  restrictFromLeaving: 'Restrict members from leaving?',
  numberOfMembers: 'Number of members',
  allowExternalMembers: 'Allow external members?',
  hasExternalMembers: 'Has external members?',
}

const simpleFilterOptions = {
  yes: 'Yes',
  no: 'No',
}

const initialState = {
  query: '',
  numberOfMembers: ['', ''],
  restrictFromLeaving: '',
  allowExternalMembers: '',
  hasExternalMembers: '',
}
const columnHeaders = [
  'Name',
  'Email address',
  'Members',
  'Has external members?',
  'Restrict members from leaving',
  'Alias address',
  'Who can contact group owners',
  'Who can view conversations',
  'Who can post',
  'Who can view members',
  'Who can manage members',
  'Who can join the group?',
  'Allow external users to join?',
]
const groupsDummyData = [
  {
    name: 'Group1',
    email: 'group1@pvp-test-domain2.com',
    members: 50,
    hasExternalMembers: true,

    emailAliases: ['group1@sub.pvp-test-domain2.com', 'group1@alias.pvp-test-domain2.com'],

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
            canViewMembers: true,
            canManageMembers: false,
          },
        },
        {
          external: {
            canContact: true,
            canViewConversations: true,
            canPost: true,
            canViewMembers: false,
            canManageMembers: false,
          },
        },
      ],

      whoCanJoin: 'CAN_REQUEST_TO_JOIN',
      allowExternalMembers: 'true', //google returns it as string, so changing to string for now
      whoCanLeaveGroup: 'ALL_MEMBERS_CAN_LEAVE',
    },
  },
  {
    name: 'Group2',
    email: 'group2@pvp-test-domain2.com',
    members: 10,
    hasExternalMembers: false,

    emailAliases: ['group2@sub.pvp-test-domain2.com', 'group2@test-a-google-blah@pvp-test-domain2.com'],

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
            canViewConversations: false,
            canPost: false,
            canViewMembers: false,
            canManageMembers: false,
          },
        },
        {
          external: {
            canContact: false,
            canViewConversations: false,
            canPost: false,
            canViewMembers: false,
            canManageMembers: false,
          },
        },
      ],

      whoCanJoin: 'INVITED_CAN_JOIN',
      allowExternalMembers: 'false', //google returns it as string, so changing to string for now
      whoCanLeaveGroup: 'NONE_CAN_LEAVE',
    },
  },
  {
    name: 'Public Group',
    email: 'group3@pvp-test-domain2.com',
    members: 1500,
    hasExternalMembers: true,

    emailAliases: ['product_discussions@pvp-test-domain2.com'],

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
            canViewMembers: true,
            canManageMembers: true,
          },
        },
        {
          external: {
            canContact: true,
            canViewConversations: true,
            canPost: true,
            canViewMembers: false,
            canManageMembers: false,
          },
        },
      ],

      whoCanJoin: 'ANYONE_CAN_JOIN',
      allowExternalMembers: 'true', //google returns it as string, so changing to string for now
      whoCanLeaveGroup: 'ALL_MEMBERS_CAN_LEAVE',
    },
  },
]

const csvDummyData = [
  {
    name: 'Group1',
    email: 'group1@pvp-test-domain2.com',
    members: 500,
    hasExternalMembers: false,
    whoCanLeaveGroup: 'ALL_MEMBERS_CAN_LEAVE',
    emailAliases: ['group1@sub.pvp-test-domain2.com', 'group1@test-a-google-blah@pvp-test-domain2.com'],
    whoCanContactOwner: 'ANYONE_CAN_CONTACT',
    whoCanViewGroup: 'ALL_IN_DOMAIN_CAN_VIEW',
    whoCanPostMessage: 'ALL_IN_DOMAIN_CAN_POST',
    whoCanViewMembership: 'ALL_IN_DOMAIN_CAN_VIEW',
    whoCanAdd: 'ALL_MANAGERS_CAN_ADD',
    whoCanJoin: 'CAN_REQUEST_TO_JOIN',
    allowExternalMembers: 'true', //google returns it as string, so changing to string for now
  },
  {
    name: 'Group2',
    email: 'group2@pvp-test-domain2.com',
    members: 10,
    hasExternalMembers: false,
    whoCanLeaveGroup: 'NONE_CAN_LEAVE',
    emailAliases: ['group2@sub.pvp-test-domain2.com', 'group2@test-a-google-blah@pvp-test-domain2.com'],
    whoCanContactOwner: 'ANYONE_CAN_CONTACT',
    whoCanViewGroup: 'ALL_IN_DOMAIN_CAN_VIEW',
    whoCanPostMessage: 'ALL_IN_DOMAIN_CAN_POST',
    whoCanViewMembership: 'ALL_IN_DOMAIN_CAN_VIEW',
    whoCanAdd: 'ALL_MANAGERS_CAN_ADD',
    whoCanContactOwner: 'ANYONE_CAN_CONTACT',
    whoCanJoin: 'INVITED_CAN_JOIN',
    allowExternalMembers: 'false', //google returns it as string, so changing to string for now
  },
]

function GroupsManager() {
  const [groupList, setGroupList] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emptyResult, setEmptyResult] = useState(false)
  const [hiddenClass, setHiddenClass] = useState('')
  const [includeAliases, setIncludeAliases] = useState(false)
  const [selectAll, setSelectAll] = useState(false)
  const [selectedRows, setSelectedRows] = useState({})
  const email = 'testadmin@pvp-test-domain2.com'

  const filterReducer = (state, action) => {
    switch (action.type) {
      case 'query':
        return { ...state, query: action.value }
      case 'numberOfMembers':
        return { ...state, numberOfMembers: action.value }
      case 'restrictFromLeaving':
        return { ...state, restrictFromLeaving: action.value }
      case 'allowExternalMembers':
        return { ...state, allowExternalMembers: action.value }
      case 'hasExternalMembers':
        return { ...state, hasExternalMembers: action.value }
      default:
        return state
    }
  }

  const [filterState, dispatchFilterState] = useReducer(filterReducer, initialState)

  function fetchGroupsTable() {
    if (JSON.stringify(filterState) === JSON.stringify(initialState)) return

    try {
      //reset states
      setIsLoading(true)
      setError('')
      setGroupList([])
      setEmptyResult(false)
      setHiddenClass('hidden')

      //imitate empty result
      if (filterState.query === 'empty') {
        setEmptyResult(true)
        return
      }

      //imitate error
      if (filterState.query === 'error') {
        setError('error')
        return
      }

      setGroupList(groupsDummyData)
    } catch (error) {
      setError(error)
    } finally {
      setTimeout(() => {
        setIsLoading(false)
      }, 1000)
    }
  }
  return (
    <div style={{ height: (emptyResult || error) && `calc(100vh - 288px)` }} className="mx-8 mb-6">
      {/* apply custom height only when emptyResult is displayed(maybe it should also be set when there is an error screen in the future) */}
      <div className="flex flex-col gap-y-3.5">
        <div className="text-2xl font-medium leading-7">Groups Manager</div>
        <div className="text-lg text-muted-foreground leading-5">
          {emptyResult || groupList.length > 0 ? 'Search results' : 'List groups'}
        </div>
      </div>
      <div className="my-3">
        <SearchAndFilterPanel
          hiddenClass={hiddenClass}
          includeAliases={includeAliases}
          setIncludeAliases={setIncludeAliases}
          filterState={filterState}
          dispatchFilterState={dispatchFilterState}
          fetchGroupsTable={fetchGroupsTable}
        />

        {!isLoading && hiddenClass === 'hidden' && (
          <FilterChipPanel
            hiddenClass={hiddenClass}
            setHiddenClass={setHiddenClass}
            groupList={groupList}
            filterState={filterState}
            setEmptyResult={setEmptyResult}
            setError={setError}
            setSelectAll={setSelectAll}
            setSelectedRows={setSelectedRows}
          />
        )}
      </div>

      {isLoading && <Loader />}
      {!isLoading && !error && groupList.length > 0 && (
        <GroupsTable
          groupList={groupList}
          selectAll={selectAll}
          setSelectAll={setSelectAll}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
        />
      )}
      {!isLoading && emptyResult && (
        <EmptyResultOrError
          type="search"
          title="There are no matching results."
          description="Try another search, or find items by changing your filters."
        />
      )}
      {!isLoading && error && (
        <EmptyResultOrError
          type="error"
          title="There was an error."
          description="Please wait a while and then try again."
        />
      )}
    </div>
  )
}

export default GroupsManager

function SearchAndFilterPanel({
  hiddenClass,
  includeAliases,
  setIncludeAliases,
  filterState,
  dispatchFilterState,
  fetchGroupsTable,
}) {
  const [disabled, setDisabled] = useState(true)
  useEffect(() => {
    if (JSON.stringify(filterState) === JSON.stringify(initialState)) {
      setDisabled(true)
    } else {
      setDisabled(false)
    }
  }, [filterState])
  return (
    <div className={`flex flex-col my-6 gap-y-7 ${hiddenClass}`}>
      <div className={`flex flex-col gap-y-5`}>
        <div className="flex flex-row justify-between gap-x-10 w-[875px]">
          <Input
            className={`text-muted-foreground ${groupsStyles.searchBarWidthVariantB} ${groupsStyles.roundBorder} py-3 h-[40px]`}
            type="string"
            name="query"
            placeholder={
              includeAliases
                ? 'Enter a group name, group email address or alias address'
                : 'Enter a group name or group email address'
            }
            hasIcon={true}
            value={filterState.query}
            onChange={(e) => dispatchFilterState({ type: 'query', value: e.target.value })}
          />

          <div className="flex gap-3 w-full items-center justify-end">
            <Label htmlFor="group-alias-switch">Include group aliases</Label>
            <Switch
              id="group-alias-switch"
              checked={includeAliases}
              onCheckedChange={() => setIncludeAliases(!includeAliases)}
            />
          </div>
        </div>

        <Filters filterState={filterState} dispatchFilterState={dispatchFilterState} />
      </div>
      <div>
        <Button
          className={`${groupsStyles.buttonPadding}`}
          type="button"
          disabled={disabled}
          onClick={fetchGroupsTable}
        >
          Go
        </Button>
      </div>
    </div>
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

function EmptyResultOrError({ type, title, description }) {
  return (
    <div className={`${groupsStyles.roundBorder} w-full h-full mt-3 pb-7 flex flex-col items-center justify-center`}>
      {type === 'search' && <SearchIcon size={116} className="text-muted-foreground" />}
      {type === 'error' && <XCircle size={116} strokeWidth={1.2} className="text-destructive" />}
      <p className="text-2xl font-medium leading-10">{title}</p>
      <p className="text-xs leading-6">{description}</p>
    </div>
  )
}

function FilterChipPanel({
  hiddenClass,
  setHiddenClass,
  filterState,
  setEmptyResult,
  setError,
  setSelectAll,
  setSelectedRows,
}) {
  return (
    <div className={`flex items-center justify-between py-3 px-4 ${hiddenClass === 'hidden' ? '' : 'hidden'}`}>
      {filterState !== initialState && (
        <div className="flex flex-wrap gap-2">
          {filterState.query && (
            <div className={groupsStyles.filterButtonOrChip}>
              Showing search result of <span className="font-semibold">{`'${filterState.query}'`}</span>
            </div>
          )}
          {filterState.numberOfMembers &&
            (filterState.numberOfMembers[0] !== '' || filterState.numberOfMembers[1] !== '') && (
              <div className={groupsStyles.filterButtonOrChip}>
                {`${filterTitles['numberOfMembers']}: ${
                  filterState.numberOfMembers[0] === '' ? '0' : filterState.numberOfMembers[0]
                } - ${filterState.numberOfMembers[1] === '' ? 'all' : filterState.numberOfMembers[1]}`}
              </div>
            )}
          {Object.entries(filterState).map(([filter, value]) => {
            if (filter !== 'query' && filter !== 'numberOfMembers' && value !== '') {
              return (
                <div key={filter} className={groupsStyles.filterButtonOrChip}>
                  {filterTitles[filter]}: {value}
                </div>
              )
            }
            return null
          })}
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-x-4">
        <Button
          className={`${groupsStyles.buttonPadding}`}
          onClick={() => {
            setEmptyResult(false)
            setError('')
            setSelectAll(false)
            setSelectedRows({})
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

function GroupsTable({ groupList, selectAll, setSelectAll, selectedRows, setSelectedRows }) {
  const tableRef = useRef(null)
  const customTableRowRefs = useRef([])
  const [expandedGroups, setExpandedGroups] = useState({})

  const handleCheckboxChange = (email, checked) => {
    setSelectedRows((prevSelectedRows) => {
      if (checked) {
        return { ...prevSelectedRows, [email]: true }
      } else {
        const newSelectedRows = { ...prevSelectedRows }
        delete newSelectedRows[email]
        return newSelectedRows
      }
    })
  }
  const handleSelectAllChange = (checked) => {
    setSelectAll(checked)
    if (checked) {
      const newSelectedRows = {}
      groupList.forEach((group) => {
        newSelectedRows[group.email] = true
      })
      setSelectedRows(newSelectedRows)
    } else {
      setSelectedRows({})
    }
  }

  useEffect(() => {
    if (tableRef.current) {
      customTableHandler({ tableRef, classesToRemove: 'h-[200px]' })
      classListHandler({
        componentRef: tableRef,

        classesToAdd: 'border-separate border-spacing-y-1',
      })

      customTableRowRefs.current.forEach((ref) => {
        ref.classList.remove('border-none')
      })
    }
  }, [customTableRowRefs])

  return (
    <CustomTable ref={tableRef}>
      {/* Table header */}
      <CustomTableHeader>
        <CustomTableRow>
          <CustomTableHead className={`px-0`}></CustomTableHead>
          <CustomTableHead className={`${groupsStyles.tableHead} ps-3.5`}>
            <Checkbox
              checked={selectAll}
              onCheckedChange={(checked) => {
                handleSelectAllChange(checked)
              }}
            />
            <span className="ms-3">Name</span>
          </CustomTableHead>
          <CustomTableHead className={groupsStyles.tableHead}>Email address</CustomTableHead>
          <CustomTableHead className={groupsStyles.tableHead}>Members</CustomTableHead>
          <CustomTableHead className={groupsStyles.tableHead}>Has external members?</CustomTableHead>
          <CustomTableHead className={groupsStyles.tableHead}>Restrict members from leaving</CustomTableHead>
          <CustomTableHead className={groupsStyles.tableHead}>Alias address</CustomTableHead>
          <CustomTableHead className="justify-items-end pe-0 me-0">
            <ExportDialog />
          </CustomTableHead>
          <CustomTableHead className={`px-2`}></CustomTableHead>
        </CustomTableRow>
      </CustomTableHeader>

      {/* Table body */}
      <CustomTableBody>
        {groupList.map((group, index) => (
          // first row
          <React.Fragment key={`${group.email}-fragment-${index}`}>
            <CustomTableRow
              key={`${group.email}-top-row-${index}`}
              className={`border-none py-0 hover:bg-background bg-background`}
            >
              <CustomTableCell className={groupsStyles.dummyCell} style={{ userSelect: 'none' }}>
                &nbsp;
              </CustomTableCell>
            </CustomTableRow>
            <CustomTableRow
              key={`${group.email}-row-${index}`} // Use a unique key for each row based on group.email}
              className={`hover:bg-accent  ${selectedRows[group.email] ? 'bg-accent' : 'bg-background'}`}
              ref={(ref) => (customTableRowRefs.current[index] = ref)}
            >
              <CustomTableCell
                className={`!w-[4px] hover:bg-background bg-background px-0 leading-none`}
                style={{ userSelect: 'none' }}
              >
                &nbsp;
              </CustomTableCell>
              <CustomTableCell
                className={`${groupsStyles.edgeCell} ${groupsStyles.tableRowPadding} ps-4 border-r-0 rounded-l-lg `}
              >
                <Checkbox
                  checked={selectedRows[group.email] || false}
                  onCheckedChange={(checked) => {
                    handleCheckboxChange(group.email, checked)
                  }}
                />
                <span className="ms-3"> {group.name}</span>
              </CustomTableCell>
              <CustomTableCell className={groupsStyles.middleCell}>{group.email}</CustomTableCell>
              <CustomTableCell className={groupsStyles.middleCell}>{group.members}</CustomTableCell>
              <CustomTableCell className={groupsStyles.middleCell}>
                {group.hasExternalMembers === true ? 'Yes' : 'No'}
              </CustomTableCell>
              <CustomTableCell className={groupsStyles.middleCell}>
                {/* Careful with the line below, because the column name says the opposite: "Restrict members from leaving." */}
                {/* So "All members can leave" means "No, don't restrict them from leaving." */}
                {/* NB: I count "ALL_MANAGERS_CAN_LEAVE" as "Yes" because common members cannot leave. */}
                {group.settings.whoCanLeaveGroup === 'ALL_MEMBERS_CAN_LEAVE' ? 'No' : 'Yes'}
              </CustomTableCell>
              <CustomTableCell className={groupsStyles.middleCell}>
                {group?.emailAliases.length > 0 && <AliasList aliasArray={group.emailAliases} groupId={group.email} />}
              </CustomTableCell>
              <CustomTableCell className={` ${groupsStyles.edgeCell} rounded-r-lg border-l-0  justify-items-end`}>
                <ChevronDownIcon
                  size={20}
                  className={`cursor-pointer transition-transform duration-400 ${
                    expandedGroups[group.email] ? 'rotate-180' : ''
                  }`}
                  onClick={() => setExpandedGroups((prev) => ({ ...prev, [group.email]: !prev[group.email] }))}
                />
              </CustomTableCell>
              <CustomTableCell
                className={`px-0 leading-none hover:bg-background bg-background`}
                style={{ userSelect: 'none' }}
              >
                &nbsp;
              </CustomTableCell>
            </CustomTableRow>

            {expandedGroups[group.email] && (
              // second row with card
              <React.Fragment>
                <CustomTableRow key={`${group.email}-card-${index}`} className="hover:bg-background pb-0">
                  <CustomTableCell className={`!w-[4px] px-0 py-0 leading-none`} style={{ userSelect: 'none' }}>
                    &nbsp;
                  </CustomTableCell>
                  <CustomTableCell colSpan={7} className="px-0 pt-1 pb-0">
                    <GroupCard groupSettings={group.settings} />
                  </CustomTableCell>
                  <CustomTableCell className={`hover:bg-background px-0 leading-none`} style={{ userSelect: 'none' }}>
                    &nbsp;
                  </CustomTableCell>
                </CustomTableRow>
              </React.Fragment>
            )}
          </React.Fragment>
        ))}
      </CustomTableBody>
    </CustomTable>
  )
}

function GroupCard({ groupSettings }) {
  return (
    <Card className="rounded-lg w-full">
      <CardHeader>
        <CardTitle>Group Settings</CardTitle>
        <CardDescription>Review key settings applied to this group.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid auto-rows-min grid-cols-2 gap-x-[74px] gap-y-8">
          <GroupCardItem title="Access settings">
            <AccessSettingsGrid accessData={groupSettings.access} />
          </GroupCardItem>
          <GroupCardItem title="Who can join the group?">
            <WhoCanJoinCardContents whoCanJoin={groupSettings.whoCanJoin} />
          </GroupCardItem>
          <GroupCardItem title="Allow external users to join?">
            <YesNoContentForGroupCard condition={groupSettings.allowExternalMembers === 'true'} />
          </GroupCardItem>
          <GroupCardItem title="Restrict members from leaving the group?">
            <YesNoContentForGroupCard condition={groupSettings.whoCanLeaveGroup !== 'ALL_MEMBERS_CAN_LEAVE'} />
          </GroupCardItem>
        </div>
      </CardContent>
    </Card>
  )
}

function GroupCardItem({ title, children }) {
  return (
    <div className={`flex flex-col gap-y-5`}>
      <div className="font-medium bg-sidebar-accent text-base/5 py-2 px-5 rounded">{title}</div>
      <div>{children}</div>
    </div>
  )
}

function AccessSettingsGrid({ accessData }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-background">
          <TableCell style={{ userSelect: 'none' }}>&nbsp;</TableCell>
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
      <Check size={24} className="stroke-muted-foreground" strokeWidth={1.5} />
    </div>
  )
}

function WhoCanJoinCardContents({ whoCanJoin }) {
  const whoCanJoinData = whoCanJoinStrings[whoCanJoin] //retrieve necessary strings by key
  return (
    <div className="flex flex-col gap-y-3">
      <div className="text-base/6">{whoCanJoinData.title}</div>
      <div className="text-xs/4">{whoCanJoinData.description}</div>
    </div>
  )
}

function YesNoContentForGroupCard({ condition }) {
  return (
    <div className="flex flex-row gap-x-3 items-center">
      {condition ? <Check size={16} color={groupsStyles.semanticLightModeSuccess} strokeWidth={2.5} /> : null}
      <div className="text-base/6">{condition ? 'Yes' : 'No'}</div>
    </div>
  )
}

function Filters({ filterState, dispatchFilterState }) {
  return (
    <div className="flex flex-row gap-x-3 ">
      <NumberOfMembersFilter filterState={filterState} dispatchFilterState={dispatchFilterState} />
      <SimpleFilter
        filter="restrictFromLeaving"
        filterState={filterState}
        dispatchFilterState={dispatchFilterState}
      ></SimpleFilter>
      <SimpleFilter
        filter="allowExternalMembers"
        filterState={filterState}
        dispatchFilterState={dispatchFilterState}
      ></SimpleFilter>
      <SimpleFilter
        filter="hasExternalMembers"
        filterState={filterState}
        dispatchFilterState={dispatchFilterState}
      ></SimpleFilter>
    </div>
  )
}

function SimpleFilter({ filter, filterState, dispatchFilterState }) {
  const [hiddenClass, setHiddenClass] = useState('hidden')
  const [open, setOpen] = useState(false)
  return (
    <Select
      open={open}
      value={filterState[filter]}
      onOpenChange={setOpen}
      onValueChange={(value) => {
        if (value !== '') {
          setHiddenClass('')
        }
        dispatchFilterState({ type: filter, value: value })
      }}
    >
      <CustomSelectTrigger
        className="w-auto"
        hiddenClass={hiddenClass}
        onOpenChange={setOpen}
        handleClose={() => {
          setOpen(false)
          dispatchFilterState({ type: filter, value: '' })
          setHiddenClass('hidden')
        }}
      >
        <SelectValue placeholder={filterTitles[filter]}>
          {filterState[filter] !== '' ? `${filterTitles[filter]}: ${filterState[filter]}` : filterTitles[filter]}
        </SelectValue>
      </CustomSelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={simpleFilterOptions.yes}>{simpleFilterOptions.yes}</SelectItem>
          <SelectItem value={simpleFilterOptions.no}>{simpleFilterOptions.no}</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function NumberOfMembersFilter({ filterState, dispatchFilterState }) {
  const filter = 'numberOfMembers'
  const [minValue, setMinValue] = useState(filterState[filter][0])
  const [maxValue, setMaxValue] = useState(filterState[filter][1])
  const [open, setOpen] = useState(false)

  function setTitle() {
    dispatchFilterState({ type: filter, value: [minValue, maxValue] })
  }
  const handleMinValueChange = (value) => {
    setMinValue(value.toString())
  }

  const handleMaxValueChange = (value) => {
    setMaxValue(value.toString())
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={groupsStyles.filterButtonOrChip}>
          <span>{`Number of members ${
            filterState[filter][0] !== '' || filterState[filter][1] !== '' ? ':' : ''
          }`}</span>
          {(filterState[filter][0] !== '' || filterState[filter][1] !== '') && (
            <>
              <span>
                {`${filterState[filter][0] === '' ? '0' : filterState[filter][0]}`} -
                {` ${filterState[filter][1] === '' ? 'all' : filterState[filter][1]}`}
              </span>
            </>
          )}{' '}
          <ChevronDownIcon className="h-4 w-4 opacity-50 ml-auto " />
          {(filterState[filter][0] !== '' || filterState[filter][1] !== '') && (
            <X
              size={16}
              className="opacity-50 "
              onClick={() => {
                setOpen(false)
                setMinValue('')
                setMaxValue('')
                dispatchFilterState({ type: filter, value: ['', ''] })
                setTimeout(() => {
                  const closeButton = document.getElementById('popover-close-button')
                  if (closeButton) closeButton.click()
                }, 100)
              }}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[188px]" onInteractOutside={setTitle}>
        <div className="flex gap-x-2 items-center justify-evenly">
          <PopoverClose asChild>
            <button id="popover-close-button" className="hidden">
              X
            </button>
          </PopoverClose>
          <Input
            type="number"
            min="0"
            step="1"
            className="w-[60px] text-center"
            placeholder="Min"
            value={minValue}
            onChange={(e) => {
              handleMinValueChange(e.target.value)
            }}
          ></Input>
          <div> - </div>
          <Input
            type="number"
            min="0"
            step="1"
            className="w-[60px] text-center"
            placeholder="Max"
            value={maxValue}
            onChange={(e) => handleMaxValueChange(e.target.value)}
          ></Input>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function AliasList({ aliasArray, groupId }) {
  const [isExpanded, setIsExpanded] = useState('')
  if (aliasArray.length === 1) {
    return <span>{aliasArray[0]}</span>
  }
  return (
    <CustomListAccordion type="single " collapsible value={isExpanded} onValueChange={setIsExpanded}>
      <CustomListAccordionItem value={groupId} className="text-sm">
        <CustomListAccordionContent>
          {aliasArray.map((alias) => (
            <div key={alias}>{alias}</div>
          ))}
        </CustomListAccordionContent>
        <CustomListAccordionTrigger>
          {isExpanded === groupId ? (
            <span className={`${groupsStyles.secondaryTextChart5}`}>Show less</span>
          ) : (
            <span>
              <span style={{ pointerEvents: 'none' }}>{aliasArray[0]}</span>
              <span className={`${groupsStyles.secondaryTextChart5}`}>{` + ${aliasArray.length - 1} more`}</span>
            </span>
          )}
        </CustomListAccordionTrigger>
      </CustomListAccordionItem>
    </CustomListAccordion>
  )
}

function ExportDialog() {
  const [fileName, setFileName] = useState('Search results')
  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Ellipsis
            className={`cursor-pointer hover:stroke-primary active:stroke-primary focus:stroke-primary 
            }`}
            size={20}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" alignOffset={-194} avoidCollisions="true" hideWhenDetached="true">
          <DialogTrigger asChild>
            <DropdownMenuItem className="focus:bg-background hover:bg-background cursor-pointer">
              <div className={`flex items-center my-1 mx-0 py-2 px-1 bg-accent rounded-md`}>
                <div className="flex items-center py-1 px-2 gap-3 text-s w-[188px] bg-accent">
                  <CustomIconExport />
                  <span>Export results</span>
                </div>
              </div>
            </DropdownMenuItem>
          </DialogTrigger>
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
            <RadioGroup
              defaultValue={groupElementIds.exportWindowOption2}
              className="border border-input rounded-md p-4 gap-y-4"
            >
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
                data={csvDummyData}
                headers={columnHeaders}
                filename={fileName}
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
  )
}
