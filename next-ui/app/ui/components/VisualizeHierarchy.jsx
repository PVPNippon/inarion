'use client'
import React, { useState, useEffect, useContext } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/utils/apiClient'

/**
 * VisualizeHierarchy is a temporary React component for development purposes.
 * It is used to test the groups hierarchy visualizer backend code.
 *
 * The component allows users to input an email address and fetches
 * the hierarchy of groups associated with that address. The hierarchy
 * is displayed as a graph, which can be opened in a new window.
 *
 * The component utilizes the LoggedInUserContext to access the email
 * of the logged-in user and maintains state for the input value,
 * group list, click count, and error messages.
 *
 * Graph visualization options are defined within the component,
 * including layout, physics, and edge configurations.
 *
 * @component
 */
function VisualizeHierarchy() {
  //temporary component for dev purposes
  //used to test the groups hierarchy visualiser backend code
  const { email } = useContext(LoggedInUserContext)
  const [inputValue, setInputValue] = useState('')
  const [groupList, setGroupList] = useState({
    nodes: [],
    edges: [],
  })
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    /**
     * Fetches the hierarchy of groups for the given email address.
     *
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     *
     * @returns {Promise<void>} - Resolves when the group hierarchy is successfully fetched.
     * @throws {Error} - Throws an error if there is an issue with the API call or if the hierarchy cannot be fetched.
     */
    const fetchHierarchy = async (req, res) => {
      const oldGraph = localStorage.getItem('graph')
      if (oldGraph) localStorage.removeItem('graph')
      try {
        if (inputValue === '') {
          return
        }

        const response = await apiClient(
          '/api/groups/get-hierarchy', // Endpoint path relative to API_BASE_URL
          'POST', // HTTP method
          {
            userEmail: email,
            queryEmail: inputValue,
          },
          {}, // Additional headers, if any
          true // withCredentials flag
        )
        // if emtpy data is returned, set error 'No memberships found', otherwise set groupList
        if (response) {
          //I parse the response data to JSON because I need to do some manipulation with it before storing it in local storage
          //if in the future there is no need to manipulate the data anymore, you can omit this step and just store it as a string in the local storage
          const responseData = JSON.parse(response)

          if (responseData.length === 0) {
            setError({ message: 'No memberships found. Please check if the email address is correct and try again.' })
          } else {
            setGroupList(responseData)
            if (responseData.nodes && responseData.nodes.length > 0) {
              const graph = {
                graph: responseData,
                star: inputValue,
              }
              localStorage.setItem('graph', JSON.stringify(graph))
              window.open('/groups/hierarchy/graph', '_blank')
            }
          }
        }
      } catch (error) {
        setError(error)
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
          placeholder="Enter a group or user email address"
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
