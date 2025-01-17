'use client'
import React, { useState, useEffect, useContext } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiClient } from '@/utils/apiClient'
import { ExternalLinkIcon, SearchIcon } from 'lucide-react'
import { groupsStyles } from '../../(dashboard)/groups/groups-styles'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'

function NestedGroupsLister() {
  const { email } = useContext(LoggedInUserContext)
  const [groupList, setGroupList] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emptyResult, setEmptyResult] = useState(false)
  const [query, setQuery] = useState('')

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

        const response = await apiClient(
          '/api/groups/get-nested-membership', // Endpoint path relative to API_BASE_URL
          'POST', // HTTP method
          {
            userEmail: email,
            queryEmail: query,
          },
          {}, // Additional headers, if any
          true // withCredentials flag
        )

        // if emtpy table is returned, set error 'No memberships found', otherwise set groupList
        if (response) {
          const responseData = JSON.parse(response)
          responseData.length === 0 ? setEmptyResult(true) : setGroupList(responseData)
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
    <div className="mx-8 mb-6">
      <p className="mb-3.5 text-2xl font-medium leading-7">Nested Group Membership</p>
      <p className=" text-lg text-muted-foreground mb-3 leading-5">View the ancestry of a group or user</p>
      <div className={`flex text-xs gap-x-1 ${groupsStyles.secondaryTextChart5}`}>
        <span>Learn how it works</span>
        {/* TODO(maria): replace the link below with the actual link */}
        <a href="http://localhost:3000/groups" target="_blank">
          <ExternalLinkIcon size={14} />
        </a>
      </div>
      <InputForm setQuery={setQuery} />
      {isLoading && <Loader />}
      {!isLoading && !error && groupList.length > 0 && <NestedGroupsTable groups={groupList} />}
      {error && <ErrorMessage message={error.message} />}
      {emptyResult && <EmptyResult />}
    </div>
  )
}

export default NestedGroupsLister

/**
 * A form component for entering an email address to query nested group memberships.
 *
 * This form uses Zod for schema validation and react-hook-form for form management.
 * It validates that the email field is not empty and contains a valid email address.
 * Upon successful submission, it updates the query state with the input email.
 *
 * @param {Function} setQuery - A function to update the query state with the submitted email.
 */

function InputForm({ setQuery }) {
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
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  className={`mt-6 text-muted-foreground ${groupsStyles.searchBarWidth}`}
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
        <Button className={`${groupsStyles.buttonPadding} my-6`} type="submit">
          Go
        </Button>
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
    <div className={`${groupsStyles.roundBorder} w-full`}>
      <SearchIcon size={116} className="text-muted-foreground" />
      <h3>No hierarchy found</h3>
      <h5>The target may not be a member of any groups</h5>
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

function NestedGroupsTable({ groups }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Group</TableHead>
          <TableHead>Inherited via</TableHead>
          <TableHead>Membership type</TableHead>
          <TableHead className="text-right">Join timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups &&
          groups.map((group) => (
            <TableRow key={group.email}>
              <TableCell className="font-medium">{group.email}</TableCell>
              <TableCell>{group.inherited}</TableCell>
              <TableCell>{group.membership}</TableCell>
              <TableCell className="text-right">{group.timestamp}</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  )
}
