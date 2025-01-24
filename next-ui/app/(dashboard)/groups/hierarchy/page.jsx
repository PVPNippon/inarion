'use client'
import React, { useState, useEffect, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiClient } from '@/utils/apiClient'
import { ExternalLinkIcon, SearchIcon, EyeIcon, Ellipsis, RotateCwSquare, CircleAlert } from 'lucide-react'
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

/**
 * Component for listing nested group memberships.
 *
 * This component allows users to view the ancestry of a group or user by querying
 * nested group memberships. It utilizes the `LoggedInUserContext` to access the user's
 * email and manages several states to handle loading, errors, and displaying results.
 *
 * States:
 * - `groupList`: An array storing the fetched nested memberships.
 * - `error`: A string for storing any error messages encountered during the API call.
 * - `isLoading`: A boolean indicating if the data is currently being fetched.
 * - `emptyResult`: A boolean indicating if no memberships were found.
 * - `query`: A string for storing the email address being queried.
 * - `hiddenClass`: A string for managing CSS classes based on state.
 *
 * Side Effects:
 * - Uses `useEffect` to fetch nested memberships whenever the `query` changes.
 *
 * API:
 * - Sends a POST request to `/api/groups/get-nested-membership` with the user's email
 *   and the query email to retrieve the list of nested memberships.
 *
 * @returns {JSX.Element} The rendered component for displaying nested group memberships.
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
    /**
     * Fetches the nested membership of a given group or user.
     * Sets the `groupList` state to the response data if it is not empty, otherwise sets the `emptyResult` state to true.
     * Sets the `error` state if there is an error with the API call.
     * Sets the `isLoading` state to false when the API call is finished.
     */
    async function fetchMembership() {
      //validation should do it, but just in case
      if (query === '') return

      try {
        //reset states
        setIsLoading(true)
        setError('')
        setGroupList([])
        setEmptyResult(false)

        email = window.localStorage.getItem('email')
        console.log('email:', email)

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
  }, [query])
  return (
    // TODO(maria): need more testing with this height↓
    <div style={{ height: `calc(100vh - 288px)` }} className="mx-8 mb-6">
      <p className="mb-3.5 text-2xl font-medium leading-7">Nested Group Membership</p>
      <p className="text-lg text-muted-foreground mb-3 leading-5">View the ancestry of a group or user</p>
      <div className={`flex text-xs gap-x-1 ${groupsStyles.secondaryTextChart5} mb-3`}>
        <span>Learn how it works</span>
        {/* TODO(maria): replace the link below with the actual link when it's ready*/}
        <a href="http://localhost:3000/groups" target="_blank">
          <ExternalLinkIcon size={14} />
        </a>
      </div>
      <InputForm setQuery={setQuery} hiddenClass={hiddenClass} groupList={groupList} />
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
 * A button that is disabled when the groupList is empty.
 * When clicked, it currently redirects to the hierarchy page just to check that the routing works.
 * Eventually, the NestedGroupsLister will move to the main hierarchy page (which is accessible from the icon on the side panel)
 * and the redirection link will send a request to get the hierarchy graph and open it in a separate tab.
 */
function HierarchyButton({ groupList }) {
  return (
    <Button
      variant="outline"
      className={`${groupsStyles.buttonPadding}`}
      disabled={groupList && groupList.length === 0}
      onClick={() => {
        //I temporarily redirect to the hierarchy page just to check that the routing works
        //Eventually, the NestedGroupsLister will move to the main hierarhy page(which is accessible from the icon on the side panel)
        //And the redirection link will send a request to get the hierarchy graph and open it in a separate tab
        const url = `http://localhost:3000/groups/hierarchy`
        window.open(url, '_blank')
      }}
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

function InputForm({ setQuery, hiddenClass, groupList }) {
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
          {groupList.length > 0 && <HierarchyButton groupList={groupList} />}
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
        <HierarchyButton groupList={groupList} />
      </div>
    </div>
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
  return (
    <div className={`${groupsStyles.roundBorder} w-full mt-3 mb-7`}>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-input custom-shadow leading-4 text-foreground">
            <TableHead className="text-inherit ps-9">Group name</TableHead>
            <TableHead className="text-inherit">Membership type</TableHead>
            <TableHead className="text-inherit">Inherited via</TableHead>
            <TableHead className="text-inherit">
              <span>Join timestamp</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    {' '}
                    <CircleAlert size={16} className="inline align-middle ms-2 stroke-destructive" />
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
            </TableHead>
            <TableHead className="text-inherit pe-2.5">
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
                            <RotateCwSquare size={20} />
                            <span>Export results</span>
                          </DropdownMenuItem>
                        </div>
                      </div>
                    </DialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DialogPortal className="bg-white">
                  <DialogContent className="[&>button]:hidden">
                    <DialogHeader>
                      <DialogTitle className="text-2xl/6">Export Nested Group Membership</DialogTitle>
                    </DialogHeader>
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
                        headers={['Group name', 'Membership type', 'Inherited via', 'Join timestamp']}
                        filename={fileName === '' ? `memberships_for_${query}` : fileName}
                      >
                        <Button type="submit" className={`${groupsStyles.buttonPaddingWide}`}>
                          Export
                        </Button>
                      </CsvDownloadButton>
                    </div>
                  </DialogContent>
                </DialogPortal>
              </Dialog>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups &&
            groups.map((group) => (
              <TableRow className={`border-none hover:bg-accent`} key={group.email}>
                <TableCell className={`${groupsStyles.tableRowPadding} font-normal ps-9`}>{group.email}</TableCell>
                <TableCell className={`${groupsStyles.tableRowPadding}`}>{group.membership}</TableCell>
                <TableCell className={`${groupsStyles.tableRowPadding}`}>{group.inherited}</TableCell>
                <TableCell className={`${groupsStyles.tableRowPadding}`}>{group.timestamp}</TableCell>
                <TableCell className={`${groupsStyles.tableRowPadding}`}> </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}
