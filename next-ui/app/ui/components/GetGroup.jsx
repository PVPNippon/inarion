'use client'
import React, { useState, useEffect, useContext } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/utils/apiClient'

/**
 * A temporary component for dev purposes.
 * On click of button, fetch group details and display in div(error or group details)
 */
function GetGroup() {
  const { email } = useContext(LoggedInUserContext)
  const [inputValue, setInputValue] = useState('')
  const [group, setGroup] = useState(null)
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    const fetchGroup = async (req, res) => {
      try {
        if (inputValue === '') {
          return
        }
        console.log('fetching group...')

        const response = await apiClient(
          '/api/groups/get', // Endpoint path relative to API_BASE_URL
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
        setGroup(response)
      } catch (error) {
        console.error(error)
        setGroup({ error: error.message })
      }
    }
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
      {/* <div>{group && JSON.stringify(group)}</div> */}
      <div>{group && group}</div>
    </div>
  )
}

export default GetGroup
