'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CsvDownloadButton from 'react-json-to-csv'
import { Checkbox } from '@/components/ui/checkbox'

//temporary component for dev purposes(WIP)
//we plan to implement 4 types of csv export in the future
//at present only one is implemented(includes derived membership:true, include all columns:true)
//all members are downloaded in 1 csv file
//we may alter that to download multiple csv files(or give the customer an option to select if they want to download separate files or one file)
function ExportGroups() {
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState(null)
  const [data, setData] = useState([
    {
      group: '',
      email: '',
      name: '',
      relationType: '',
      type: '',
    },
  ])
  const [derivedMembership, setDerivedMembership] = useState(true)
  const [allColumns, setAllColumns] = useState(true)
  const [count, setCount] = useState(0)
  const [ready, setReady] = useState(false)
  const headers = ['Group Email', 'Member Email', 'Member Name', ' Member Relation Type', 'Member Type']

  //I added this function to download the file "on ready" because it was downloading before the csv data was updated
  //There should be better ways in React, need to investigate more
  useEffect(() => {
    if (ready === true) {
      const link = document.getElementById('csv')
      link.click()
      setReady(false)
    }
  }, [ready])

  useEffect(() => {
    async function FetchData() {
      if (inputValue === '' || count === 0) {
        return
      }
      try {
        let groups = inputValue.split(',')
        groups = groups.map((group) => group.trim())

        const groupsArray = groups.map((group) => ({
          groupEmail: group,
          includeDerivedMembership: derivedMembership,
          includeAllColumns: allColumns,
        }))
        const response = await axios.post(
          'http://localhost:4000/api/groups/bulk-export',
          {
            userEmail: email,
            projectId: projectData.projectData.projectId,
            serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
            serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
            groups: groupsArray,
          },
          { withCredentials: true }
        )

        const tableData = response.data
        if (tableData) {
          const csvData = []
          tableData.forEach((group) => {
            group.members.forEach((member) => {
              const memberObj = {
                group: group.group,
                email: member.email,
                name: member.name,
                relationType: member.relationType,
                type: member.type,
              }
              csvData.push(memberObj)
            })
          })
          setData(csvData)
          setReady(true)
        }
      } catch (error) {
        console.error(error)
        setError(error)
      }
    }
    FetchData()
  }, [count])

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

        <CsvDownloadButton
          className="hidden"
          id="csv"
          data={data}
          headers={headers}
          filename={'groups.csv'}
        ></CsvDownloadButton>
        <Button onClick={() => setCount(count + 1)}>Export</Button>
      </div>
      <div className="flex">
        <Checkbox
          className="bg-white"
          id="derivedMembership"
          onChange={() => setDerivedMembership(!derivedMembership)}
          checked={derivedMembership}
        ></Checkbox>
        <label htmlFor="derivedMembership">Include derived membership</label>
        <Checkbox
          className="bg-white"
          id="allColumns"
          onChange={() => setAllColumns(!allColumns)}
          checked={allColumns}
        ></Checkbox>
        <label htmlFor="allColumns">Include all columns</label>
      </div>
      <div>{error && `Error: ${error.message}`}</div>
    </div>
  )
}

export default ExportGroups
