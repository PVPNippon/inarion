'use client'
import React, { useState, useEffect, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/utils/apiClient'
import axios from 'axios'

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
  let email

  useEffect(() => {
    const fetchMembers = async (req, res) => {
      try {
        if (inputValue === '') {
          return
        }

        // const response = await apiClient(
        //   '/api/groups/list-direct-members', // Endpoint path relative to API_BASE_URL
        //   'POST', // HTTP method
        //   {
        //     userEmail: email,
        //     groupEmail: inputValue,
        //   },
        //   {}, // Additional headers, if any
        //   true // withCredentials flag
        // )
        // //WARNING:if you need to use the response data as an array or object, you need to parse it with JSON.parse()
        // //I'm not doing it here because I only display the response data as is for now.
        // setMembers(response)

        //Temporary bypass encryption
        email = window.localStorage.getItem('email')
        console.log('email:', email)
        //N.B.the token validity is 1 hour, when started getting the 401 error, sign out and sign in back
        const token = localStorage.getItem('jwtToken')
        console.log('TOKEN', token)

        const response = await axios.get(
          `http://localhost:4000/api/groups/group/${inputValue}/members?userEmail=${email}`,

          {
            headers: {
              Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
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
