'use client'
import React, { useState, useEffect, useContext } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiClient } from '@/utils/apiClient'
import { ExternalLinkIcon } from 'lucide-react'
import { groupsStyles } from '../../(dashboard)/groups/groups-styles'

/**
 * Component that displays a list of all groups that a given group or user is a
 * member of, either directly or indirectly.
 *
 * The component takes in a string input, which is the email address of the
 * group or user to query. When the user clicks the "Go" button, the component
 * fetches the list of all groups that the target group or user is a member of,
 * including both direct and indirect memberships.
 *
 * The component displays the list of groups in a table, with columns for the
 * group email, the type of membership (direct or indirect), and the timestamp
 * of when the membership was created.
 */
//a temporary component for dev purposes.
//displays a list of groups that a given group or user is a member of
function NestedGroupsLister() {
  //a temporary component for dev purposes.
  //displays a list of groups that a given group or user is a member of
  const { email } = useContext(LoggedInUserContext)
  const [inputValue, setInputValue] = useState('')
  const [groupList, setGroupList] = useState([])
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emptyResult, setEmptyResult] = useState(false)

  useEffect(() => {
    async function fetchMembership() {
      try {
        //if user clicks the button, but input is empty, return
        if (inputValue === '') {
          return
        }

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
            queryEmail: inputValue,
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
  }, [clickCount])
  return (
    <div className="mx-8 mb-6">
      <p className="mb-3.5 text-2xl font-medium leading-7">Nested Group Membership</p>
      <p className=" text-lg text-muted-foreground mb-3 leading-5">View the ancestry of a group or user</p>
      <div style={groupsStyles.secondaryChart5} className="flex text-xs gap-x-1">
        <span>Learn how it works</span>
        {/* TODO(maria): replace the link below with the actual link */}
        <a href="http://localhost:3000/groups" target="_blank">
          <ExternalLinkIcon size={14} />
        </a>
      </div>
      {/* Search bar and button */}
      <div className="mb-8">
        <Input
          style={groupsStyles.searchBarWidth}
          className="my-6 text-muted-foreground"
          type="email"
          name="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a group or user email address"
          hasIcon={true}
        />
        <Button className={groupsStyles.buttonPadding} onClick={() => setClickCount((x) => x + 1)} type="submit">
          Go
        </Button>
      </div>
      {isLoading && <Loader />}
      {!isLoading && !error && groupList.length > 0 && <NestedGroupsTable groups={groupList} />}
      {error && <ErrorMessage message={error.message} />}
      {emptyResult && <EmptyResult />}
    </div>
  )
}

export default NestedGroupsLister

function Loader() {
  return <p>Loading...</p>
}

function ErrorMessage({ message }) {
  return <p>{message}</p>
}

function EmptyResult() {
  return (
    <>
      <h3>No hierarchy found</h3>
      <h5>The target may not be a member of any groups</h5>
    </>
  )
}

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
