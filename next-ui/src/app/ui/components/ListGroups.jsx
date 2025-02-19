'use client'
import React, { useState, useEffect, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/utils/apiClient'
import axios from 'axios'

/**
 * Temporary component for dev purposes.
 * On click of button, fetch groups and display in div (error or group list).
 */
function ListGroups() {
  const [groupList, setGroupList] = useState([])
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)
  let email

  useEffect(() => {
    const fetchGroups = async (req, res) => {
      if (clickCount === 0) {
        return
      }
      try {
        console.log('fetching groups...')

        // const response = await apiClient(
        //   '/api/groups/list', // Endpoint path relative to API_BASE_URL
        //   'POST', // HTTP method

        //   {
        //     userEmail: email,
        //   },
        //   {}, // Additional headers, if any
        //   true // withCredentials flag
        // )
        // //WARNING:if you need to use the response data as an array or object, you need to parse it with JSON.parse()
        // //I'm not doing it here because I only display the response data as is for now.
        // setGroupList(response)

        //Temporary bypass encryption
        email = window.localStorage.getItem('email')
        console.log('email:', email)
        //N.B.the token validity is 1 hour, when started getting the 401 error, sign out and sign in back
        const token = localStorage.getItem('jwtToken')
        console.log('TOKEN', token)

        const response = await axios.get(
          `http://localhost:4000/api/groups/?userEmail=${email}`,

          {
            headers: {
              Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            },
          }
        )

        if (response) setGroupList(response.data)
      } catch (error) {
        console.error(error)
        setError(error)
      }
    }
    setError(null)
    setGroupList([])
    fetchGroups()
  }, [clickCount])
  return (
    <div className="mt-6">
      <h1>Groups in your organization</h1>
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Check
        </Button>
      </div>
      <p>{error && error.message}</p>
      {/* <div>{groupList && groupList}</div> */}
      <div className="max-h-[500px] overflow-y-scroll my-2 border border-input">
        {groupList && JSON.stringify(groupList)}
      </div>
    </div>
  )
}

export default ListGroups
