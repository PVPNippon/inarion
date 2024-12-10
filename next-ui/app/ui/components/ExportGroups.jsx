'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CsvDownloadButton from 'react-json-to-csv'
import { Checkbox } from '@/components/ui/checkbox'
import { apiClient } from '@/utils/apiClient'
import { serviceAccountPrivateKey } from '@/utils/keys'

//temporary component for dev purposes
//it supports 4 types of csv export, and files for separate groups are downloaded separately with group email being the csv file name
//However, the implementation is kinda roundabout, there should be an easier way to achieve that
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
  const [filenames, setFilenames] = useState([])

  //I added this function to download the file "on ready" because it was downloading before the csv data was updated
  //There should be better ways in React, need to investigate more
  useEffect(() => {
    if (data.length === 0) return

    const links = document.getElementsByClassName('csv')

    for (let i = 0; i < links.length; i++) {
      links[i].click()
      links[i].disabled = true
    }
    setReady(false)
  }, [ready])

  /**
   * Given a group object, returns an array of strings representing the column headers to be written in the csv file.
   * If the group is to be exported with derived membership, the column headers will include 'Member Relation Type' instead of 'Member Role'.
   * If the group is to be exported with all columns, the column headers will include 'Group Email'.
   * @param {Object} group - The group object to be exported
   * @returns {Array<string>} - The array of column headers
   */
  function createHeaders(group) {
    let headerArray = []
    if (group.includeDerivedMembership === false) {
      if (group.includeAllColumns === false) {
        headerArray = ['Member Name', 'Member Email', 'Member Role', 'Member Type']
      } else if (group.includeAllColumns === true) {
        headerArray = ['Group Email', 'Member Email', 'Member Name', 'Member Role', 'Member Type']
      }
    } else if (group.includeDerivedMembership === true) {
      if (group.includeAllColumns === false) {
        headerArray = ['Member Name', 'Member Email', 'Member Relation Type', 'Member Type']
      } else if (group.includeAllColumns === true) {
        headerArray = ['Group Email', 'Member Email', 'Member Name', 'Member Relation Type', 'Member Type']
      }
    }
    return headerArray
  }

  /**
   * Given a group object and a member object, returns an object with the properties as required for the csv file.
   * If the group is to be exported with derived membership, the returned object will have a 'Member Relation Type' property instead of 'Member Role'.
   * If the group is to be exported with all columns, the returned object will have a 'Group Email' property.
   * @param {Object} group - The group object to be exported
   * @param {Object} member - The member object to be exported
   * @returns {Object} - The object with the required properties
   */
  function createMemberObj(group, member) {
    const memberObj = {}
    if (group.includeDerivedMembership === false) {
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
    } else if (group.includeDerivedMembership === true) {
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
    }

    return memberObj
  }

  useEffect(() => {
    async function FetchData() {
      setData([])
      setError(null)
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

        //post the groups array to the backend
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

        const response = await apiClient(
          '/api/groups/bulk-export', // Endpoint path relative to API_BASE_URL
          'POST', // HTTP method
          // {
          //   userEmail: email,
          //   projectId: projectData.projectData.projectId,
          //   serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
          //   serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
          // },
          {
            userEmail: 'testadmin@pvp-test-domain2.com',
            projectId: '',
            serviceAccountEmail: 'testadmin-pvp-test12-work@project-1725519589587.iam.gserviceaccount.com',
            serviceAccountPrivateKey: serviceAccountPrivateKey,
            groups: groupsArray,
          },
          {}, // Additional headers, if any
          true // withCredentials flag
        )
        const tableData = response

        // const tableData = response.data
        //create an array of objects, each containing a row to be written in the csv
        if (tableData) {
          //create headers based on derivedMembership and allColumn values taken from the first group in the list
          //as of now it has been desided that (the UI_UX team decided that we won't allow separate options for different groups
          setHeaders(createHeaders(tableData[0]))
          const csvData = []
          const groupNames = []
          tableData.forEach((group, index) => {
            groupNames.push(group.group)
            const fileData = []
            group.members.forEach((member) => {
              fileData.push(createMemberObj(group, member))
            })
            csvData.push(fileData)
            setFilenames(groupNames)
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
        <div>
          <ul>
            {data &&
              data.map((file, index) => {
                return (
                  <CsvDownloadButton
                    key={'csv' + index.toString()}
                    data={file}
                    headers={headers}
                    filename={filenames[index]}
                    className={'csv hidden'}
                  ></CsvDownloadButton>
                )
              })}
          </ul>
        </div>
        <Button onClick={() => setCount(count + 1)}>Export</Button>
      </div>
      <div className="flex">
        <Checkbox
          className="bg-white"
          id="derivedMembership"
          onCheckedChange={() => setDerivedMembership(!derivedMembership)}
        ></Checkbox>
        <label htmlFor="derivedMembership">Include derived membership</label>
        <Checkbox className="bg-white" id="allColumns" onCheckedChange={() => setAllColumns(!allColumns)}></Checkbox>
        <label htmlFor="allColumns">Include all columns</label>
      </div>
      <div>{error && `Error: ${error.message}`}</div>
    </div>
  )
}

export default ExportGroups
