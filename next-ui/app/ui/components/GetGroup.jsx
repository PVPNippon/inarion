'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function GetGroup() {
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)
  const [inputValue, setInputValue] = useState('')
  const [group, setGroup] = useState(null)
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    const fetchGroup = async (req, res) => {
      try {
        if (inputValue === '') {
          return
        }

        const response = await axios.post(
          'http://localhost:4000/groups/get-group',
          // 'http://localhost:4000/groups/list-all-members',
          {
            userEmail: email,
            projectId: projectData.projectData.projectId,
            serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
            serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
            groupEmail: inputValue,
          },
          { withCredentials: true }
        )
        if (response.status === 200) {
          setGroup(response.data)
        }
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
      <div>{group && JSON.stringify(group)}</div>
    </div>
  )
}

export default GetGroup
