'use client'
import React, { useState, useEffect, useRef, useReducer } from 'react'
import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
import { Input } from '@/components/ui/legacy-input'
//import { apiClient } from '@/utils/apiClient'
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
  List,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CustomSelectTrigger, CustomFilterWrapper, CustomFilterClose } from '@/components/ui/custom-filter'
import { Switch } from '@/components/ui/switch'
import {
  CustomListAccordion,
  CustomListAccordionItem,
  CustomListAccordionTrigger,
  CustomListAccordionContent,
} from '@/components/ui/custom-list-accordion'
import { groupsDummyData } from '@/dummy-data/dummyData.js'
import { CustomSpinnerComponentWithText } from '@/components/ui/custom-spinner'

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

const whoCanLeaveGroupStrings = {
  ALL_MEMBERS_CAN_LEAVE: { long: 'All members can leave', short: 'Everyone' },
  ALL_MANAGERS_CAN_LEAVE: { long: 'All managers can leave', short: 'Managers' },
  NONE_CAN_LEAVE: { long: 'None can leave', short: 'None' },
}

const filterTitles = {
  whoCanLeaveGroup: 'Who can leave group?',
  directMembersCount: 'Number of members',
  allowExternalMembers: 'Allow external members?',
  hasExternalMembers: 'Has external members?',
  adminCreated: 'Is admin created?',
}

const simpleFilterOptions = {
  yes: 'Yes',
  no: 'No',
}

const initialState = {
  query: '',
  directMembersCount: ['', ''],
  whoCanLeaveGroup: '',
  allowExternalMembers: '',
  hasExternalMembers: '',
  adminCreated: '',
}

const columnHeaders = [
  'Name',
  'Email address',
  'Members',
  'Has external members?',
  'Who can leave group?',
  'Alias address',
  'Who can contact group owners',
  'Who can view conversations',
  'Who can post',
  'Who can view members',
  'Who can manage members',
  'Who can join the group?',
  'Allow external users to join?',
  'Is admin created?',
]
const allColumnHeaders = [
  'Name',
  'Email',
  'Direct Members Count',
  'Description',
  'Admin Created',
  'Non-Editable Aliases',
  'Has External Members',
  'Who Can Join',
  'Who Can View Membership',
  'Who Can View Group',
  'Who Can Invite',
  'Who Can Add',
  'Allow External Members',
  'Who Can Post Message',
  'Allow Web Posting',
  'Primary Language',
  'Max Message Bytes',
  'Is Archived',
  'Archive Only',
  'Message Moderation Level',
  'Spam Moderation Level',
  'Reply To',
  'Include Custom Footer',
  'Custom Footer Text',
  'Send Message Deny Notification',
  'Default Message Deny Notification Text',
  'Show In Group Directory',
  'Allow Google Communication',
  'Members Can Post As The Group',
  'Message Display Font',
  'Include In Global Address List',
  'Who Can Leave Group',
  'Who Can Contact Owner',
  'Who Can Add References',
  'Who Can Assign Topics',
  'Who Can Unassign Topic',
  'Who Can Take Topics',
  'Who Can Mark Duplicate',
  'Who Can Mark No Response Needed',
  'Who Can Mark Favorite Reply On Any Topic',
  'Who Can Mark Favorite Reply On Own Topic',
  'Who Can Unmark Favorite Reply On Any Topic',
  'Who Can Enter Free Form Tags',
  'Who Can Modify Tags And Categories',
  'Favorite Replies On Top',
  'Who Can Approve Members',
  'Who Can Ban Users',
  'Who Can Modify Members',
  'Who Can Approve Messages',
  'Who Can Delete Any Post',
  'Who Can Delete Topics',
  'Who Can Lock Topics',
  'Who Can Move Topics In',
  'Who Can Move Topics Out',
  'Who Can Post Announcements',
  'Who Can Hide Abuse',
  'Who Can Make Topics Sticky',
  'Who Can Moderate Members',
  'Who Can Moderate Content',
  'Who Can Assist Content',
  'Custom Roles Enabled For Settings To Be Merged',
  'Enable Collaborative Inbox',
  'Who Can Discover Group',
  'Default Sender',
]

const exemptFromConversionArray = [
  'name',
  'email',
  'description',
  'directMembersCount',
  'customFooterText',
  'primaryLanguage',
]

function createNumberOfMembersTitle(min, max) {
  let title = filterTitles.directMembersCount
  if (min === '' && max === '') return title

  title = title + ': '

  if ((min === '' && max === '0') || (min === '0' && max === '0')) return title + '0'

  if (min === max) return title + min

  if (min === '') title = title + '0'

  return title + min + ' - ' + max
}

function convertSettingNameToWord(settingName) {
  if (settingName instanceof Array) return settingName.map((item) => item.trim()).join('\u2028')
  if (typeof settingName !== 'string') settingName = String(settingName)
  if (settingName === 'true' || settingName === 'false') return settingName === 'true' ? 'yes' : 'no'
  return settingName.split('_').join(' ').toLowerCase()
}

function filterGroupProperties(groups) {
  return groups.map((group) => ({
    name: group.name,
    email: group.email,
    directMembersCount: group.directMembersCount,
    hasExternalMembers: convertSettingNameToWord(group.hasExternalMembers) || group.hasExternalMembers,
    whoCanLeaveGroup: convertSettingNameToWord(group.whoCanLeaveGroup) || group.whoCanLeaveGroup,
    nonEditableAliases: convertSettingNameToWord(group.nonEditableAliases) || group.nonEditableAliases,
    whoCanContactOwner: convertSettingNameToWord(group.whoCanContactOwner) || group.whoCanContactOwner,
    whoCanViewGroup: convertSettingNameToWord(group.whoCanViewGroup) || group.whoCanViewGroup,
    whoCanPostMessage: convertSettingNameToWord(group.whoCanPostMessage) || group.whoCanPostMessage,
    whoCanViewMembership: convertSettingNameToWord(group.whoCanViewMembership) || group.whoCanViewMembership,
    whoCanModerateMembers: convertSettingNameToWord(group.whoCanModerateMembers) || group.whoCanModerateMembers,
    whoCanJoin: convertSettingNameToWord(group.whoCanJoin) || group.whoCanJoin,
    allowExternalMembers: convertSettingNameToWord(group.allowExternalMembers) || group.allowExternalMembers,
    adminCreated: convertSettingNameToWord(group.adminCreated) || group.adminCreated,
  }))
}

function detectAccess(setting, searchWords) {
  if (searchWords.some((word) => setting.includes(word))) {
    return true
  } else {
    return false
  }
}

//WARNING: google documentation is incomplete, not all possible values are mentioned! be careful!
//https://developers.google.com/workspace/admin/groups-settings/v1/reference/groups#json
//For example, whoCanContactOwner also has "ALL_OWNERS_CAN_CONTACT", which is not mentioned in the documentation
function expandGroupSettings(settings) {
  const access = []

  // Owners
  //Note: most options cannot be disabled in AC and groups UI.
  //However, if groups UI itself is turned off(i.e., groups only operate via email posting, then I wonder if there is another option like NONE_CAN etc),
  //Since google documentation doesn't provide all the options, it's possible.
  //Needs more testing, so for now I will leave checking for keywords for all options here.
  access.push({
    owners: {
      whoCanContactOwner: detectAccess(settings.whoCanContactOwner, ['ALL', 'ANYONE', 'OWNERS']),
      whoCanViewGroup: detectAccess(settings.whoCanViewGroup, ['ALL', 'ANYONE', 'OWNERS']),
      whoCanPostMessage: !detectAccess(settings.whoCanPostMessage, ['NONE']),
      whoCanViewMembership: detectAccess(settings.whoCanViewMembership, ['ALL', 'ANYONE', 'OWNERS']),
      whoCanModerateMembers: !detectAccess(settings.whoCanModerateMembers, ['NONE']),
    },
  })

  // Managers
  access.push({
    managers: {
      whoCanContactOwner: !detectAccess(settings.whoCanContactOwner, ['NONE', 'OWNERS']),
      whoCanViewGroup: !detectAccess(settings.whoCanViewGroup, ['NONE', 'OWNERS']),
      whoCanPostMessage: !detectAccess(settings.whoCanPostMessage, ['NONE', 'OWNERS']),
      whoCanViewMembership: !detectAccess(settings.whoCanViewMembership, ['NONE', 'OWNERS']),
      whoCanModerateMembers: detectAccess(settings.whoCanModerateMembers, ['ALL', 'MANAGERS']),
    },
  })

  // Members
  access.push({
    members: {
      whoCanContactOwner: detectAccess(settings.whoCanContactOwner, ['ANYONE', 'ALL_IN_DOMAIN', 'MEMBERS']),
      whoCanViewGroup: detectAccess(settings.whoCanViewGroup, ['ANYONE', 'ALL_IN_DOMAIN', 'MEMBERS']),
      whoCanPostMessage: detectAccess(settings.whoCanPostMessage, ['ANYONE', 'ALL_IN_DOMAIN', 'MEMBERS']),
      whoCanViewMembership: detectAccess(settings.whoCanViewMembership, ['ANYONE', 'ALL_IN_DOMAIN', 'MEMBERS']),
      whoCanModerateMembers: detectAccess(settings.whoCanModerateMembers, ['MEMBERS']),
    },
  })

  // Organization
  access.push({
    organization: {
      whoCanContactOwner: detectAccess(settings.whoCanContactOwner, ['ANYONE', 'ALL_IN_DOMAIN']),
      whoCanViewGroup: detectAccess(settings.whoCanViewGroup, ['ANYONE', 'ALL_IN_DOMAIN']),
      whoCanPostMessage: detectAccess(settings.whoCanPostMessage, ['ANYONE', 'ALL_IN_DOMAIN']),
      whoCanViewMembership: detectAccess(settings.whoCanViewMembership, ['ALL_IN_DOMAIN']),
      whoCanModerateMembers: false, //disabled
    },
  })

  // External
  access.push({
    external: {
      whoCanContactOwner: detectAccess(settings.whoCanContactOwner, ['ANYONE']),
      whoCanViewGroup: detectAccess(settings.whoCanViewGroup, ['ANYONE']),
      whoCanPostMessage: detectAccess(settings.whoCanPostMessage, ['ANYONE']),
      whoCanViewMembership: false,
      whoCanModerateMembers: false,
    },
  })

  return access
}

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
      case 'directMembersCount':
        return { ...state, directMembersCount: action.value }
      case 'whoCanLeaveGroup':
        return { ...state, whoCanLeaveGroup: action.value }
      case 'allowExternalMembers':
        return { ...state, allowExternalMembers: action.value }
      case 'hasExternalMembers':
        return { ...state, hasExternalMembers: action.value }
      case 'adminCreated':
        return { ...state, adminCreated: action.value }
      case 'reset':
        return initialState
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
      console.error(error)
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
            setGroupList={setGroupList}
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
          filterState={filterState}
          includeAliases={includeAliases}
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
  return <CustomSpinnerComponentWithText text="Loading..." />
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
  setGroupList,
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
          {filterState.directMembersCount &&
            (filterState.directMembersCount[0] !== '' || filterState.directMembersCount[1] !== '') && (
              <div className={groupsStyles.filterButtonOrChip}>
                {createNumberOfMembersTitle(filterState.directMembersCount[0], filterState.directMembersCount[1])}
              </div>
            )}
          {Object.entries(filterState).map(([filter, value]) => {
            if (filter !== 'query' && filter !== 'directMembersCount' && value !== '') {
              return (
                <div key={filter} className={groupsStyles.filterButtonOrChip}>
                  {filterTitles[filter]}: {filter === 'whoCanLeaveGroup' ? whoCanLeaveGroupStrings[value].short : value}
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
            setGroupList([])
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

function GroupsTable({
  groupList,
  selectAll,
  setSelectAll,
  selectedRows,
  setSelectedRows,
  filterState,
  includeAliases,
}) {
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

  useEffect(() => {
    if (Object.keys(selectedRows).length === groupList.length) {
      setSelectAll(true)
    } else if (Object.keys(selectedRows).length === 0) {
      setSelectAll(false)
    } else {
      setSelectAll(Object.keys(selectedRows).length > 0)
    }
  }, [selectedRows, groupList])

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
    <>
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
            <CustomTableHead className={groupsStyles.tableHead}>Who can leave group?</CustomTableHead>
            <CustomTableHead className={groupsStyles.tableHead}>Is admin created?</CustomTableHead>
            <CustomTableHead className={groupsStyles.tableHead}>Alias address</CustomTableHead>
            <CustomTableHead className="justify-items-end pe-0 me-0">
              <ExportDialog groupList={groupList} />
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
                <CustomTableCell className={groupsStyles.middleCell}>{group.directMembersCount}</CustomTableCell>
                <CustomTableCell className={groupsStyles.middleCell}>
                  {group.hasExternalMembers === true ? 'Yes' : 'No'}
                </CustomTableCell>
                <CustomTableCell className={groupsStyles.middleCell}>
                  {whoCanLeaveGroupStrings[group.whoCanLeaveGroup].short}
                </CustomTableCell>
                <CustomTableCell className={groupsStyles.middleCell}>
                  {group.adminCreated === true ? 'Yes' : 'No'}
                </CustomTableCell>
                <CustomTableCell className={groupsStyles.middleCell}>
                  {group?.nonEditableAliases.length > 0 && (
                    <AliasList aliasArray={group.nonEditableAliases} groupId={group.email} />
                  )}
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
                    <CustomTableCell colSpan={8} className="px-0 pt-1 pb-0">
                      <GroupCard group={group} />
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
      <BulkOperationMenu
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        groupList={groupList}
        filterState={filterState}
        includeAliases={includeAliases}
      />
    </>
  )
}

function GroupCard({ group }) {
  return (
    <Card className="rounded-lg w-full">
      <CardHeader>
        <CardTitle>Group Settings</CardTitle>
        <CardDescription>Review key settings applied to this group.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid auto-rows-min grid-cols-2 gap-x-[74px] gap-y-8">
          <GroupCardItem title="Access settings">
            <AccessSettingsGrid group={group} />
          </GroupCardItem>
          <GroupCardItem title="Who can join the group?">
            <WhoCanJoinCardContents whoCanJoin={group.whoCanJoin} />
          </GroupCardItem>
          <GroupCardItem title="Allow external users to join?">
            <YesNoContentForGroupCard condition={group.allowExternalMembers === 'true'} />
          </GroupCardItem>
          <GroupCardItem title="Who can leave the group?">
            <div className="text-base/6">{whoCanLeaveGroupStrings[group.whoCanLeaveGroup].long}</div>
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

function AccessSettingsGrid({ group }) {
  const accessData = expandGroupSettings(group)
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
              {item[Object.keys(item)[0]].whoCanContactOwner ? <GrayCheck /> : null}
            </TableCell>
          ))}
        </TableRow>
        <TableRow className={`${groupsStyles.gridRow}`}>
          <TableCell>Who can view conversations</TableCell>
          {accessData.map((item) => (
            <TableCell key={Object.keys(item)[0]}>
              {item[Object.keys(item)[0]].whoCanViewGroup ? <GrayCheck /> : null}
            </TableCell>
          ))}
        </TableRow>
        <TableRow className={`${groupsStyles.gridRow}`}>
          <TableCell>Who can post</TableCell>
          {accessData.map((item) => (
            <TableCell key={Object.keys(item)[0]}>
              {item[Object.keys(item)[0]].whoCanPostMessage ? <GrayCheck /> : null}
            </TableCell>
          ))}
        </TableRow>
        <TableRow className={`${groupsStyles.gridRow}`}>
          <TableCell>Who can view members</TableCell>
          {accessData.map((item) => (
            <TableCell key={Object.keys(item)[0]}>
              {item[Object.keys(item)[0]].whoCanViewMembership ? <GrayCheck /> : null}
            </TableCell>
          ))}
        </TableRow>
        <TableRow className={`${groupsStyles.gridRow}`}>
          <TableCell>Who can manage members</TableCell>
          {accessData.map((item) => (
            <TableCell key={Object.keys(item)[0]}>
              {item[Object.keys(item)[0]].whoCanModerateMembers ? <GrayCheck /> : null}
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
      <NumberOfMembersFilter
        filter="directMembersCount"
        filterState={filterState}
        dispatchFilterState={dispatchFilterState}
      />
      <WhoCanLeaveGroupFilter
        filter="whoCanLeaveGroup"
        filterState={filterState}
        dispatchFilterState={dispatchFilterState}
      />
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
      <SimpleFilter
        filter="adminCreated"
        filterState={filterState}
        dispatchFilterState={dispatchFilterState}
      ></SimpleFilter>
    </div>
  )
}

function SimpleFilter({ filter, filterState, dispatchFilterState }) {
  const [hiddenClass, setHiddenClass] = useState('hidden')
  return (
    <Select
      value={filterState[filter]}
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
        handleClose={() => {
          dispatchFilterState({ type: filter, value: '' })
          setHiddenClass('hidden')
        }}
      >
        <SelectValue placeholder={filterTitles[filter]}>
          {filterState[filter] !== '' ? `${filterTitles[filter]}: ${filterState[filter]}` : filterTitles[filter]}
        </SelectValue>
      </CustomSelectTrigger>
      <SelectContent sideOffset={4} align="start" alignOffset={-11}>
        <SelectGroup>
          <SelectItem value={simpleFilterOptions.yes}>{simpleFilterOptions.yes}</SelectItem>
          <SelectItem value={simpleFilterOptions.no}>{simpleFilterOptions.no}</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function WhoCanLeaveGroupFilter({ filter, filterState, dispatchFilterState }) {
  const [hiddenClass, setHiddenClass] = useState('hidden')
  return (
    <Select
      value={filterState[filter]}
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
        handleClose={() => {
          dispatchFilterState({ type: filter, value: '' })
          setHiddenClass('hidden')
        }}
      >
        <SelectValue placeholder={filterTitles[filter]}>
          {filterState[filter] !== ''
            ? `${filterTitles[filter]}: ${whoCanLeaveGroupStrings[filterState[filter]].short}`
            : filterTitles[filter]}
        </SelectValue>
      </CustomSelectTrigger>
      <SelectContent sideOffset={4} align="start" alignOffset={-11}>
        <SelectGroup>
          {Object.keys(whoCanLeaveGroupStrings).map((key) => (
            <SelectItem key={key} value={key}>
              {whoCanLeaveGroupStrings[key].short}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function NumberOfMembersFilter({ filter, filterState, dispatchFilterState }) {
  const [minValue, setMinValue] = useState(filterState[filter][0])
  const [maxValue, setMaxValue] = useState(filterState[filter][1])
  const [hiddenClass, setHiddenClass] = useState('hidden')

  function resetValues() {
    setMinValue('')
    setMaxValue('')
    dispatchFilterState({ type: filter, value: ['', ''] })
    setHiddenClass('hidden')
  }

  function setTitle() {
    if (!minValue && !maxValue) {
      resetValues()
      return
    }

    // Check if the min value is greater than the max value
    // If so, swap the values
    if (maxValue !== '' && Number(minValue) > Number(maxValue)) {
      const oldMaxValue = maxValue
      const oldMinValue = minValue
      setMaxValue(oldMinValue)
      setMinValue(oldMaxValue)
      dispatchFilterState({ type: filter, value: [oldMaxValue, oldMinValue] })
    } else {
      dispatchFilterState({ type: filter, value: [minValue, maxValue] })
    }
    setHiddenClass('')
  }
  const handleMinValueChange = (value) => {
    setMinValue(value.toString())
  }

  const handleMaxValueChange = (value) => {
    setMaxValue(value.toString())
  }
  return (
    <Popover>
      <CustomFilterWrapper>
        <PopoverTrigger asChild>
          <button className="flex flex-row items-center gap-x-2">
            <span>{createNumberOfMembersTitle(filterState[filter][0], filterState[filter][1])}</span>
            <ChevronDownIcon className="h-4 w-4 opacity-50 ml-auto " />
          </button>
        </PopoverTrigger>
        <CustomFilterClose
          hiddenClass={hiddenClass}
          handleClose={() => {
            resetValues()
          }}
        />
      </CustomFilterWrapper>
      <PopoverContent
        className="max-w-[178px]"
        onInteractOutside={setTitle}
        sideOffset={8}
        align="start"
        alignOffset={-12}
      >
        <div className="flex gap-x-2 items-center justify-evenly">
          <Input
            type="number"
            min="0"
            step="1"
            className="w-[60px] text-center"
            placeholder="Min"
            value={minValue}
            onKeyDown={(e) => {
              // Prevent entering "e", "+", "-", "." characters
              if (['e', '+', '-', '.'].includes(e.key)) {
                e.preventDefault()
              }
            }}
            onChange={(e) => {
              // Ensure we only have integers by removing any decimals
              const value = e.target.value !== '' ? Math.floor(Number(e.target.value)) : ''
              handleMinValueChange(value)
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
            onKeyDown={(e) => {
              // Prevent entering "e", "+", "-", "." characters
              if (['e', '+', '-', '.'].includes(e.key)) {
                e.preventDefault()
              }
            }}
            onChange={(e) => {
              // Ensure we only have integers by removing any decimals
              const value = e.target.value !== '' ? Math.floor(Number(e.target.value)) : ''
              handleMaxValueChange(value)
            }}
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

function ExportDialog({ groupList }) {
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
                data={filterGroupProperties(groupList)}
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

function BulkOperationMenu({ selectedRows, setSelectedRows, groupList, filterState, includeAliases }) {
  const selectedGroups = Object.keys(selectedRows)
  const [hidden, setHidden] = useState(selectedGroups.length === 0)
  const [data, setData] = useState([])
  const [separateCSVData, setSeparateCSVData] = useState([])
  const [ready, setReady] = useState(false)

  function createDetailedCSVData(groupList, selectedGroups) {
    const filteredGroupList = groupList.filter((group) => selectedGroups.includes(group.email))
    return filteredGroupList.map((group) => {
      const convertedGroup = { ...group }
      Object.keys(group).forEach((key) => {
        if (!exemptFromConversionArray.includes(key)) convertedGroup[key] = convertSettingNameToWord(group[key])
      })
      return convertedGroup
    })
  }

  function createSeparateCSVData(csvData) {
    const groupsArray = []
    csvData.forEach((group) => {
      const groupArray = []
      Object.keys(group).forEach((key, index) => {
        groupArray.push({
          settingName: allColumnHeaders[index],
          settingValue: exemptFromConversionArray.includes(key) ? group[key] : convertSettingNameToWord(group[key]),
        })
      })
      groupsArray.push(groupArray)
    })
    return groupsArray
  }

  function downloadGroupList() {
    let filterText = ''

    if (filterState.query !== '') {
      filterText += `Query: ${filterState.query}\n`
      if (includeAliases === true) {
        filterText += 'Include aliases: yes\n'
      } else {
        filterText += 'Include aliases: no\n'
      }
    }

    if (filterState.directMembersCount[0] !== '' || filterState.directMembersCount[1] !== '') {
      filterText += `${createNumberOfMembersTitle(
        filterState.directMembersCount[0],
        filterState.directMembersCount[1]
      )}\n`
    }

    filterText += Object.keys(filterState).reduce((acc, filter) => {
      if (filterState[filter] !== '' && filter !== 'directMembersCount' && filter !== 'query') {
        acc += `${filterTitles[filter]}: ${filterState[filter]}\n`
      }
      return acc
    }, '')

    const groupListHeader = `${
      groupList.length > selectedGroups.length ? selectedGroups.length + ' selected' : groupList.length
    } groups matched the search condition`

    const groupListText = selectedGroups.join('\n')

    const textContent = `Applied Filters:\n${filterText}\n\n${groupListHeader}:\n${groupListText}`

    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'group_list.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (selectedGroups.length === 0) {
      setData([])
      setSeparateCSVData([])
      setHidden(true)
    } else {
      setHidden(false)
    }
  }, [selectedRows])

  useEffect(() => {
    if (!ready || data.length === 0) return

    // Download the CSV as one file with all selected groups' details
    const allResultsLink = document.getElementById('csv-download-details-search-results')
    allResultsLink.click()

    // Download the CSV for each group separately
    selectedGroups.forEach((group) => {
      const perGroupLink = document.getElementById('csv-download-details-' + group)
      perGroupLink.click()
    })
    setReady(false)
  }, [ready])

  const handleClose = () => {
    setSelectedRows({})
    setData([])
    setSeparateCSVData([])
    setHidden(true)
  }

  return (
    <div className={`${hidden ? 'hidden' : 'block'} w-content justify-self-center relative translate-y-[-70px]`}>
      <div className={`h-[44px] bg-background inline-flex border border-foreground/10 items-center rounded-lg p-1`}>
        {/* Groups checkbox */}
        <div
          className={`pointer-events-none ${groupsStyles.bulkOperationMenuOptionAll} ${groupsStyles.bulkOperationMenuOptionWithBorder}`}
        >
          <Checkbox asChild checked={selectedGroups.length > 0} />
          <span> {`${selectedGroups.length} Groups`}</span>
        </div>
        {/* CSV download button to download all details in one file */}
        <CsvDownloadButton
          id={'csv-download-details-search-results'}
          data={data}
          headers={allColumnHeaders}
          filename={'all_group_details_for_search_results'}
          className={'csv-download-details hidden'}
        ></CsvDownloadButton>
        <div>
          <ul>
            {separateCSVData.length > 0 &&
              separateCSVData.map((file, index) => {
                return (
                  // CSV download button to download each selected group details separately
                  <CsvDownloadButton
                    id={'csv-download-details-' + file[1].settingValue}
                    key={'csv-download-details' + index.toString()}
                    data={file}
                    headers={['Setting Name', 'Setting Value']}
                    filename={'group_details_for_' + file[1].settingValue}
                    className={'csv-download-details hidden'}
                  ></CsvDownloadButton>
                )
              })}
          </ul>
        </div>
        {/* Bulk export button */}
        <button
          onClick={() => {
            const csvData = createDetailedCSVData(groupList, selectedGroups)
            setData(csvData)
            setSeparateCSVData(createSeparateCSVData(csvData))
            setReady(true)
          }}
          className={`${groupsStyles.bulkOperationMenuOptionAll} ${groupsStyles.bulkOperationMenuOptionWithBorder}`}
        >
          <CustomIconExport size={20} /> Bulk export group details
        </button>
        {/* Export group list button */}
        <button
          onClick={downloadGroupList}
          className={`${groupsStyles.bulkOperationMenuOptionAll} ${groupsStyles.bulkOperationMenuOptionWithBorder}`}
        >
          <List size={20} strokeWidth={1.8} />
          Export group list
        </button>
        {/* Close button */}
        <button onClick={handleClose} className={`${groupsStyles.bulkOperationMenuOptionAll}`}>
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
