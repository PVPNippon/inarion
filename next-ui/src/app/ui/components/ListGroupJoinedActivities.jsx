'use client'
import React, { useState, useEffect, useContext } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/utils/apiClient'

/**
 * A temporary component for dev purposes.
 * On click of button, fetch group's joined activities and display in div(error or activity list)
 * @returns {JSX.Element} - A JSX element containing a button and a div to display the activities.
 */
function ListGroupJoinedActivities() {
  const { email } = useContext(LoggedInUserContext)
  const [activityList, setActivityList] = useState([])
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchActivities = async (req, res) => {
      if (clickCount === 0) {
        return
      }
      try {
        const response = await apiClient(
          '/api/groups/get-joined-activity', // Endpoint path relative to API_BASE_URL
          'POST', // HTTP method
          {
            userEmail: email,
          },
          {}, // Additional headers, if any
          true // withCredentials flag
        )
        //WARNING:if you need to use the response data as an array or object, you need to parse it with JSON.parse()
        //I'm not doing it here because I only display the response data as is for now.
        setActivityList(response)
      } catch (error) {
        console.error(error)
        setError(error)
      }
    }
    setError(null)
    setActivityList([])
    fetchActivities()
  }, [clickCount])
  return (
    <div className="my-6">
      <h1>Groups joining activities in your organization for past 6 months</h1>
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Check
        </Button>
      </div>
      {/* <div>{activityList && JSON.stringify(activityList)}</div> */}
      <p>{error && error.message}</p>
      <div>{activityList && activityList}</div>
    </div>
  )
}

export default ListGroupJoinedActivities
