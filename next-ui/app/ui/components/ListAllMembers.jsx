'use client'
import React, { useState, useEffect, useContext } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiCall } from '@/utils/securePayload'
import { apiClient } from '@/utils/apiClient'

/**
 * Component for listing all members of a group, both direct and nested.
 *
 * This component allows the user to enter a group's email address and fetches
 * the list of all members when the "Go" button is clicked. The members are
 * displayed in a div, and any errors encountered during the fetch operation
 * are also displayed.
 *
 * Contexts:
 * - Utilizes `LoggedInUserContext` to access the user's email.
 *
 * States:
 * - `inputValue`: Stores the group email address entered by the user.
 * - `members`: Stores the fetched list of members or error messages.
 * - `clickCount`: A counter to trigger the fetch operation.
 *
 * Side Effects:
 * - Uses `useEffect` to trigger the fetch of members whenever `clickCount` changes.
 *
 * API:
 * - Sends a POST request to `/api/groups/list-all-members` with the user's email
 *   and the group email to retrieve the list of members.
 *
 * @returns {JSX.Element} The rendered component for listing all group members.
 */
function ListAllMembers() {
  //a temporary component for dev purposes.
  //on click of button, fetch  all group's members and display in div(error or member list)
  const { email } = useContext(LoggedInUserContext)
  const [inputValue, setInputValue] = useState('')
  const [members, setMembers] = useState([])
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMembers = async (req, res) => {
      try {
        if (inputValue === '') {
          return
        }

        const response = await apiClient(
          '/api/groups/list-all-members', // Endpoint path relative to API_BASE_URL
          'POST', // HTTP method
          {
            userEmail: email,
            groupEmail: inputValue,
          },
          {}, // Additional headers, if any
          true // withCredentials flag
        )
        //WARNING:if you need to use the response data as an array or object, you need to parse it with JSON.parse()
        //I'm not doing it here because I only display the response data as is for now.
        setMembers(response)
      } catch (error) {
        console.error(error)
        setError(error)
      }
    }
    setError(null)
    setMembers([])
    fetchMembers()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6">All group's members, both direct and nested</h1>
      <div className="flex w-full max-w-sm items-center space-x-2 mb-7">
        <Input
          type="email"
          name="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a group email address"
          className="text-black"
        />
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Go
        </Button>
      </div>
      {/* <div>{members && JSON.stringify(members)}</div> */}
      <p>{error && error.message}</p>
      <div>{members && members}</div>
    </div>
  )
}

export default ListAllMembers
