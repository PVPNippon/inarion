'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Component that allows the user to enter a group email address and fetch the list of its direct members.
 *
 * The component displays the list of direct members as a JSON object.
 *
 * The component uses the `LoggedInUserContext` and `ProjectDataContext` contexts to access the user's email and project data.
 *
 * The component uses the `useState` hook to store the input value, the list of direct members, and a counter to trigger the API call.
 *
 * The component uses the `useEffect` hook to fetch the list of direct members when the user clicks the "Go" button.
 */
//a temporary component for dev purposes.
//on click of button, fetch group's direct members and display in div(error or member list)
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
