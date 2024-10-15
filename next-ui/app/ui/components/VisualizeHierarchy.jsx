'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
