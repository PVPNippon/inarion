'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/utils/apiClient'
import axios from 'axios'
import CsvDownloadButton from 'react-json-to-csv'

/**
 * Component for creating a single group.
 *
 * This component allows the user to input a single group email address.
 * When the "Go" button is clicked, the component sends a POST request to the server with the provided email address.
 * The server then creates the group and returns the results which are then displayed in the component.
 *
 * States:
 * - `inputValue`: The email address of the group to be created.
 * - `group`: The result of the group creation operation returned from the server.
 * - `clickCount`: A counter used to trigger the group creation operation.
 * - `error`: Any error message encountered during the group creation process.
 *
 * Side Effects:
 * - Uses `useEffect` to send a group creation request whenever `clickCount` changes.
 * - Displays file contents and creation results within the component.
 *
 * API:
 * - Sends a POST request to `http://localhost:4000/api/groups/?userEmail=${email}`
 *   with the necessary credentials and data.
 *
 * @returns {JSX.Element} The rendered component for creating a single group.
 */
export function CreateGroup() {
  const [inputValue, setInputValue] = useState('')
  const [group, setGroup] = useState(null)
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)
  let email

  useEffect(() => {
    const createGroup = async (req, res) => {
      try {
        if (inputValue === '') {
          return
        }
        email = 'testadmin@pvp-test-domain2.com'
        const response = await axios.post(
          `http://localhost:4000/api/groups/?userEmail=${email}`,

          {
            groupEmails: [inputValue],
          },
          {
            headers: {
              // Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            },
          }
        )

        if (response) setGroup(response.data)
      } catch (error) {
        console.error(error)
        setError(error)
      } finally {
        setInputValue('')
      }
    }
    setError(null)
    setGroup(null)
    createGroup()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6">Greate group</h1>
      <div>Input a group email address in full(subdomain OK).</div>
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
      <p>{error && error.message}</p>
    </div>
  )
}

/**
 * Component for creating multiple groups using a CSV file.
 *
 * This component allows the user to upload a CSV file containing a list of group email addresses.
 * When the "Go" button is clicked, the component sends a POST request to the server with the list
 * of group email addresses. The server then creates the groups and returns the results which are then
 * displayed in the component.
 *
 * States:
 * - `data`: An array of group email addresses retrieved from the uploaded CSV file.
 * - `group`: The results of the group creation operation returned from the server.
 * - `clickCount`: A counter used to trigger the group creation operation.
 * - `error`: Any error message encountered during the group creation process.
 * - `loading`: A boolean indicating whether the group creation operation is in progress.
 *
 * Side Effects:
 * - Uses `useEffect` to trigger the group creation operation whenever `clickCount` changes.
 *
 * API:
 * - Sends a POST request to `http://localhost:4000/api/groups/?userEmail=${email}`
 *   with the list of group email addresses.
 *
 * @returns {JSX.Element} The rendered component for creating multiple groups using a CSV file.
 */
export function CreateGroupsByCsv() {
  const [data, setData] = useState([])
  const [group, setGroup] = useState(null)
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [failedGroups, setFailedGroups] = useState([])
  let email

  useEffect(() => {
    const createGroups = async (req, res) => {
      try {
        if (data.length === 0) return
        setLoading(true)
        email = 'testadmin@pvp-test-domain2.com'
        const response = await axios.post(
          `http://localhost:4000/api/groups/?userEmail=${email}`,

          {
            groupEmails: data,
          },
          {
            headers: {
              // Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            },
          }
        )

        if (response) {
          console.log('response data', response.data)
          setGroup(response.data)
          if (response.data.uncreatedGroups.length > 0) {
            const csvData = response.data.uncreatedGroups.map((group) => {
              const obj = {
                email: group.email,
              }
              return obj
            })
            setFailedGroups(csvData)
          }
        }
      } catch (error) {
        console.error(error)
        setError(error)
      } finally {
        setLoading(false)
      }
    }
    setError(null)
    setGroup(null)
    createGroups()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6 font-semibold">Create groups by CSV</h1>
      <div className="flex space-x-2 items-center mb-3">
        <div>Upload a CSV file and then click →</div>
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Go
        </Button>
      </div>
      <small className="text-orange-700">
        The CSV file should contain a list of group email addresses(subdomain OK), no header row, all addresses in
        column A.
      </small>
      <div className="flex w-full max-w-sm items-center space-x-2 mb-7 mt-3">
        <div className="flex">
          <input
            accept=".csv"
            id="create-groups-csv-input" //N.B. the id must be unique or it will clash with other compoments
            onChange={() => {
              const reader = new FileReader()

              /**
               * Handles the file loading process. It reads the CSV file data, splits the content by new lines,
               * filters out any empty lines, updates the inner HTML of the element with id 'out2' to display the raw CSV content,
               * and sets the filtered results to the state using setData.
               */
              reader.onload = () => {
                let results = reader.result.split('\r\n')
                results = results
                  .filter((item) => item !== '' && item !== 'email' && typeof item === 'string')
                  .map((item) => item.trim().replace(/"/g, ''))
                document.getElementById('create-groups-csv-out').innerHTML = reader.result
                setData(results)
              }
              // start reading the file. When it is done, calls the onload event defined above.
              reader.readAsText(document.getElementById('create-groups-csv-input').files[0])
            }}
            type="file"
          />
          <pre id="create-groups-csv-out">
            <p>File contents will appear here</p>
          </pre>
        </div>
      </div>
      {loading && <div className="loader items-center justify-center"></div>}
      <div>{group && JSON.stringify(group.message)}</div>
      <p>{error && error.message}</p>
      {failedGroups.length > 0 && (
        <CsvDownloadButton data={failedGroups} filename="failed-groups">
          <div className="text-red-500 my-3">Download failed groups as csv</div>
        </CsvDownloadButton>
      )}
    </div>
  )
}

/**
 * Component for creating multiple groups with serial numbers using a single email address.
 *
 * This component allows the user to input a group email base and the number of groups to be created.
 * Upon clicking the "Go" button, it triggers the creation of groups using the provided email base and the number of groups.
 *
 * States:
 * - `inputValue`: The email base to create groups.
 * - `nrOfGroups`: The number of groups to be created.
 * - `group`: Stores the response data indicating the result of the group creation process.
 * - `clickCount`: A counter to trigger the group creation request.
 * - `error`: Any error message encountered during the group creation process.
 * - `loading`: A boolean indicating if the group creation request is in progress.
 * - `failedGroups`: An array of groups that failed to be created.
 *
 * Side Effects:
 * - Uses `useEffect` to send a group creation request whenever `clickCount` changes.
 * - Displays file contents and creation results within the component.
 *
 * API:
 * - Sends a POST request to `http://localhost:4000/api/groups/` with the necessary credentials and data.
 *
 * @returns {JSX.Element} The rendered component for creating multiple groups with serial numbers.
 */
export function CreateGroupsWithSerialNumbers() {
  const [inputValue, setInputValue] = useState('')
  const [nrOfGroups, setNrOfGroups] = useState(10)
  const [group, setGroup] = useState(null)
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [failedGroups, setFailedGroups] = useState([])
  let email

  function serialEmails(nrOfGroups, inputValue) {
    let emails = []
    for (let i = 1; i <= nrOfGroups; i++) {
      emails.push(inputValue + i + '@pvp-test-domain2.com')
    }
    return emails
  }

  useEffect(() => {
    const createGroups = async (req, res) => {
      setGroup(null)
      setFailedGroups([])
      if (inputValue === '' || nrOfGroups < 1) return
      if (confirm(`Are you sure you want to create ${nrOfGroups} groups with email base ${inputValue}?`)) {
        setLoading(true)
        try {
          email = 'testadmin@pvp-test-domain2.com'
          const data = serialEmails(nrOfGroups, inputValue)

          const response = await axios.post(
            `http://localhost:4000/api/groups/?userEmail=${email}`,

            {
              groupEmails: data,
            },
            {
              headers: {
                // Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
              },
            }
          )

          if (response) {
            console.log('response data', response.data)
            setGroup(response.data)
            if (response.data.uncreatedGroups.length > 0) {
              const csvData = response.data.uncreatedGroups.map((group) => {
                const obj = {
                  email: group.email,
                }
                return obj
              })
              setFailedGroups(csvData)
            }
          }
        } catch (error) {
          console.error(error)
          setError(error)
        } finally {
          setInputValue('')
          setLoading(false)
        }
      }
    }
    setError(null)
    setGroup(null)
    createGroups()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6 font-semibold">Create groups with serial numbers</h1>
      <p className="mt-6 mb-3 text-orange-500">
        Enter a group email base and the number of groups(between 1 and 1000):
      </p>
      <small className="text-orange-700">All groups will be created with primary domain.</small>
      <div className="flex w-full max-w-sm items-center space-x-2 mb-7 mt-3">
        <Input
          type="string"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a group email base"
        />
        <div className="flex">
          <input
            type="number"
            id="numInput"
            min="1"
            max="1000"
            value={nrOfGroups}
            onChange={(e) => setNrOfGroups(e.target.value)}
            placeholder="10"
          />
        </div>
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Go
        </Button>
      </div>

      {loading && <div className="loader items-center justify-center"></div>}

      {group && <div>{`Result: ${group.message}`}</div>}
      <p>{error && error.message}</p>
      {failedGroups.length > 0 && (
        <CsvDownloadButton data={failedGroups} filename="failed-groups">
          <div className="text-red-500 my-3">Download failed groups as csv</div>
        </CsvDownloadButton>
      )}
    </div>
  )
}
