'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'

/**
 * Component that lists all groups in the organization.
 *
 * The component fetches the list of groups when the user clicks the "Check" button.
 *
 * The component displays the list of groups as a JSON object.
 *
 * The component expects the following props:
 * - `email`: the user's email address (from `LoggedInUserContext`)
 * - `projectData`: the project data (from `ProjectDataContext`)
 *
 * The component uses the `useEffect` hook to fetch the list of groups when the user clicks the button.
 * It uses the `useState` hook to store the list of groups and a counter to trigger the API call.
 */
//a temporary component for dev purposes.
//on click of button, fetch groups and display in div(error or group list)
function ListGroups() {
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)
  const [groupList, setGroupList] = useState([])
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    const fetchGroups = async (req, res) => {
      if (clickCount === 0) {
        return
      }
      try {
        const response = await axios.post(
          'http://localhost:4000/api/groups/list',
          {
            userEmail: email,
            projectId: projectData.projectData.projectId,
            serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
            serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
          },
          { withCredentials: true }
        )
        setGroupList(response.data)
      } catch (error) {
        console.error(error)
        setGroupList([{ error: error.message }])
      }
    }
    fetchGroups()
  }, [clickCount])
  return (
    <div className="text-white mt-6">
      <h1>Groups in your organization</h1>
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Check
        </Button>
      </div>
      <div>{groupList && JSON.stringify(groupList)}</div>
    </div>
  )
}

export default ListGroups
