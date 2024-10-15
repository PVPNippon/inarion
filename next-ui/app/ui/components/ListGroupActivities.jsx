'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'

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
          // 'http://localhost:4000/groups/list-groups',
          'http://localhost:4000/groups/get-group-activity',
          // 'http://localhost:4000/groups/get-group-joined-activity',
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
