'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'

/**
 * Function ListGroupsActivities
 *
 * This function fetches activities related to groups in the organization for the past 6 months.
 * It uses the user's email, project data, and click count to trigger the API call.
 * The API endpoint 'http://localhost:4000/groups/get-group-activity' is used to fetch the data.
 * If an error occurs during the API call, it logs the error and updates the activity list with an error message.
 */
//a temporary component for dev purposes.
//on click of button, fetch group's activities and display in div(error or activity list)
function ListGroupsActivities() {
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
          'http://localhost:4000/api/groups/get-activity',
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
      <h1>Groups Activities in your organization for past 6 months</h1>
      <p>
        NB: these logs are for 'enterprise_groups' only. 'groups' are not included. Tell Maria if you want to include
        'groups'
      </p>
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Check
        </Button>
      </div>
      <div>{activityList && JSON.stringify(activityList)}</div>
    </div>
  )
}

export default ListGroupsActivities
