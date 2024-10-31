'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CSVLink, CSVDownload } from 'react-csv'
import CsvDownloadButton from 'react-json-to-csv'
import { Checkbox } from '@/components/ui/checkbox'

function ExportGroups() {
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState(null)
  const [data, setData] = useState([
    {
      email: '',
      type: '',
      name: '',
      group: '',
      relationType: '',
    },
  ])
  const [derivedMembership, setDerivedMembership] = useState(false)
  const [allColumns, setAllColumns] = useState(false)

  async function fetchData() {
    try {
      let groups = inputValue.split(',')
      groups = groups.map((group) => group.trim())

      const groupsArray = groups.map((group) => ({
        groupEmail: group,
        includeDerivedMembership: derivedMembership,
        includeAllColumns: allColumns,
      }))
      // const response = await axios.post(
      //   'http://localhost:4000/api/groups/bulk-export',
      //   {
      //     userEmail: email,
      //     projectId: projectData.projectData.projectId,
      //     serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
      //     serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
      //     groups: groupsArray,
      //   },
      //   { withCredentials: true }
      // )

      return [
        {
          email: 'admin@pvp-test-domain2.com',
          type: 'USER',
          name: 'admin admin',
          group: 'g@pvp-test-domain2.com',
          relationType: 'INDIRECT',
        },
        {
          email: '',
          type: 'GROUP',
          name: 'All users in the organization',
          group: 'g@pvp-test-domain2.com',
          relationType: 'INDIRECT',
        },
        {
          email: 'grandchild-group@pvp-test-domain2.com',
          type: 'GROUP',
          name: 'grandchild-group',
          group: 'g@pvp-test-domain2.com',
          relationType: 'INDIRECT',
        },
        {
          email: 'childgroup@pvp-test-domain2.com',
          type: 'GROUP',
          name: 'childgroup',
          group: 'g@pvp-test-domain2.com',
          relationType: 'INDIRECT',
        },
        {
          email: 'sister@pvp-test-domain2.com',
          type: 'GROUP',
          name: 'sister',
          group: 'g@pvp-test-domain2.com',
          relationType: 'DIRECT',
        },
        {
          email: 'testadmin@pvp-test-domain2.com',
          type: 'USER',
          name: 'Admin Test-12',
          group: 'g@pvp-test-domain2.com',
          relationType: 'INDIRECT',
        },
        {
          email: 'user1@pvp-test-domain2.com',
          type: 'USER',
          name: '山田太郎',
          group: 'g@pvp-test-domain2.com',
          relationType: 'INDIRECT',
        },
        {
          email: 'all@pvp-test-domain2.com',
          type: 'GROUP',
          name: 'all',
          group: 'g@pvp-test-domain2.com',
          relationType: 'INDIRECT',
        },
        {
          email: 'brother@pvp-test-domain2.com',
          type: 'GROUP',
          name: 'brother',
          group: 'g@pvp-test-domain2.com',
          relationType: 'DIRECT',
        },
        {
          email: 'group@pvp-test-domain2.com',
          type: 'GROUP',
          name: 'group',
          group: 'g@pvp-test-domain2.com',
          relationType: 'DIRECT',
        },
      ]
    } catch (error) {
      setError(error)
    }
  }

  async function HandleClick() {
    if (inputValue === '') {
      return
    }
    const tableData = await fetchData()
    if (tableData) {
      tableData.forEach((group) => {
        setData(group.members)
        const link = document.getElementById('csv')
        link.click()
      })
    }
  }

  return (
    <div className="ms-5">
      <h1 className="my-6">Export groups as CSV</h1>
      <div className="flex w-full max-w-3xl items-center space-x-2 mb-7">
        <Input
          type="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter groups' email addresses, comma separated"
          className="text-black"
        />

        <CsvDownloadButton className="hidden" id="csv" data={data} filename={'groups.csv'}></CsvDownloadButton>
        <Button onClick={HandleClick}>Export</Button>
      </div>
      <div className="flex">
        <Checkbox
          className="bg-white"
          id="derivedMembership"
          onChange={() => setDerivedMembership(!derivedMembership)}
        ></Checkbox>
        <label htmlFor="derivedMembership">Include derived membership</label>
        <Checkbox className="bg-white" id="allColumns" onChange={() => setAllColumns(!allColumns)}>
          Include all columns
        </Checkbox>
        <label htmlFor="allColumns">Include all columns</label>
      </div>
      <div>{error && `Error: ${error.message}`}</div>
    </div>
  )
}

export default ExportGroups
