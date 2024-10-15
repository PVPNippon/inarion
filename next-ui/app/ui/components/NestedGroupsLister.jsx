'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function NestedGroupsLister() {
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)
  const [inputValue, setInputValue] = useState('')
  const [groupList, setGroupList] = useState([])
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    const fetchMembership = async (req, res) => {
      try {
        if (inputValue === '') {
          return
        }
        const response = await axios.post(
          'http://localhost:4000/groups/get-nested-membership',
          {
            userEmail: email,
            projectId: projectData.projectData.projectId,
            serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
            serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
            queryEmail: inputValue,
          },
          { withCredentials: true }
        )

        if (response.status === 200) {
          setGroupList(response.data)
        }
      } catch (error) {
        console.error(error)
        setGroupList([{ error: error.message }])
      }
    }
    setGroupList([])
    fetchMembership()
  }, [clickCount])
  return (
    <div className="ms-5">
      <h1 className="my-6">Nested Group Membership</h1>
      <div className="flex w-full max-w-sm items-center space-x-2 mb-7">
        <Input
          className="text-black"
          type="email"
          name="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a group or user email address"
        />
        <Button onClick={() => setClickCount(clickCount + 1)} type="submit">
          Go
        </Button>
      </div>
      <Table>
        <TableCaption>A list of direct and indirect parents/grandparents for the target group or user.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Group</TableHead>
            <TableHead>Inherited via</TableHead>
            <TableHead>Membership type</TableHead>
            <TableHead className="text-right">Join timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupList &&
            groupList.map((group) => (
              <TableRow key={group.email}>
                <TableCell className="font-medium">{group.email}</TableCell>
                <TableCell>{group.inherited}</TableCell>
                <TableCell>{group.membership}</TableCell>
                <TableCell className="text-right">{group.timestamp}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default NestedGroupsLister
