'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function ListDirectMembers() {
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)
  const [inputValue, setInputValue] = useState('')
  const [members, setMembers] = useState([])
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    const fetchMembers = async (req, res) => {
      try {
        if (inputValue === '') {
          return
        }

        const response = await axios.post(
          'http://localhost:4000/groups/list-direct-members',
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
          setMembers(response.data)
        }
      } catch (error) {
        console.error(error)
        setMembers([{ error: error.message }])
      }
    }
    setMembers([])
    fetchMembers()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6">Group's direct members</h1>
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
      <div>{members && JSON.stringify(members)}</div>
    </div>
  )
}

export default ListDirectMembers
