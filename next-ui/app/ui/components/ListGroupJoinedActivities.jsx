'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'

/**
 * Component that fetches the list of groups joined by users in the organization for the past 6 months.
 *
 * The component renders a button labeled "Check" and a div to display the fetched data as JSON.
 *
 * The component uses the `LoggedInUserContext` and the `ProjectDataContext` to get the user's email and the project data.
 *
 * The component uses the `useState` hook to store the list of activities and a counter to trigger the API call.
 *
 * The component uses the `useEffect` hook to fetch the list of activities when the user clicks the button.
 */
//a temporary component for dev purposes
//on click of button, fetch group's joinedactivities and display in div(error or activity list)
function ListGroupJoinedActivities() {
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)
  const [activityList, setActivityList] = useState([])
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    const fetchActivities = async (req, res) => {
      if (clickCount === 0) {
        return
      }
      try {
        const response = await axios.post(
          'http://localhost:4000/api/groups/get-joined-activity',
          {
            userEmail: email,
            projectId: projectData.projectData.projectId,
            serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
            serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
          },
          { withCredentials: true }
        )
        setActivityList(response.data)
      } catch (error) {
        console.error(error)
        setActivityList([{ error: error.message }])
      }
    }
    fetchActivities()
  }, [clickCount])
  return (
    <div className="text-white my-6">
      <h1>Groups joining activities in your organization for past 6 months</h1>
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Check
        </Button>
      </div>
      <div>{activityList && JSON.stringify(activityList)}</div>
    </div>
  )
}

export default ListGroupJoinedActivities
