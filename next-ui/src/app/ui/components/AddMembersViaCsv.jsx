'use client'
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function AddMembersViaCsv() {
  const email = 'testadmin@pvp-test-domain2.com'
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState(null)
  const [data, setData] = useState([])
  const [clickCount, setClickCount] = useState(0)
  const [additionResult, setAdditionResult] = useState(null)

  useEffect(() => {
    setError(null)
    setAdditionResult(null)
    const sendRequest = async (req, res) => {
      try {
        if (inputValue === '' || data.length === 0) {
          return
        }
        const response = await axios.post(
          `http://localhost:4000/api/groups/group/${inputValue}/members?userEmail=${email}`,
          { memberEmails: data },
          {
            headers: {
              //  Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            },
          }
        )
        console.log('RESPONSE FROM BE', response)
        setAdditionResult(response.data)
        setData([])
        document.getElementById('add-members-csv-out').innerHTML = ''
        document.getElementById('add-members-csv-input').value = ''
      } catch (error) {
        console.error(error)
        setError(error.message)
      }
    }

    sendRequest()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="mt-6 mb-3 font-semibold">Add members by CSV</h1>
      <div className="text-red-500 mb-3">
        Warning: no exponential backoff yet. You risk hitting the rate limit when adding more than 200 members at
        once(depending on current usage, it could be much less).
      </div>
      <small className="text-orange-700">
        The CSV file should contain a list of member email addresses, no header row, all addresses in column A.
      </small>
      <div className="flex w-full max-w-3xl items-center space-x-2 mb-7 mt-3">
        <Input
          type="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a group email address"
          className="text-black"
        />
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Add members
        </Button>
      </div>

      <div className="flex">
        <input
          accept=".csv"
          id="add-members-csv-input" //N.B. the id must be unique or it will clash with other compoments
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
              document.getElementById('add-members-csv-out').innerHTML = reader.result
              setData(results)
            }
            // start reading the file. When it is done, calls the onload event defined above.

            reader.readAsText(document.getElementById('add-members-csv-input').files[0])
          }}
          type="file"
        />
        <pre id="add-members-csv-out">
          <p>File contents will appear here</p>
        </pre>
      </div>
      <div>{additionResult && JSON.stringify(additionResult)}</div>
      <div>{error && <p>{error}</p>}</div>
    </div>
  )
}
export default AddMembersViaCsv
