'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Component that visualizes the hierarchy of a group.
 *
 * The component takes an input from the user - a group email address.
 * When the user clicks the "Visualize" button, the component fetches the
 * hierarchy of the group and displays it.
 *
 * The hierarchy is fetched from the backend API.
 *
 * The component uses the `useState` hook to store the input value and the
 * hierarchy of the group.
 *
 * The component uses the `useEffect` hook to fetch the hierarchy of the group
 * when the user clicks the button.
 *
 * The component renders a form with an input field and a button.
 * It also renders a div to display the hierarchy of the group.
 */
//It's only UI and backend is not imlemented yet.
function VisualizeHierarchy() {
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)
  const [inputValue, setInputValue] = useState('')
  const [groupList, setGroupList] = useState([])
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    console.log('coming soon')
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6">Visualize Group Hierarchy</h1>
      <div className="flex w-full max-w-sm items-center space-x-2 mb-7">
        <Input
          type="email"
          name="groupEmail"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a group email address"
        />
        <Button type="submit" onClick={() => setClickCount(clickCount + 1)}>
          Visualize
        </Button>
      </div>
      <div>coming soon</div>
    </div>
  )
}

export default VisualizeHierarchy
