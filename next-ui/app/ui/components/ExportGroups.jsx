'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CSVLink, CSVDownload } from 'react-csv'
import CsvDownloadButton from 'react-json-to-csv'

function ExportGroups() {
  const { email } = useContext(LoggedInUserContext)
  const { projectData } = useContext(ProjectDataContext)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState(null)

  const data = [
    { id: 'g3@pvp-test-domain.com', title: 'g3@pvp-test-domain.com', shape: 'box' },
    { id: 'g2@pvp-test-domain.com', title: 'g2@pvp-test-domain.com', shape: 'star' },
    { id: 'g@pvp-test-domain.com', title: 'g@pvp-test-domain.com', shape: 'dot' },
  ]

  // useEffect(() => {

  //   const prepareExportData = async (req, res) => {
  //     try {
  //       if (inputValue === '') {
  //         return
  //       }
  //       const groups = inputValue.split(',')
  // const response = await axios.post(
  //   'http://localhost:4000/api/groups/export',
  //   {
  //     userEmail: email,
  //     projectId: projectData.projectData.projectId,
  //     serviceAccountEmail: projectData.serviceAccountData.serviceAccountEmail,
  //     serviceAccountPrivateKey: projectData.serviceAccountKeys.privateKeyData,
  //     groupEmails: groups,
  //   },
  //   { withCredentials: true }
  // )
  // if (response.status === 200) {
  //   setResult(response.data)
  // }
  //     } catch (error) {
  //       setError(error)
  //     }
  //   }
  //   setData([])
  //   prepareExportData()
  // }, [data])

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
        <CsvDownloadButton data={data} filename={'groups.csv'}>
          Export
        </CsvDownloadButton>
      </div>
      <div>{error && `Error: ${error.message}`}</div>
    </div>
  )
}

export default ExportGroups
