'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CsvDownloadButton from 'react-json-to-csv'
// import { Checkbox } from '@/components/ui/checkbox'

//temporary component for dev purposes(WIP)
//we plan to implement 4 types of csv export
function ExportGroups() {
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState(null)
  const [data, setData] = useState([])
  const [derivedMembership, setDerivedMembership] = useState(false)
  const [allColumns, setAllColumns] = useState(false)
  const [count, setCount] = useState(0)
  const [ready, setReady] = useState(false)
  const [headers, setHeaders] = useState([])

  //I added this function to download the file "on ready" because it was downloading before the csv data was updated
  //There should be better ways in React, need to investigate more
  useEffect(() => {
    if (ready === true) {
      const link = document.getElementById('csv')
      link.click()
      setReady(false)
    }
  }, [ready])

  function createHeaders(group) {
    let headerArray = []

    switch (group.includeDerivedMembership) {
      case group.includeDerivedMembership === false:
        if (group.includeAllColumns === false) {
          headerArray = ['Member Name', 'Member Email', 'Member Role', 'Member Type']
        } else if (group.includeAllColumns === true) {
          headerArray = ['Group Email', 'Member Email', 'Member Name', 'Member Role', 'Member Type']
        }
        break

      case group.includeDerivedMembership === true:
        if (group.includeAllColumns === false) {
          headerArray = ['Member Name', 'Member Email', 'Member Relation Type', 'Member Type']
        } else if (group.includeAllColumns === true) {
          headerArray = ['Group Email', 'Member Email', 'Member Name', 'Member Relation Type', 'Member Type']
        }
        break
    }
    return headerArray
  }

  function createMemberObj(group, member) {
    const memberObj = {}

    switch (group.includeDerivedMembership) {
      case group.includeDerivedMembership === false:
        if (group.includeAllColumns === false) {
          memberObj.name = member.name
          memberObj.email = member.email
          memberObj.role = member.role
          memberObj.type = member.type
        } else if (group.includeAllColumns === true) {
          memberObj.group = group.group
          memberObj.email = member.email
          memberObj.name = member.name
          memberObj.role = member.role
          memberObj.type = member.type
        }
        break
      case group.includeDerivedMembership === true:
        if (group.includeAllColumns === false) {
          memberObj.name = member.name
          memberObj.email = member.email
          memberObj.relationType = member.relationType
          memberObj.type = member.type
        } else if (group.includeAllColumns === true) {
          memberObj.group = group.group
          memberObj.email = member.email
          memberObj.name = member.name
          memberObj.relationType = member.relationType
          memberObj.type = member.type
        }
        break
    }

    return memberObj
  }

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
        console.log(response.data)
        const tableData = response.data
        if (tableData) {
          const csvData = []
          tableData.forEach((group) => {
            group.members.forEach((member) => {
              let memberObj = createMemberObj(group, member)
              console.log(memberObj)
              csvData.push(memberObj)
            })
          })
          setHeaders(createHeaders(tableData[0]))
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
        <input type="checkbox" id="derivedMembership" onChange={() => setDerivedMembership(!derivedMembership)}></input>
        {/* <Checkbox
          className="bg-white"
          id="derivedMembership"
          onChange={() => setDerivedMembership(!derivedMembership)}
        ></Checkbox> */}
        <label htmlFor="derivedMembership">Include derived membership</label>
        {/* <Checkbox className="bg-white" id="allColumns" onChange={() => setAllColumns(!allColumns)}></Checkbox> */}
        <input type="checkbox" id="allColumns" onChange={() => setAllColumns(!allColumns)}></input>
        <label htmlFor="allColumns">Include all columns</label>
      </div>
      <div>{error && `Error: ${error.message}`}</div>
    </div>
  )
}

export default ExportGroups
