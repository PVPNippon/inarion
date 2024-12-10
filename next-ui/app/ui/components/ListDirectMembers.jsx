'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/utils/apiClient'
import { serviceAccountPrivateKey } from '@/utils/keys'

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

        // const response = await axios.post(
        //   'http://localhost:4000/api/groups/list-direct-members',
        //   {
        //     userEmail: email,
        //     projectId: projectData.projectData.projectId,
        //     serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
        //     serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
        //     groupEmail: inputValue,
        //   },
        //   { withCredentials: true }
        // )

        const response = await apiClient(
          '/api/groups/list-direct-members', // Endpoint path relative to API_BASE_URL
          'POST', // HTTP method
          // {
          //   userEmail: email,
          //   projectId: projectData.projectData.projectId,
          //   serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
          //   serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
          // },
          {
            userEmail: 'testadmin@pvp-test-domain2.com',
            projectId: '',
            serviceAccountEmail: 'testadmin-pvp-test12-work@project-1725519589587.iam.gserviceaccount.com',
            // serviceAccountPrivateKey:
            //   '***REMOVED***E5FbmtDZ1lFQXQwVHR5R2NVSEVmWmhDWmt0TGhlRDh1UHIvNnYvWGFvajRiMlxuaEdPZVRrNnF3MjlFcFRJUkhHd3RKVUhkN1FmS1R1dlNSOG95OVJRWk1uYzQxSkR1bElOQ2NBcmhxUUM1cEI3cVxuNU5XSnhkc0NYcWtrTjB6ZFk2d2xCK0g3U3FTNW13dVNNMEUrTXZiUVJXN3lPbC9rK1p5YUxIR0NVaitlb0k5alxuRkpncjQxa0NnWUEzMGMwUG5zaFhkT2Vzb3ZxT2JlY05tRkF3ZFlYODAzZ25idXlyWm5wRi9MNDhMWTBGVUhRL1xuam1RQkUrM1p6MkM4UzJsb0ZNTGV0dDJhYis5dWdXbXl3TFZYVkdzMFRjOVIvWG5GY2lQeWFTVWtnWENQZTAxb1xuRUtBM2s3bi8vdlF1c0krZXJOeTVkQ2wvR2hWWGlESzN6dS9JeXJ2U251YTcrQWtqckwyNzJRS0JnUUNiUjZQUVxuOE1WeFVNOVQwTlB5NjJPSExvcUlLOXNoZnJCREs2OGpiT1JzcE9xNnZFUUZVKzU3am95UnpNVWtXRDFwc1JWeVxuRGpndXZ1QzZpWmwxUVhka0RmTDB5OE4zVmszMGFOM05GY0N1QzJwdW1oRTlhYnNMQUlnL3JaRWxKWHk5aVloT1xuTlRGbUxRazZTMDZoZHk2aTc3VVJndnRRaE9iNlU0TTNwOWRId1FLQmdIZG1mNkt4RXdMcFhLUjhENWlIeklZdlxuUHducm93VTdMdjJSYzdPKzBFWUlKU21FQy8vQTJwK0N4NmlUbnk1Z1pRZ2hKem5sVHMvc01oNkU0MzFrVGdQSFxuOVdUU3BHOU8rclhlNWNoZWw2Q1EvV2VBUWNtV0M2RTBlSWt3bXFEeTlkTFpaTTYxNEZ5YkFBdGdZTURpRUl0blxubTM4UGFaendIendaZlpyT2NHQVJcbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJ0ZXN0YWRtaW4tcHZwLXRlc3QxMi13b3JrQHByb2plY3QtMTcyNTUxOTU4OTU4Ny5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMDUzNTQ2MzA5MTU3MDIzODUxODIiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L3Rlc3RhZG1pbi1wdnAtdGVzdDEyLXdvcmslNDBwcm9qZWN0LTE3MjU1MTk1ODk1ODcuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K',
            serviceAccountPrivateKey: serviceAccountPrivateKey,

            groupEmail: inputValue,
          },
          {}, // Additional headers, if any
          true // withCredentials flag
        )
        setMembers(response)

        // if (response.status === 200) {
        //   setMembers(response.data)
        // }
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
      {/* <div>{members && JSON.stringify(members)}</div> */}
      <div>{members && members}</div>
    </div>
  )
}

export default ListDirectMembers
