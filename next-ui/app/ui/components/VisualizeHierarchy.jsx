'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function VisualizeHierarchy() {
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)
  const [inputValue, setInputValue] = useState('')
  const [groupList, setGroupList] = useState({
    nodes: [],
    edges: [],
  })
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchHierarchy = async (req, res) => {
      try {
        if (inputValue === '') {
          return
        }
        const response = await axios.post(
          'http://localhost:4000/groups/get-group-hierarchy',
          {
            userEmail: email,
            projectId: projectData.projectData.projectId,
            serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
            serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
            queryEmail: inputValue,
          },
          { withCredentials: true }
        )

        // if emtpy table is returned, set error 'No memberships found', otherwise set groupList
        if (response.status === 200) {
          response.data.length === 0
            ? setError({ message: 'No memberships found. Please check if the email address is correct and try again.' })
            : setGroupList(response.data)
        }
      } catch (error) {
        //if error is 404, set error 'Incorrect email address or you do not have access to this resource.',
        //otherwise set error returned by the server
        if (typeof error.response !== 'undefined' && error.response.status === 404) {
          setError({ message: 'Incorrect email address or you do not have access to this resource.' })
        } else {
          setError(error)
        }
      }
    }
    setError(null)
    setGroupList({
      nodes: [],
      edges: [],
    })
    fetchHierarchy()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6">Visualize Group Hierarchy</h1>
      <div className="flex w-full max-w-sm items-center space-x-2 mb-7">
        <Input
          className="text-black"
          type="email"
          name="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a group email address"
        />
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Go
        </Button>
      </div>
      <p>{error && error.message}</p>
      <div>{groupList && JSON.stringify(groupList)}</div>
    </div>
  )
}

export default VisualizeHierarchy
