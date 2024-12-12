'use client'
import React, { useState, useEffect, useContext } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiClient } from '@/utils/apiClient'

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
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMembership = async (req, res) => {
      try {
        //if user clicks the button, but input is empty, return
        if (inputValue === '') {
          return
        }

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
          responseData.length === 0
            ? setError({ message: 'No memberships found. Please check if the email address is correct and try again.' })
            : setGroupList(responseData)
        }
      } catch (error) {
        setError(error)
      }
    }
    setError(null)
    setGroupList([])
    fetchMembership()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6">Nested Group Membership</h1>
      <div className="flex w-full max-w-sm items-center space-x-2 mb-7">
        <Input
          className="text-black"
          type="email"
          name="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a group or user email address"
        />
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Go
        </Button>
      </div>
      <p>{error && error.message}</p>
      <Table>
        <TableCaption>A list of direct and indirect parents/grandparents for the target group or user.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Group</TableHead>
            <TableHead>Inherited via</TableHead>
            <TableHead>Membership type</TableHead>
            <TableHead className="text-right">Join timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupList &&
            groupList.map((group) => (
              <TableRow key={group.email}>
                <TableCell className="font-medium">{group.email}</TableCell>
                <TableCell>{group.inherited}</TableCell>
                <TableCell>{group.membership}</TableCell>
                <TableCell className="text-right">{group.timestamp}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default NestedGroupsLister
