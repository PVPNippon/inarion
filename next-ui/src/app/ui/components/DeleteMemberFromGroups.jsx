'use client'
import React, { useState, useEffect } from 'react'
import axios from 'axios'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Component for deleting a member from multiple groups using a CSV file.
 *
 * This component allows the user to enter a member's email address and upload a CSV file
 * containing the email addresses of groups from which the member should be removed. The
 * deletion request is triggered when the user clicks the "Delete Member" button.
 *
 * The component utilizes the `LoggedInUserContext` and `ProjectDataContext` to access
 * the user's email and project data.
 *
 * States:
 * - `inputValue`: The email address of the member to be deleted.
 * - `error`: Any error message encountered during the deletion process.
 * - `data`: An array of group emails retrieved from the uploaded CSV file.
 * - `clickCount`: A counter to trigger the deletion request.
 * - `deletionResult`: The result of the deletion request.
 *
 * Side Effects:
 * - Uses `useEffect` to send a deletion request whenever `clickCount` changes.
 * - Displays file contents and deletion results within the component.
 *
 * API:
 * - Sends a DELETE request to `http://localhost:4000/api/groups/delete-member-from-groups`
 *   with the necessary credentials and data.
 *
 * @returns {JSX.Element} The rendered component for deleting a member from multiple groups.
 */
//Important: This component is for dev purposes and by no means it's final or thoughrougly tested
//I keep it here in case some logic can be reused, and also for testing purposes
function DeleteMemberFromGroups() {
  const email = 'testadmin@pvp-test-domain2.com'
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
          `http://localhost:4000/api/groups/members/member/${inputValue}/?userEmail=${email}`,
          {
            headers: {
              //  Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            },
            data: { groupEmails: data },
          }
        )
        console.log('RESPONSE FROM BE', response)
        setDeletionResult(response.data)
        setData([])
        document.getElementById('out2').innerHTML = ''
        document.getElementById('csvInput2').value = ''
      } catch (error) {
        console.error(error)
        setError(error.message)
      }
    }

    sendRequest()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6">Delete a member from multiple groups by CSV</h1>
      <div className="flex w-full max-w-3xl items-center space-x-2 mb-7">
        <Input
          type="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a member email address"
          className="text-black"
        />
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Delete Member
        </Button>
      </div>

      <div className="flex gap-x-11">
        <Input
          className="w-[200px]"
          accept=".csv"
          id="csvInput2" //N.B. the id must be unique or it will clash with other compoments
          onChange={() => {
            const reader = new FileReader()

            /**
             * Handles the file loading process. It reads the CSV file data, splits the content by new lines,
             * filters out any empty lines, updates the inner HTML of the element with id 'out2' to display the raw CSV content,
             * and sets the filtered results to the state using setData.
             */
            reader.onload = () => {
              let results = reader.result.split('\r\n')
              results = results.filter((item) => item !== '')
              document.getElementById('out2').innerHTML = reader.result
              setData(results)
            }
            // start reading the file. When it is done, calls the onload event defined above.

            reader.readAsText(document.getElementById('csvInput2').files[0])
          }}
          type="file"
        />
        <pre id="out2">
          <p>File contents will appear here</p>
        </pre>
      </div>
      <div>{deletionResult && JSON.stringify(deletionResult)}</div>
      <div>{error && <p>{error}</p>}</div>
    </div>
  )
}

export default DeleteMemberFromGroups
