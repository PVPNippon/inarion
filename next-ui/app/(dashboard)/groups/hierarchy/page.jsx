'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiClient } from '@/utils/apiClient'
import { ExternalLinkIcon, SearchIcon, EyeIcon, Ellipsis, CircleAlert } from 'lucide-react'
import { groupsStyles } from '../groups-styles'
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
import { CustomIconExport } from '../../../ui/svg-icons/custom-icons'
const columnHeaders = ['Group name', 'Membership type', 'Inherited via', 'Join timestamp']

/**
 * A component that displays a table with nested group membership details.
 * It fetches the nested membership of a given group or user when the component mounts.
 * It also handles updating the query state and fetching the nested membership when the user submits a new query.
 * It displays a loading indicator while the API call is in progress.
 * It displays an error message if there is an error with the API call.
 * It displays an empty result message if the API call returns an empty table.
 * It displays a button to analyze another group or user.
 * It displays a dropdown menu with options to export the table data to a CSV file.
 */
function NestedGroupsLister() {
  const [groupList, setGroupList] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emptyResult, setEmptyResult] = useState(false)
  const [query, setQuery] = useState('')
  const [hiddenClass, setHiddenClass] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [fileName, setFileName] = useState('')
  let email

  useEffect(() => {
    const controller = new AbortController()
    /**
     * Fetches the nested membership of a given group or user.
     * Sets the `groupList` state to the response data if it is not empty, otherwise sets the `emptyResult` state to true.
     * Sets the `error` state if there is an error with the API call.
     * Sets the `isLoading` state to false when the API call is finished.
     */
    async function fetchMembership() {
      if (query === '') return

      try {
        //reset states
        setIsLoading(true)
        setError('')
        setGroupList([])
        setEmptyResult(false)

        //getting email and token from local storage is a temporary measure, so I'm not refactoring or improving this part
        email = window.localStorage.getItem('email')
        console.log('email:', email)

        //N.B.the token validity is 1 hour, when started getting the 401 error, sign out and sign in back
        const token = localStorage.getItem('jwtToken')
        console.log('TOKEN', token)

        // const response = await apiClient(
        //   '/api/groups/get-nested-membership', // Endpoint path relative to API_BASE_URL
        //   'POST', // HTTP method
        //   {
        //     userEmail: email,
        //     queryEmail: query,
        //   },
        //   {}, // Additional headers, if any
        //   true // withCredentials flag
        // )

        //while FE is broken, falling back to the good old fetch(beware of cache though)
        const response = await fetch(
          `http://localhost:4000/api/groups/target/${query}/nested-membership?userEmail=${email}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            method: 'GET',
            cache: 'no-store', //this disables cache
          }
        )

        // if emtpy table is returned, set error 'No memberships found', otherwise set groupList
        if (response) {
          //  const responseData = JSON.parse(response)
          const responseData = await response.json()
          responseData.length === 0 ? setEmptyResult(true) : setGroupList(responseData)
          setHiddenClass('hidden')
        }
      } catch (error) {
        setError(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMembership()

    // Abort the API call when the component unmounts
    return function () {
      controller.abort()
    }
  }, [query])
  return (
    <div style={{ height: emptyResult && `calc(100vh - 288px)` }} className="mx-8 mb-6">
      {' '}
      {/* apply custom height only when emptyResult is displayed(maybe it should also be set when there is an error screen in the future) */}
      <p className="mb-3.5 text-2xl font-medium leading-7">Nested Group Membership</p>
      <p className="text-lg text-muted-foreground mb-3 leading-5">View the ancestry of a group or user</p>
      <div className={`flex text-xs gap-x-1 ${groupsStyles.secondaryTextChart5} mb-3`}>
        <span>Learn how it works</span>
        {/* TODO(maria): replace the link below with the actual link when it's ready*/}
        <a href="http://localhost:3000/groups" target="_blank">
          <ExternalLinkIcon size={14} />
        </a>
      </div>
      <InputForm query={query} setQuery={setQuery} hiddenClass={hiddenClass} groupList={groupList} />
      {isLoading && <Loader />}
      {!isLoading && !error && query && (
        <TopPanel query={query} hiddenClass={hiddenClass} setHiddenClass={setHiddenClass} groupList={groupList} />
      )}
      {!isLoading && !error && groupList.length > 0 && (
        <NestedGroupsTable
          groups={groupList}
          query={query}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          fileName={fileName}
          setFileName={setFileName}
        />
      )}
      {error && <ErrorMessage message={error.message} />}
      {emptyResult && <EmptyResult />}
    </div>
  )
}

export default NestedGroupsLister

/**
 * A button component for fetching and visualizing a hierarchy graph.
 *
 * The button is disabled if the `groupList` prop is empty or falsy.
 * When clicked, it sends a GET request to `/api/groups/target/:query/hierarchy` with the user's email and the query email to retrieve the hierarchy graph.
 * If the response is successful, it saves the graph to the local storage and opens a new tab with the graph.
 * If there is an issue with the API call or if the hierarchy cannot be fetched, it throws an error.
 *
 * @param {Object[]} groupList - An array containing details about the group memberships.
 * @param {string} query - The email address being queried for nested group memberships.
 * @throws {Error} - If there is an issue with the API call or if the hierarchy cannot be fetched.
 */
function HierarchyButton({ groupList, query }) {
  /**
   * Handles the button click event.
   * Removes any existing graph from the local storage.
   * Fetches the hierarchy graph for the given email address and saves it to the local storage.
   * Opens a new tab with the graph if the request is successful.
   * @throws {Error} - If there is an issue with the API call or if the hierarchy cannot be fetched.
   */
  async function handleClick() {
    const oldGraph = localStorage.getItem('graph')
    if (oldGraph) localStorage.removeItem('graph')
    const newTab = window.open(`/groups/hierarchy/graph?target=${query}`, '_blank')

    try {
      const email = window.localStorage.getItem('email')
      console.log('email:', email)

      const token = localStorage.getItem('jwtToken')
      console.log('TOKEN', token)
      //while FE is broken, falling back to the good old fetch(beware of cache though)
      const response = await fetch(`http://localhost:4000/api/groups/target/${query}/hierarchy?userEmail=${email}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: 'GET',
        cache: 'no-store', //this disables cache
      })

      //disabled apiClient because the logic for get requests is not ready yet
      // const response = await apiClient(
      //   '/api/groups/get-hierarchy', // Endpoint path relative to API_BASE_URL
      //   'POST', // HTTP method
      //   {
      //     userEmail: email,
      //     queryEmail: inputValue,
      //   },
      //   {}, // Additional headers, if any
      //   true // withCredentials flag
      // )
      // if emtpy data is returned, set error 'No memberships found', otherwise set groupList
      if (response) {
        // const responseData = JSON.parse(response)
        const responseData = await response.json()

        if (responseData.nodes && responseData.nodes.length > 0) {
          const graph = {
            graph: responseData,
            star: query,
          }
          localStorage.setItem('graph', JSON.stringify(graph))
          newTab.location.reload()
        }
      }
    } catch (error) {
      console.log('error:', error)
    }
  }
  return (
    <Button
      type="button"
      variant="outline"
      className={`${groupsStyles.buttonPadding}`}
      disabled={groupList && groupList.length === 0}
      onClick={handleClick}
    >
      <EyeIcon size={20} />
      Visualize hierarchy
    </Button>
  )
}

/**
 * A form component for entering an email address to query nested group memberships.
 *
 * This form uses Zod for schema validation and react-hook-form for form management.
 * It validates that the email field is not empty and contains a valid email address.
 * Upon successful submission, it updates the query state with the input email.
 *
 * @param {Function} setQuery - A function to update the query state with the submitted email.
 */

function InputForm({ query, setQuery, hiddenClass, groupList }) {
  // Define the schema with Zod
  const FormSchema = z.object({
    email: z
      .string()
      .min(1, {
        message: 'This field cannot be empty',
      })
      .email('Please input a valid email address'),
  })

  // Initialize the form using react-hook-form and Zod resolver for validation
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
    },
  })

  /**
   * Handles the form submission by calling the setQuery function with the submitted email.
   * @param {Object} data - The form data containing the submitted email.
   */
  function onSubmit(data) {
    setQuery(data.email)
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={hiddenClass}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  className={`text-muted-foreground ${groupsStyles.searchBarWidth} `}
                  type="email"
                  name="email"
                  placeholder="Enter a group or user email address"
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
          {groupList.length > 0 && <HierarchyButton groupList={groupList} query={query} />}
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

/**
 * A component that displays a message indicating no hierarchy is found.
 *
 * This component renders a header and subheader message to inform the user
 * that the target may not belong to any groups.
 *
 * @returns {JSX.Element} The JSX element containing the no hierarchy message.
 */
function EmptyResult() {
  return (
    <div className={`${groupsStyles.roundBorder} w-full h-full mt-3 pb-7 flex flex-col items-center justify-center`}>
      <SearchIcon size={116} className="text-muted-foreground" />
      <p className="text-2xl font-medium leading-10">No hierarchy found</p>
      <p className="text-xs leading-6">The target may not be a member of any groups</p>
    </div>
  )
}

/**
 * A component that renders a top panel displaying information about the nested group membership query.
 *
 * This panel includes a message showing the email address being queried and provides a button to
 * analyze another group or user. It also includes a button to visualize the hierarchy if the group list is not empty.
 *
 * @param {string} query - The email address being queried for nested group memberships.
 * @param {string} hiddenClass - A string that controls the visibility of the panel.
 * @param {Function} setHiddenClass - A function to update the hiddenClass state.
 * @param {Object[]} groupList - An array containing details about the group memberships.
 *
 * @returns {JSX.Element} A JSX element representing the top panel of the nested group membership view.
 */

function TopPanel({ query, hiddenClass, setHiddenClass, groupList }) {
  return (
    <div className={`flex items-center justify-between ${hiddenClass === 'hidden' ? '' : 'hidden'}`}>
      <div className={`py-3 px-4`}>
        <span className={`text-sm my-3 py-1 px-3 ${groupsStyles.roundBorder} ${groupsStyles.thinShadow}`}>
          Showing nested group membership for <span className="font-semibold">{query}</span>
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
          Analyze another group or user
        </Button>
        <HierarchyButton groupList={groupList} query={query} />
      </div>
    </div>
  )
}

/**
 * ExpandableInheritedViaList is a component that takes a string of
 * comma-separated group names and displays the first 50 characters
 * of the string. If the string is longer than 50 characters and contains
 * a comma, it displays the part before the last comma. The user can click
 * on the ellipsis at the end of the string to expand it to the full
 * string.
 *
 * @param {{ inheritedVia: string }} props The props object.
 * @prop {string} inheritedVia The string of comma-separated group names.
 *
 * @returns {JSX.Element} The JSX element representing the expandable list.
 */
function ExpandableInheritedViaList({ inheritedVia }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inheritedViaText, setInheritedViaText] = useState('')

  useEffect(() => {
    if (isExpanded) return
    // If the string is longer than 50 characters and contains a comma, only display the part before the last comma
    const visiblePartBase = inheritedVia.slice(0, 50)
    const lastOccurence = visiblePartBase.lastIndexOf(',')
    if (lastOccurence >= 0) {
      setInheritedViaText(inheritedVia.slice(0, lastOccurence))
    } else {
      //if the comma is not found, only display the first 50 characters
      setInheritedViaText(visiblePartBase)
    }
  }, [inheritedViaText])
  return (
    <span>
      {inheritedViaText}
      {!isExpanded && (
        <Ellipsis
          className={`ms-2 cursor-pointer hover:stroke-primary active:stroke-primary focus:stroke-primary inline ${
            isExpanded ? 'hidden' : ''
          }`}
          size={20}
          onClick={() => {
            setIsExpanded(true)
            setInheritedViaText(inheritedVia)
          }}
        />
      )}
    </span>
  )
}

/**
 * A component that renders a table displaying nested group membership details.
 *
 * This table includes columns for the group email, the method of inheritance,
 * the type of membership, and the timestamp when the membership was created.
 *
 * @param {Object[]} groups - An array of objects, each containing details about a group membership.
 * @param {string} groups[].email - The email address of the group.
 * @param {string} groups[].inherited - The path through which the membership was inherited.
 * @param {string} groups[].membership - The type of membership (e.g., direct or indirect).
 * @param {string} groups[].timestamp - The timestamp of when the membership was established.
 *
 * @returns {JSX.Element} A JSX element representing the table of nested group memberships.
 */

function NestedGroupsTable({ groups, query, isMenuOpen, setIsMenuOpen, fileName, setFileName }) {
  /**
   * A function that takes a timestamp string and returns it in a slightly more user-friendly format.
   * If the timestamp string includes 'GMT', it is split and 'JST' is appended to the end.
   * Otherwise, the timestamp string is returned unchanged.
   *
   * @param {string} timestamp - The timestamp string to convert.
   * @returns {string} The timestamp string, possibly modified.
   */
  //a temporary patch to fix the format of the timestamp coming from the backend, to be able to check out the actual column lenth
  //this will be fixed in BE because they have the moments-timezone library which should make it easy(probably)
  function convertTimestamp(timestamp) {
    if (!timestamp) return ''

    if (timestamp.includes('GMT')) {
      return timestamp.split('GMT')[0] + 'JST'
    } else {
      return timestamp
    }
  }
  const tableRef = useRef(null)
  useEffect(() => {
    if (tableRef.current) {
      const parentDiv = tableRef.current.parentElement
      parentDiv.classList.add(
        'overflow-y-scroll',
        'h-[80vh]',
        'relative',
        'mt-3',
        'mb-7',
        'relative',
        'md:w-full',
        'w-fit',
        'border',
        'border-input',
        'rounded-md'
      )

      const tableHead = tableRef.current.children[0]
      const row = tableHead.children[0]
      row.classList.remove('border-foreground/30')
      row.classList.add('border-input')
    }
  }, [])

  const [displayedGroups, setDisplayedGroups] = useState(groups.slice(0, 30))

  useEffect(() => {
    if (!tableRef.current) return
    const parentDiv = tableRef.current.parentElement

    /**
     * An event handler for the scroll event on the table container.
     * It checks if the user has scrolled to the bottom of the container.
     * If so, it adds 10 more items to the displayedGroups state.
     * This has the effect of lazy-loading the table, so that only
     * a subset of the groups are displayed at any given time.
     */
    //this is a temporary solution, to be fixed in BE
    //it imitates "lazy loading" by displaying 30 rows by default and loading additional rows on scroll, 10 rows at a time
    const handleScroll = () => {
      if (parentDiv.scrollTop + parentDiv.offsetHeight >= parentDiv.scrollHeight) {
        setDisplayedGroups(() => {
          return displayedGroups.length === groups.length
            ? displayedGroups
            : groups.slice(0, displayedGroups.length + 10)
        })
      }
    }
    parentDiv.addEventListener('scroll', handleScroll)
    return () => {
      parentDiv.removeEventListener('scroll', handleScroll)
    }
  }, [displayedGroups])
  return (
    <Table ref={tableRef}>
      <TableHeader className="sticky top-0 bg-background custom-shadow">
        <TableRow className="leading-4 text-foreground hover:bg-background text-inherit sm:text-nowrap">
          <TableHead className={`${groupsStyles.tableHeaderText} px-0 rounded-tl-lg`}></TableHead>
          <TableHead className={`${groupsStyles.tableHeaderText} ps-4`}>{columnHeaders[0] /* Group name */}</TableHead>
          <TableHead className={`${groupsStyles.tableHeaderText}`}>{columnHeaders[1] /* Membership type */}</TableHead>
          <TableHead className={`${groupsStyles.tableHeaderText}`}>{columnHeaders[2] /* Inherited via */}</TableHead>
          <TableHead className={`${groupsStyles.tableHeaderText} `}>
            {/* I split the header because I want to put them in different spans to prevent the icon from wrapping to the 3rd line */}
            <span>{columnHeaders[3].split(' ')[0] + ' ' /* Join */}</span>
            <span className="text-nowrap">
              {columnHeaders[3].split(' ')[1] /* timestamp */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <CircleAlert size={16} className="inline align-middle ms-1 stroke-destructive" />
                  </TooltipTrigger>
                  <TooltipContent sideOffset={28} align="start" alignOffset={-250}>
                    {/* I had to separate the tooltip content into into paragraphs because the escape characters were ignored.
                   Maybe there's a better/easier way to do it*/}
                    <p>{`A blank value in this column usually means that the`}</p>
                    <p>{`timestamp isn't available. In most cases, it's missing`}</p>
                    <p>{`because Google only retains relevant logs for 180 days.`}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          </TableHead>
          <TableHead className="text-inherit pe-2.5 rounded-tr-lg">
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
                  <DialogTrigger>
                    <div className={`flex items-center py-3 px-2 w-[204px]`}>
                      <div
                        className="flex items-center  py-1 px-2 gap-3 bg-accent rounded-md text-s w-[188px]"
                        role="button"
                        onClick={() => {
                          setFileName(`memberships_for_${query}`)
                        }}
                      >
                        <DropdownMenuItem className="cursor-pointer">
                          <CustomIconExport />
                          <span>Export results</span>
                        </DropdownMenuItem>
                      </div>
                    </div>
                  </DialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <DialogPortal>
                <DialogContent className="[&>button]:hidden" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle className="text-2xl/6">Export Nested Group Membership</DialogTitle>
                    <p className="text-base/5">Name your export</p>
                    <Input
                      className="text-muted-foreground"
                      placeholder="Add a name"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                    />
                    <p className="text-base/5">Choose a format</p>
                    <RadioGroup defaultValue="csvFormat" className="border border-input rounded-md p-4 gap-y-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option-one" id="googlesheetFormat" disabled />
                        <Label htmlFor="option-one" className="text-muted-foreground">
                          Google Sheet (coming soon)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option-two" id="csvFormat" checked />
                        <Label htmlFor="option-two">CSV</Label>
                      </div>
                    </RadioGroup>
                    <div className="flex flex-col items-center justify-center sm:flex-row sm:justify-end sm:gap-x-4">
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={`${groupsStyles.buttonPaddingWide} w-[108px]`}
                        >
                          Cancel
                        </Button>
                      </DialogClose>

                      <CsvDownloadButton
                        data={[...groups]}
                        headers={columnHeaders}
                        filename={fileName === '' ? `memberships_for_${query}` : fileName}
                        className="hidden"
                        id="csv-download-group-memberships"
                      >
                        {/* Nesting buttons is not allowed in html, so I hid the csv button and added a fn onclick to the export button. */}
                        {/* Even with nesting it was working fine, but I didn't want the warning. */}
                      </CsvDownloadButton>
                      <Button
                        className={`${groupsStyles.buttonPaddingWide}`}
                        onClick={() => document.getElementById('csv-download-group-memberships').click()}
                      >
                        Export
                      </Button>
                    </div>
                  </DialogHeader>
                </DialogContent>
              </DialogPortal>
            </Dialog>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className={`border-none py-0`}>
          <TableCell className={`text-[8px] py-0 leading-none`}>&nbsp;</TableCell>
        </TableRow>
        {displayedGroups &&
          displayedGroups.map((group) => (
            <TableRow className={`border-none hover:bg-accent min-w-2xl`} key={group.email}>
              <TableCell className={`!w-[4px] !bg-background !hover:bg-background px-0 leading-none`}>&nbsp;</TableCell>
              <TableCell className={`${groupsStyles.tableRowPadding} ps-4 font-normal rounded-l-md`}>
                {group.email}
              </TableCell>
              <TableCell className={`${groupsStyles.tableRowPadding}`}>{group.membership}</TableCell>
              <TableCell className={`${groupsStyles.tableRowPadding}`}>
                {group.inherited.length < 50 ? (
                  group.inherited
                ) : (
                  <ExpandableInheritedViaList inheritedVia={group.inherited} />
                )}
              </TableCell>
              <TableCell className={`${groupsStyles.tableRowPadding}`}>{convertTimestamp(group.timestamp)}</TableCell>
              <TableCell className={`${groupsStyles.tableRowPadding} rounded-r-md`}> </TableCell>
              <TableCell className={`!w-[4px] !bg-background !hover:bg-background leading-none`}>&nbsp;</TableCell>
            </TableRow>
          ))}
        {/* A dummy row at the end for the sake of the radius and padding */}
        <TableRow className={`border-none rounded-b-md py-0`}>
          <TableCell className={`text-[8px] py-0 leading-none`}>&nbsp;</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}
