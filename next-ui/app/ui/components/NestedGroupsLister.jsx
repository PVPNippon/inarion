'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function NestedGroupsLister() {
  const [inputValue, setInputValue] = useState('')
  const [groupList, setGroupList] = useState([])
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    const dummyGroupList = [
      {
        email: 'group1@example.com',
        inherited: 'group2',
        membership: 'direct',
        timestamp: '2022-01-01 00:00:00',
      },
      {
        email: 'group2@example.com',
        inherited: 'group3',
        membership: 'indirect',
        timestamp: '2022-01-01 00:00:00',
      },
      {
        email: 'group3@example.com',
        inherited: 'group4',
        membership: 'indirect',
        timestamp: '2022-01-01 00:00:00',
      },
      {
        email: 'group4@example.com',
        inherited: 'group5',
        membership: 'indirect',
        timestamp: '2022-01-01 00:00:00',
      },
      {
        email: 'group5@example.com',
        inherited: 'group6',
        membership: 'indirect',
        timestamp: '2022-01-01 00:00:00',
      },
      {
        email: 'group6@example.com',
        inherited: 'group7',
        membership: 'indirect',
        timestamp: '2022-01-01 00:00:00',
      },
    ]
    setGroupList(dummyGroupList)
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
