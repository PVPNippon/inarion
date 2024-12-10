'use client'
import React, { useState, useEffect, useContext } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/utils/apiClient'

/**
 * Temporary component for dev purposes.
 * On click of button, fetch groups and display in div (error or group list).
 */
function ListGroups() {
  const { email } = useContext(LoggedInUserContext)
  const [groupList, setGroupList] = useState([])
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    const fetchGroups = async (req, res) => {
      if (clickCount === 0) {
        return
      }
      try {
        console.log('fetching groups...')
        const response = await apiClient(
          '/api/groups/list', // Endpoint path relative to API_BASE_URL
          'POST', // HTTP method

          {
            userEmail: email,
          },
          {}, // Additional headers, if any
          true // withCredentials flag
        )
        //WARNING:if you need to use the response data as an array or object, you need to parse it with JSON.parse()
        //I'm not doing it here because I only display the response data as is for now.
        setGroupList(response)
      } catch (error) {
        console.error(error)
        setGroupList([{ error: error.message }])
      }
    }
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
      <div>{groupList && groupList}</div>
    </div>
  )
}

export default ListGroups
