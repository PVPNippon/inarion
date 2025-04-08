/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
//import { apiClient } from '@/utils/apiClient' //even unused, it caused nextjs to fail, so needed to comment out
import axios from 'axios'
const email = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL //temporarily bypass login and jwttoken check

/**
 * Temporary component for dev purposes.
 * On click of button, fetch groups and display in div (error or group list).
 */
function ListGroups() {
  const [groupList, setGroupList] = useState([])
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchGroups = async (req, res) => {
      if (clickCount === 0) {
        return
      }
      try {
        console.log('fetching groups...')
        const response = await axios.get(
          `http://localhost:4000/api/groups/?userEmail=${email}`,

          {
            headers: {
              // Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            },
          }
        )

        if (response) setGroupList(response.data)
      } catch (error) {
        console.error(error)
        setError(error)
      }
    }
    setError(null)
    setGroupList([])
    fetchGroups()
  }, [clickCount])
  return (
    <div className="mt-6">
      <h1>Groups in your organization</h1>
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Check
        </Button>
      </div>
      <p>{error && error.message}</p>
      {/* <div>{groupList && groupList}</div> */}
      <div className="max-h-[500px] overflow-y-scroll my-2 border border-input">
        {groupList && JSON.stringify(groupList)}
      </div>
    </div>
  )
}

export default ListGroups
