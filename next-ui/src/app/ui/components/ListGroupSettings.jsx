/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'
import React, { useState, useEffect, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
//import { apiClient } from '@/utils/apiClient'
import axios from 'axios'
const email = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL //temporarily bypass login and jwttoken check

//Please note that it's a temporary UI created hastily for testing/visualization purposes and it's not dev-quality

/**
 * A temporary component for dev purposes.
 * On click of button, fetch a group's settings and display in div(error or group settings)
 *
 * States:
 * - `inputValue`: Stores the group email address entered by the user.
 * - `group`: Stores the fetched list of group settings or error messages.
 * - `clickCount`: A counter to trigger the fetch operation.
 * - `error`: Any error message encountered during the fetch operation.
 *
 * Side Effects:
 * - Uses `useEffect` to trigger the fetch of group settings whenever `clickCount` changes.
 *
 * API:
 * - Sends a GET request to `http://localhost:4000/api/groups/group/:groupEmail/settings` with the user's email and the group email to retrieve the group settings.
 *
 * @returns {JSX.Element} The rendered component for fetching a group's settings.
 */
function ListGroupSettings() {
  const [inputValue, setInputValue] = useState('')
  const [group, setGroup] = useState(null)
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const getSettings = async (req, res) => {
      try {
        if (inputValue === '') {
          return
        }
        const response = await axios.get(
          `http://localhost:4000/api/groups/group/${inputValue}/settings?userEmail=${email}`,

          {
            headers: {
              //  Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
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
    getSettings()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6">Get a group's settings</h1>
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
      <div className="w-full" style={{ wordBreak: 'break-all' }}>
        {group && JSON.stringify(group)}
      </div>
      <p>{error && error.message}</p>
      {/* <div>{group && group}</div> */}
    </div>
  )
}

export default ListGroupSettings
