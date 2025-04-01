'use client'
import React, { useState, useEffect, useContext } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
//import { apiClient } from '@/utils/apiClient'
import axios from 'axios'

/**
 * A temporary component for dev purposes.
 * On click of button, fetch group details and display in div(error or group details)
 */
function GetGroup() {
  const [inputValue, setInputValue] = useState('')
  const [group, setGroup] = useState(null)
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)
  let email

  useEffect(() => {
    const fetchGroup = async (req, res) => {
      try {
        if (inputValue === '') {
          return
        }
        console.log('fetching group...')

        // const response = await apiClient(
        //   '/api/groups/get', // Endpoint path relative to API_BASE_URL
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
        // setGroup(response)

        //Temporary bypass encryption
        //getting email and token from local storage is a temporary measure, will change in the future
        // email = window.localStorage.getItem('email')
        // console.log('email:', email)
        email = 'testadmin@pvp-test-domain2.com'

        //N.B.the token validity is 1 hour, when started getting the 401 error, sign out and sign in back
        // const token = localStorage.getItem('jwtToken')
        // console.log('TOKEN', token)

        const response = await axios.get(
          `http://localhost:4000/api/groups/group/${inputValue}/?userEmail=${email}`,

          {
            headers: {
              // Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            },
          }
        )

        if (response) setGroup(response.data)
      } catch (error) {
        console.error(error)
        setError(error)
      }
    }
    setError(null)
    setGroup(null)
    fetchGroup()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6">Group's details</h1>
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
      <div className="border border-input">{group && JSON.stringify(group)}</div>
      <p>{error && error.message}</p>
      {/* <div>{group && group}</div> */}
    </div>
  )
}

export default GetGroup
