'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
//import { apiClient } from '@/utils/apiClient'
import axios from 'axios'
const email = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL //temporarily bypass login and jwttoken check

/**
 * A temporary component for dev purposes.
 * On click of button, fetch group's direct members and display in div(error or member list)
 *
 * States:
 * - `inputValue`: Stores the group email address entered by the user.
 * - `members`: Stores the fetched list of direct members or error messages.
 * - `clickCount`: A counter to trigger the fetch operation.
 *
 * Side Effects:
 * - Uses `useEffect` to trigger the fetch of direct members whenever `clickCount` changes.
 *
 * API:
 * - Sends a POST request to `/api/groups/list-direct-members` with the user's email and the group email to retrieve the list of direct members.
 *
 * @returns {JSX.Element} The rendered component for listing direct members.
 */
function ListDirectMembers() {
  //a temporary component for dev purposes.
  //on click of button, fetch group's direct members and display in div(error or member list)
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

        const response = await axios.get(
          `http://localhost:4000/api/groups/group/${inputValue}/members?userEmail=${email}`,

          {
            headers: {
              // Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            },
          }
        )

        if (response) setMembers(response.data)
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
      <h1 className="my-6">Group's direct members</h1>
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
      <div className="max-h-[500px] overflow-y-scroll my-2 border border-input">
        {members && JSON.stringify(members)}
      </div>
      <p>{error && error.message}</p>
      {/* <div>{members && members}</div> */}
    </div>
  )
}

export default ListDirectMembers
