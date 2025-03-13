'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/utils/apiClient'
import axios from 'axios'

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
        //getting email and token from local storage is a temporary measure, will change in the future
        // email = window.localStorage.getItem('email')
        // console.log('email:', email)
        email = 'testadmin@pvp-test-domain2.com'

        //N.B.the token validity is 1 hour, when started getting the 401 error, sign out and sign in back
        // const token = localStorage.getItem('jwtToken')
        // console.log('TOKEN', token)

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
      }
    }
    setError(null)
    setGroup(null)
    createGroup()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6">Greate group</h1>
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
      {/* <div>{group && group}</div> */}
    </div>
  )
}

/**
 * A temporary component for dev purposes.
 * On click of button, create a group and display in div(error or group details)
 */
//Please note that it's a temporary UI created hastily for testing/visualization purposes and it's not dev-quality
export function CreateGroups() {
  const [data, setData] = useState([])
  const [group, setGroup] = useState(null)
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)
  let email

  useEffect(() => {
    const createGroups = async (req, res) => {
      try {
        if (data.length === 0) return
        //getting email and token from local storage is a temporary measure, will change in the future
        // email = window.localStorage.getItem('email')
        // console.log('email:', email)
        email = 'testadmin@pvp-test-domain2.com'

        //N.B.the token validity is 1 hour, when started getting the 401 error, sign out and sign in back
        // const token = localStorage.getItem('jwtToken')
        // console.log('TOKEN', token)

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

        if (response) setGroup(response.data)
      } catch (error) {
        console.error(error)
        setError(error)
      }
    }
    setError(null)
    setGroup(null)
    createGroups()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6 font-semibold">Create groups by CSV</h1>
      <div className="flex w-full max-w-sm items-center space-x-2 mb-7">
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
                results = results.filter((item) => item !== '')
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
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Go
        </Button>
      </div>
      <div>{group && JSON.stringify(group)}</div>
      <p>{error && error.message}</p>
      {/* <div>{group && group}</div> */}
    </div>
  )
}

export function CreateGroupsWithSerialNumbers() {
  const [inputValue, setInputValue] = useState('')
  const [nrOfGroups, setNrOfGroups] = useState(10)
  const [group, setGroup] = useState(null)
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)
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
      if (inputValue === '' || nrOfGroups < 1) return
      if (confirm(`Are you sure you want to create ${nrOfGroups} groups with email base ${inputValue}?`)) {
        try {
          //getting email and token from local storage is a temporary measure, will change in the future
          // email = window.localStorage.getItem('email')
          // console.log('email:', email)
          email = 'testadmin@pvp-test-domain2.com'

          //N.B.the token validity is 1 hour, when started getting the 401 error, sign out and sign in back
          // const token = localStorage.getItem('jwtToken')
          // console.log('TOKEN', token)
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

          if (response) setGroup(response.data)
        } catch (error) {
          console.error(error)
          setError(error)
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
      <p className="my-6 text-orange-500">Enter a group email base and the number of groups(between 1 and 1000):</p>
      <div className="flex w-full max-w-sm items-center space-x-2 mb-7">
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
      <div>{group && JSON.stringify(group)}</div>
      <p>{error && error.message}</p>
      {/* <div>{group && group}</div> */}
    </div>
  )
}
