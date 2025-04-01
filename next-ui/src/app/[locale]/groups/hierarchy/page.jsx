'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
//import { apiClient } from '@/utils/apiClient'
import moment from 'moment-timezone'
import { ExternalLinkIcon, SearchIcon, EyeIcon, Ellipsis, CircleAlert } from 'lucide-react'
import { groupsStyles, groupElementIds, groupStrings } from '@/app/ui/variables/group-variables'
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
import { CustomIconExport } from '@/app/ui/svg-icons/custom-icons'
import {
  CustomTable,
  CustomTableHeader,
  CustomTableBody,
  CustomTableRow,
  CustomTableCell,
  CustomTableHead,
} from '@/components/ui/custom-table'

import {
  CustomListAccordion,
  CustomListAccordionItem,
  CustomListAccordionTrigger,
  CustomListAccordionContent,
} from '@/components/ui/custom-list-accordion'

import { checkIfDomainIsValid } from '@/utils/checkIfDomainIsValid'
import { useDomainList } from '@/utils/getDomains'

//constants
const columnHeaders = ['Group email', 'Membership type', 'Inherited via', 'Join timestamp'] //column headers
const rowsOnFirstLoad = 30 //number of table rows to load on first load
const rowLoadIncrement = 10 //number of table rows to load on scroll

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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [fileName, setFileName] = useState('')
  const [csvGroups, setCsvGroups] = useState([])
  const { domainList } = useDomainList()
  let email

  /**
   * Takes an array of objects and formats the "inherited" property
   * for proper CSV export.
   *
   * If the "inherited" property is an array, it joins the array
   * elements with a line separator character.
   *
   * If the "inherited" property is a string, it splits the string
   * into an array using the comma as a separator, trims each element,
   * and then joins the array elements with a line separator character.
   *
   * @param {Object[]} groups - An array of objects, each representing
   * a group membership.
   *
   * @returns {Object[]} An array of objects, with the "inherited" property
   * formatted for proper CSV export.
   */
  function prepareCsvColumnData(groups) {
    const formattedGroups = [...groups] //looks like overkill, but it's better to be safe than sorry

    for (let g of formattedGroups) {
      //fallback for when inherited comes as an array from backend
      if (g.inherited.length > 0) {
        if (Array.isArray(g.inherited)) {
          g.inherited = g.inherited.map((item) => item.trim()).join('\u2028') //line separator
        } else {
          g.inherited = g.inherited
            .split(',')
            .map((item) => item.trim())
            .join('\u2028') //line separator, because '\n' was not working
        }
      }
    }

    return formattedGroups
  }

  useEffect(() => {
    const controller = new AbortController() // Create a new AbortController to abort fetch request if a similar request is already in progress

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
        setFileName('')
        setCsvGroups([])

        //getting email and token from local storage is a temporary measure, so I'm not refactoring or improving this part
        // email = window.localStorage.getItem('email')
        email = 'testadmin@pvp-test-domain2.com'
        console.log('email:', email)

        //N.B.the token validity is 1 hour, when started getting the 401 error, sign out and sign in back (temprorary measure, so no refactoring or optimization here)
        // const token = localStorage.getItem('jwtToken')
        // console.log('TOKEN', token)

        //temporary disabled apiClient because encryption logic is not ready for get requrests
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
              // Authorization: `Bearer ${token}`,
            },
            method: 'GET',
            cache: 'no-store', //this disables cache
          }
        )

        // if emtpy table is returned, set error 'No memberships found', otherwise set groupList
        if (response) {
          //  const responseData = JSON.parse(response) //to use when apiClient is back
          const responseData = await response.json()

          if (responseData.length === 0) {
            setEmptyResult(true)
          } else {
            setGroupList(responseData)
            //create a separate array with groups for csv column data
            const csvGroups = responseData.map((group) => {
              return {
                email: group.email,
                membership: group.membership,
                inherited: group.inherited,
                timestamp: group.timestamp,
              }
            })
            setCsvGroups(prepareCsvColumnData(csvGroups))
          }
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
    //apply custom height only when emptyResult is displayed (maybe it should also be set when there is an error screen in the future). The height depends on the height of components above it.
    <div style={{ height: emptyResult && `calc(100vh - 372px)` }} className="mx-8 mb-6">
      <p className="mb-3.5 text-2xl font-medium leading-7">Nested Group Membership</p>
      <p className="text-lg text-muted-foreground mb-3 leading-5">View the ancestry of a group or user</p>
      <div className={`flex text-xs gap-x-1 ${groupsStyles.secondaryTextChart5} mb-3`}>
        <span>Learn how it works</span>
        {/* TODO(maria): replace the link below with the actual link when it's ready*/}
        <a href="http://localhost:3000/groups" target="_blank">
          <ExternalLinkIcon size={14} />
        </a>
      </div>
      <InputForm query={query} setQuery={setQuery} domainList={domainList} />
      {isLoading && <Loader />}
      {!isLoading && !error && query && <TopPanel query={query} groupList={groupList} />}
      {!isLoading && !error && groupList.length > 0 && (
        <NestedGroupsTable
          csvGroups={csvGroups}
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
function HierarchyButton({ groupList, query, className }) {
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

    const path = window.location.pathname
    const newTab = window.open(`${path}/graph?target=${query}`)

    try {
      // const email = window.localStorage.getItem('email')
      // console.log('email:', email)
      const email = 'testadmin@pvp-test-domain2.com'
      // const token = localStorage.getItem('jwtToken')
      // console.log('TOKEN', token)
      //while FE is broken, falling back to the good old fetch(beware of cache though)
      const response = await fetch(`http://localhost:4000/api/groups/target/${query}/hierarchy?userEmail=${email}`, {
        headers: {
          //  Authorization: `Bearer ${token}`,
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
      className={`${groupsStyles.buttonPadding} ${className}`}
      disabled={groupList && groupList.length === 0}
      onClick={handleClick}
    >
      <EyeIcon size={20} />
      Visualize hierarchy
    </Button>
  )
}

/**
 * A form component for submitting an email address to query nested group memberships.
 *
 * This component uses Zod for schema validation and react-hook-form for form management.
 * It validates the email field to ensure it is not empty, contains a valid email address,
 * and belongs to the specified customer domains. The "Go" button is disabled until all
 * validation criteria are met.
 *
 * @param {Function} setQuery - A function to update the query state with the submitted email.
 * @param {Array} domainList - A list of valid domains to validate the email address against.
 */
function InputForm({ setQuery, domainList }) {
  const [goButtonDisabled, setGoButtonDisabled] = useState(false)
  const [inputValue, setInputValue] = useState('')

  // Define the schema with Zod
  const FormSchema = z.object({
    email: z
      .string()
      .min(1, {
        message: 'This field cannot be empty',
      })
      .email('Please input a valid email address')
      .refine(
        async (e) => {
          return await checkIfDomainIsValid({ domain: e.split('@')[1], domainList })
        },
        {
          message: 'Cannot query email address outside customer domains',
        }
      ),
  })

  // Initialize the form using react-hook-form and Zod resolver for validation
  const form = useForm({
    mode: 'all', //needed to specify this to display validation errors before the first form has been submitted(otherwise no validation message will be displayed prior to first submission)
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
    },
  })

  /**
   * Handles the form submission by calling the setQuery function with the submitted email.
   * Prevents the form from submission by hitting enter, and resets the domain list.
   * @param {Object} data - The form data containing the submitted email.
   */
  function onSubmit(data) {
    if (goButtonDisabled) return //prevent form from submission by hitting enter
    setQuery(data.email)
    setInputValue('')
    setGoButtonDisabled(true)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className={`flex gap-x-10 mb-5 items-center`}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className={`text-foreground ${groupsStyles.searchBarWidthVariantB} `}
                    type="email"
                    name="email"
                    placeholder="Enter a group or user email address"
                    hasIcon={true}
                    {...field}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value)
                      field.onChange(e)
                      if (e.target.value !== '') setGoButtonDisabled(false)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            className={`${groupsStyles.buttonPadding} self-start`}
            type="submit"
            disabled={goButtonDisabled ? true : !form.formState.isValid}
          >
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
 * visualize the hierarchy if the group list is not empty.
 *
 * @param {string} query - The email address being queried for nested group memberships.
 * @param {Object[]} groupList - An array containing details about the group memberships.
 *
 * @returns {JSX.Element} The JSX element representing the top panel of the nested group membership view.
 */
function TopPanel({ query, groupList }) {
  return (
    <div className={`flex items-center justify-between ${groupsStyles.roundBorder} px-4`}>
      <span className={`text-sm  py-1 px-3 ${groupsStyles.roundBorder} ${groupsStyles.thinShadow}`}>
        Showing nested group membership for <span className="font-semibold">{query}</span>
      </span>
      <HierarchyButton groupList={groupList} query={query} className="my-[14.5px]" />
    </div>
  )
}

/**
 * A component that renders a collapsible list of inherited via paths.
 *
 * @param {{ inheritedVia: string | string[], groupId: string }} props The props object.
 * @prop {string | string[]} inheritedVia The inherited via paths that will be displayed in the list.
 * @prop {string} groupId The ID of the group that the inherited via paths belong to.
 *
 * @returns {JSX.Element} The JSX element representing the collapsible list of inherited via paths.
 */
function ExpandableInheritedViaList({ inheritedVia, groupId }) {
  const [isExpanded, setIsExpanded] = useState('')

  let inheritedViaArray

  if (Array.isArray(inheritedVia)) {
    inheritedViaArray = inheritedVia
  } else {
    inheritedViaArray = inheritedVia.split(',').map((x) => x.trim())
  }

  if (inheritedViaArray.length === 1) {
    return <span>{inheritedViaArray[0]}</span>
  }

  return (
    <CustomListAccordion type="single " collapsible value={isExpanded} onValueChange={setIsExpanded}>
      <CustomListAccordionItem value={groupId} className="text-sm">
        <CustomListAccordionContent>
          {inheritedViaArray.map((inheritedVia) => (
            <div key={inheritedVia}>{inheritedVia}</div>
          ))}
        </CustomListAccordionContent>
        <CustomListAccordionTrigger>
          {isExpanded === groupId ? (
            <span className={`${groupsStyles.secondaryTextChart5}`}>Show less</span>
          ) : (
            <span>
              <span style={{ pointerEvents: 'none' }}>{inheritedViaArray[0]}</span>
              <span className={`${groupsStyles.secondaryTextChart5}`}>
                {` + ${inheritedViaArray.length - 1} more`}{' '}
              </span>{' '}
            </span>
          )}
        </CustomListAccordionTrigger>
      </CustomListAccordionItem>
    </CustomListAccordion>
  )
}

/**
 * A component that renders a table with nested groups data.
 *
 * @param {{groups: Group[], query: string, isMenuOpen: boolean, setIsMenuOpen: (open: boolean) => void, fileName: string, setFileName: (name: string) => void, csvGroups: Group[]}} props
 * @prop {Group[]} groups The array of groups to display in the table.
 * @prop {string} query The query string used to filter the groups.
 * @prop {boolean} isMenuOpen Whether the export dropdown menu is open.
 * @prop {(open: boolean) => void} setIsMenuOpen A function to set the export dropdown menu open state.
 * @prop {string} fileName The current name of the export csv file.
 * @prop {(name: string) => void} setFileName A function to set the export csv file name.
 * @prop {Group[]} csvGroups The array of groups to export as csv.
 * @returns {JSX.Element} The JSX element representing the table with nested groups data.
 */
function NestedGroupsTable({ groups, query, isMenuOpen, setIsMenuOpen, fileName, setFileName, csvGroups }) {
  const [displayedGroups, setDisplayedGroups] = useState(groups.slice(0, rowsOnFirstLoad))
  const tableRef = useRef(null)

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

    return moment(timestamp)
      .tz(Intl.DateTimeFormat().resolvedOptions().timeZone) // Detect user's timezone
      .format('YYYY-MM-DD HH:mm:ss z') // 24-hour format with timezone abbreviation
  }

  useEffect(() => {
    //the logic below hacks a custom schadcn table and scroll-area components into submission.
    //in a nutshell, it finds the component instance in the fiber tree, removes unvafourable preset classes from it and adds custom ones.
    //I only display the scroll area when the table has more than the initial load number of rows (i.e. the data has more rows than the number of rows in the first batch)
    //As of now it has nothing to do with the customer's window size.
    //If they minimized the window, the scroll area will not be visible if there is less than initial load number of rows, but they can use the chrome window scrollbar.

    if (tableRef.current) {
      //grab the table from the fiber tree, remove and add classes.
      const tableComponent = tableRef.current.parentElement.parentElement.parentElement

      tableComponent.classList.remove('h-[200px]')

      tableComponent.classList.add(groups.length > rowsOnFirstLoad && 'h-[80vh]', 'mt-3', 'mb-7')
    }
  }, [])

  useEffect(() => {
    if (!tableRef.current) return

    //grab the scroll area from the fiber tree
    const scrollArea = tableRef.current.parentElement.parentElement.parentElement.children[1]

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
      if (scrollArea.scrollTop + scrollArea.offsetHeight >= scrollArea.scrollHeight) {
        setDisplayedGroups(() => {
          return displayedGroups.length === groups.length
            ? displayedGroups
            : groups.slice(0, displayedGroups.length + rowLoadIncrement)
        })
      }
    }
    scrollArea.addEventListener('scroll', handleScroll)
    return () => {
      scrollArea.removeEventListener('scroll', handleScroll)
    }
  }, [displayedGroups])

  return (
    <CustomTable ref={tableRef}>
      <CustomTableHeader>
        <CustomTableRow className="sm:text-nowrap">
          <CustomTableHead className={`${groupsStyles.tableHeaderText} px-0`}></CustomTableHead>
          <CustomTableHead className={`${groupsStyles.tableHeaderText} ps-4 md:pe-[100px]`}>
            {columnHeaders[0] /* Group email */}
          </CustomTableHead>
          <CustomTableHead className={`md:pe-[100px]`}>{columnHeaders[1] /* Membership type */}</CustomTableHead>
          <CustomTableHead className={`md:pe-[100px]`}>{columnHeaders[2] /* Inherited via */}</CustomTableHead>
          <CustomTableHead className={`md:pe-[100px]`}>
            {/* I split the header because I want to put them in different spans to prevent the icon from wrapping to the 3rd line */}
            <span>{columnHeaders[3].split(' ')[0] + ' ' /* Join */}</span>
            <span className="text-nowrap">
              {columnHeaders[3].split(' ')[1] /* timestamp */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <CircleAlert size={16} className="inline align-middle ms-[9px] stroke-destructive" />
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
                    <DropdownMenuItem
                      className="focus:bg-background hover:bg-background cursor-pointer"
                      onClick={() => {
                        setFileName(`${groupStrings.defaultExportFileName}${query}`)
                      }}
                    >
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
                        data={csvGroups}
                        headers={columnHeaders}
                        filename={fileName === '' ? `${groupStrings.defaultExportFileName}${query}` : fileName}
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
        <CustomTableRow className={`py-0`}>
          <CustomTableCell className={`text-[8px] py-0 leading-none bg-background`}>&nbsp;</CustomTableCell>
        </CustomTableRow>
        {displayedGroups &&
          displayedGroups.map((group) => (
            <CustomTableRow className={`border-none hover:bg-accent min-w-2xl`} key={group.email}>
              <CustomTableCell className={`!w-[4px] !bg-background !hover:bg-background px-0 leading-none`}>
                &nbsp;
              </CustomTableCell>
              <CustomTableCell className={`${groupsStyles.tableRowPadding} ps-4 font-normal rounded-l-md`}>
                {group.email}
              </CustomTableCell>
              <CustomTableCell className={`${groupsStyles.tableRowPadding}`}>{group.membership}</CustomTableCell>
              <CustomTableCell className={`${groupsStyles.tableRowPadding}`}>
                <ExpandableInheritedViaList inheritedVia={group.inherited} groupId={group.email} />
              </CustomTableCell>
              <CustomTableCell className={`${groupsStyles.tableRowPadding} sm:text-nowrap`}>
                {convertTimestamp(group.timestamp)}
              </CustomTableCell>
              <CustomTableCell className={`${groupsStyles.tableRowPadding} rounded-r-md`}> </CustomTableCell>
              <CustomTableCell className={`!w-[4px] !bg-background !hover:bg-background leading-none`}>
                &nbsp;
              </CustomTableCell>
            </CustomTableRow>
          ))}
        {/* A dummy row at the end for the sake of the radius and padding */}
        <CustomTableRow className={`border-none rounded-b-md py-0`}>
          <CustomTableCell className={`text-[8px] py-0 leading-none bg-background`}>&nbsp;</CustomTableCell>
        </CustomTableRow>
      </CustomTableBody>
    </CustomTable>
  )
}
