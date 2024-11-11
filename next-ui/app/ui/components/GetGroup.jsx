'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Component that allows the user to enter a group email address and then
 * fetches the group's details from the Google Admin Directory API.
 *
 * The component renders an input field for the user to enter a group email
 * address, a button to trigger the API call, and a div to display the
 * fetched data as JSON.
 *
 * The component uses the `LoggedInUserContext` and the `ProjectDataContext`
 * to get the user's email and the project data.
 *
 * The component uses the `axios` library to make a POST request to the
 * backend API to fetch the group's details.
 *
 * The component uses the `useState` hook to store the input value, the group
 * details, and a counter to trigger the API call.
 *
 * The component uses the `useEffect` hook to fetch the group's details when
 * the user clicks the button.
 */
//a temporary component for dev purposes.
//on click of button, fetch group details and display in div(error or group details)
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
          'http://localhost:4000/api/groups/get',
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
