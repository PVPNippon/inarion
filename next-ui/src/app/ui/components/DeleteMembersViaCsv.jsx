'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Component for deleting multiple members from a group via a CSV file.
 *
 * This component allows the user to enter a group email address and upload a CSV file
 * containing the email addresses of members to be deleted from that group. The deletion
 * request is triggered when the user clicks the "Delete Members" button.
 *
 * The component utilizes the `LoggedInUserContext` and `ProjectDataContext` to access
 * the user's email and project data.
 *
 * States:
 * - `inputValue`: The email address of the group.
 * - `error`: Any error message encountered during the deletion process.
 * - `data`: An array of member emails retrieved from the uploaded CSV file.
 * - `clickCount`: A counter to trigger the deletion request.
 * - `deletionResult`: The result of the deletion request.
 *
 * Side Effects:
 * - Uses `useEffect` to send a deletion request whenever `clickCount` changes.
 * - Displays file contents and deletion results within the component.
 *
 * API:
 * - Sends a DELETE request to `http://localhost:4000/api/groups/delete-members` with the
 *   necessary credentials and data.
 *
 * @returns {JSX.Element} The rendered component for deleting members via CSV.
 */
//Important: This component is for dev purposes and by no means it's final or thoughrougly tested
//I keep it here in case some logic can be reused, and also for testing purposes
function DeleteMembersViaCsv() {
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState(null)
  const [data, setData] = useState([])
  const [clickCount, setClickCount] = useState(0)
  const [deletionResult, setDeletionResult] = useState(null)

  useEffect(() => {
    setError(null)
    setDeletionResult(null)
    const sendRequest = async (req, res) => {
      try {
        if (inputValue === '' || data.length === 0) {
          return
        }
        const response = await axios.delete(
          'http://localhost:4000/api/groups/delete-members',
          {
            data: {
              userEmail: email,
              projectId: projectData.projectData.projectId,
              serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
              serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
              groupEmail: inputValue,
              memberEmails: data,
            },
          },
          { withCredentials: true }
        )
        setDeletionResult(response.data)
        setData([])
        document.getElementById('out').innerHTML = ''
        document.getElementById('csvInput').value = ''
      } catch (error) {
        console.error(error)
        setError(error.message)
      }
    }

    sendRequest()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6">Delete multiple members from a group by CSV</h1>
      <div className="flex w-full max-w-3xl items-center space-x-2 mb-7">
        <Input
          type="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a group email address"
          className="text-black"
        />
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Delete Members
        </Button>
      </div>

      <div className="flex">
        <input
          accept=".csv"
          id="csvInput" //N.B. the id must be unique or it will clash with other compoments
          onChange={() => {
            const reader = new FileReader()

            /**
             * Handles the file loading process. It reads the CSV file data, splits the content by new lines,
             * filters out any empty lines, updates the inner HTML of the element with id 'out' to display the raw CSV content,
             * and sets the filtered results to the state using setData.
             */
            reader.onload = () => {
              let results = reader.result.split('\r\n')
              results = results.filter((item) => item !== '')
              document.getElementById('out').innerHTML = reader.result
              setData(results)
            }
            // start reading the file. When it is done, calls the onload event defined above.

            reader.readAsText(document.getElementById('csvInput').files[0])
          }}
          type="file"
        />
        <pre id="out">
          <p>File contents will appear here</p>
        </pre>
      </div>
      <div>{deletionResult && JSON.stringify(deletionResult)}</div>
      <div>{error && <p>{error}</p>}</div>
    </div>
  )
}

export default DeleteMembersViaCsv
