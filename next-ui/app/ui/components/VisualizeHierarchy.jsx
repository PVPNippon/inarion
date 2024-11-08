'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Graph from 'react-graph-vis'

/**
 * Component that visualizes the hierarchical structure of a group or user's memberships.
 *
 * The component renders an input field for entering a group or user email address, a button
 * to trigger the API call, and a graph to display the hierarchical data. The graph uses
 * a hierarchical layout to represent nodes and edges.
 *
 * The component leverages the `LoggedInUserContext` and `ProjectDataContext` contexts
 * to access the user's email and project information.
 *
 * The component fetches the group hierarchy from the backend API when the user clicks
 * the "Go" button. It uses the `useState` hook to manage input values, group hierarchy
 * data, click count, and errors. The `useEffect` hook is utilized to make the API call
 * when the click count changes.
 *
 * If no memberships are found, or if there is an error, an appropriate error message is displayed.
 */
//temporary component for dev purposes
//used to test the groups hierarchy visualiser backend code
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

  const options = {
    layout: {
      improvedLayout: true,
      hierarchical: {
        enabled: true,
        levelSeparation: 150,
        nodeSpacing: 200,
        treeSpacing: 200,
        blockShifting: true,
        edgeMinimization: true,
        parentCentralization: true,
        direction: 'UD', // UD, DU, LR, RL
        sortMethod: 'directed', // hubsize, directed
      },
    },
    physics: {
      enabled: true,
      hierarchicalRepulsion: {
        nodeDistance: 200, // Put more distance between the nodes.
      },
      stabilization: true,
    },
    edges: {
      color: 'blue',
    },
    height: '1000px',
  }

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
      try {
        if (inputValue === '') {
          return
        }
        const response = await axios.post(
          'http://localhost:4000/api/groups/get-hierarchy',
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
          placeholder="Enter a group or user email address"
        />
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Go
        </Button>
      </div>
      <p>{error && error.message}</p>
      <div>{groupList && JSON.stringify(groupList)}</div>
      <Graph graph={groupList} options={options} />
    </div>
  )
}

export default VisualizeHierarchy
