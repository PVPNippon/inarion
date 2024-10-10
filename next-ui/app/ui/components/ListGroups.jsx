'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'

function ListGroups() {
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)
  const [groupList, setGroupList] = useState([])
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    const fetchGroups = async (req, res) => {
      try {
        const response = await axios.post(
          'http://localhost:4000/groups/list-groups',
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
      }
    }
    fetchGroups()
  }, [clickCount])
  return (
    <div className="text-white">
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
