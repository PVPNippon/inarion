'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/utils/apiClient'
import axios from 'axios'

/**
 * Function ListGroupsActivities
 *
 * This function fetches activities related to groups in the organization for the past 6 months.
 * It uses the user's email, project data, and click count to trigger the API call.
 * The API endpoint 'http://localhost:4000/groups/get-group-activity' is used to fetch the data.
 * If an error occurs during the API call, it logs the error and updates the activity list with an error message.
 */
//a temporary component for dev purposes.
//on click of button, fetch group's activities and display in div(error or activity list)
function ListGroupsActivities() {
  const email = 'testadmin@pvp-test-domain2.com'
  const [activityList, setActivityList] = useState([])
  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchActivities = async (req, res) => {
      if (clickCount === 0) {
        return
      }
      try {
        //temporarily bypass enctyption and authorzation
        //TODO: when encryption module is back, rewrite the fetch logic to use the apiClient module instead.
        const response = await axios.get(
          `http://localhost:4000/api/groups/activities?userEmail=${email}`,

          {
            headers: {
              //  Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            },
          }
        )
        if (response) setActivityList(response.data)
      } catch (error) {
        console.error(error)
        setError(error)
      }
    }
    setError(null)
    setActivityList([])
    fetchActivities()
  }, [clickCount])
  return (
    <div className="my-6">
      <h1>Groups Activities in your organization for past 6 months</h1>
      <p>
        NB: these logs are for 'enterprise_groups' only. 'groups' are not included. Tell Maria if you want to include
        'groups'
      </p>
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Check
        </Button>
      </div>
      <div className="max-h-[500px] overflow-y-scroll my-2 border border-input">
        {activityList && JSON.stringify(activityList)}
      </div>
      <p>{error && error.message}</p>
      {/* <div>{activityList && activityList}</div> */}
    </div>
  )
}

export default ListGroupsActivities
