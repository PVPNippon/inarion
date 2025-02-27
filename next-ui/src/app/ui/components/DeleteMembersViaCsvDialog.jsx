'use client'
import React, { useState, useEffect, useRef, useReducer } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { groupsStyles } from '@/app/[locale]/groups/group-variables'
import { Download, CloudUpload, X, Check } from 'lucide-react'
import { CustomWidthDialogContent } from '@/components/ui/custom-dialog-content-width'
import {
  CustomTable,
  CustomTableHeader,
  CustomTableHead,
  CustomTableBody,
  CustomTableRow,
  CustomTableCell,
} from '@/components/ui/custom-table'
import Papa from 'papaparse'
import Image from 'next/image'
import TempSpinner from '@/app/ui/svg-icons/TempSpinner.svg'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

/**
 * Maps and filters CSV data for valid and unique email entries.
 *
 * The function processes CSV data, either in array or object format,
 * mapping it to a specific structure and filtering out invalid or duplicate
 * email addresses. It utilizes a regular expression to validate email formats.
 * If any invalid or duplicate emails are found, a warning is triggered.
 *
 * @param {Array} data - The input data, an array of arrays or objects,
 *                       where each sub-array or object contains at least
 *                       a name and email.
 * @param {Function} setWarning - A callback function to trigger warnings
 *                                if invalid or duplicate emails are detected.
 * @returns {Array} - An array of unique and valid mapped data objects,
 *                    each containing a name and email.
 */
function mapAndFilterCsvData(data, setWarning) {
  console.log('INITIAL DATA', data)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  //handle mapping of different data formats(arrays or objects)
  const mappedData = data.map((item) => {
    const values = Array.isArray(item) ? item : Object.values(item)
    return {
      name: values[0],
      email: values[1],
    }
  })

  //filter out rows with empty or invalid emails
  //filter out rows with duplicate emails
  //Note: we cannot filter out potential non-members or misspelled emails if they pass regex, it will only be known after the API call
  const uniqueDataArray = [
    ...new Map(
      mappedData.filter((item) => item.email !== '' && emailRegex.test(item.email)).map((item) => [item.email, item])
    ).values(),
  ]
  console.log('uniqueDataArray', uniqueDataArray)

  if (data.length > uniqueDataArray.length) {
    setWarning(true)
  }

  return uniqueDataArray
}

/**
 * Checks if the parsed CSV data is valid.
 * It should be an array of arrays where each sub-array has at least two elements.
 * The first element of each sub-array is the group name, and the second element is the group email.
 * We need to check the second column, so if the array length is less than 2, it's not a valid CSV.
 * Even if group name or email was empty, it will be present in the array as an empty string.
 * @param {array} data - The parsed CSV data from Papa.parse
 * @returns {boolean} Whether the parsed CSV data is valid
 */
function validateParsedDataArray(data) {
  return (
    Array.isArray(data) && data.every((item) => Array.isArray(item)) && data.slice(1).every((item) => item.length >= 2)
  )
}

function DeleteMembersViaCsvDialog({ groupName, groupEmail }) {
  const [deletionResult, setDeletionResult] = useState([])
  const [csvData, setCsvData] = useState([])
  const [fileName, setFileName] = useState('')
  const [warning, setWarning] = useState(false)
  const [invalidFileType, setInvalidFileType] = useState(false)

  const initialState = {
    status: 'empty',
  }

  const uploadReducer = (state, action) => {
    switch (action.type) {
      case 'empty':
        return initialState

      case 'uploadInProgress':
        return { status: 'uploadInProgress' }

      case 'complete':
        return { status: 'complete' }

      case 'error':
        return {
          status: 'error',
        }

      case 'showBadge':
        return { status: 'showBadge' }

      case 'showTable':
        return { status: 'showTable' }

      case 'deletionInProgress':
        return { status: 'deletionInProgress' }

      case 'showDeletionResult':
        return { status: 'showDeletionResult' }

      default:
        return state
    }
  }

  const [uploadState, dispatchUploadState] = useReducer(uploadReducer, initialState)

  /**
   * A function that takes a parsed CSV data array and a file name as arguments.
   * It filters out invalid or duplicate email addresses from the data array
   * using the mapAndFilterCsvData function and updates the component state.
   * If the filtered data array is empty, it sets the component state to
   * indicate an error and returns. Otherwise, it updates the component state
   * to indicate a successful upload and sets a timer to display a badge
   * indicating the status of the upload after 3 seconds.
   * @param {Array} data - The parsed CSV data array.
   * @param {string} fileName - The name of the CSV file.
   */
  function handleUploadedDataAndState(data, fileName) {
    const filteredData = mapAndFilterCsvData(data, setWarning)
    if (filteredData.length === 0) {
      setWarning(false)
      dispatchUploadState({ type: 'error' })
      return
    }

    setCsvData(filteredData)
    setFileName(fileName)
    dispatchUploadState({ type: 'complete' })

    setTimeout(() => {
      dispatchUploadState({ type: 'showBadge' })
    }, 3000)
  }

  /**
   * A fallback function for parsing a CSV file when Papa.parse fails.
   * It is called when Papa.parse encounters errors such as "UndetectableDelimiter"
   * and "TooManyFields". It takes a file object as an argument and parses it using
   * Papa.parse with the header option set to false. It then filters out the first
   * two rows of the parsed data and maps the remaining data to an array of objects with
   * "name" and "email" properties. Finally, it filters out any rows with empty or
   * invalid emails, sets the component state, and displays a badge indicating
   * the status of the upload.
   * @param {File} file - The CSV file to be parsed.
   */
  /** The aim of this function is to detect and handle cases when a user exported the CSV file on macOS with checkbox "Include table names" checked.
  Note:the checkbox is unchecked by default and should stay unchecked for the data to be parsed correctly. But the wording is kinda confusing so the user may check it thinking that it will include header row, especially because we warn the user not to delete table headers.
 
  In normal situations the parsed data should look like an array of objects where column names are keys and cell contents are values (i.e.
  [
    {
      "Member Name [ optional ]": "Group1",
      "Member Email [ required ]": "group@pvp-test-domain2.com"
  },
  {
      "Member Name [ optional ]": "Group2",
      "Member Email [ required ]": "group2@pvp-test-domain2.com"
  }
]) 

  However, checking the checkbox returns a completely different format of data, so we need to handle it separately. It's an array of arrays where
  the first array has length 1 and contains the table name(i.e. the name of the file which were exported), the second array has length 2 and contains table headers.
  The rest of arrays have length 2 and contain a table row data.
  Note that we only need the member email (second column) for the deletion. First column (name) can be empty or has an incorrect value. Third or more columns(if present) will be ignored.
  **/
  function fallbackParse(file) {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        console.log('FALLBACK results:', results)
        let resultDataArray = results.data
        if (resultDataArray.length <= 2) {
          //the first 2 arrays are table name and table headers, so if there is no other data, it's not a valid CSV
          dispatchUploadState({ type: 'error' })
          return
        }

        if (validateParsedDataArray) {
          const tableDataArrays = resultDataArray.slice(2) //remove table name and table headers
          console.log('tableDataArrays', tableDataArrays)
          handleUploadedDataAndState(tableDataArrays, file.name)
        }
      },
    })
  }

  /**
   * Function to parse a CSV file and set the component state with the parsed data.
   * @param {File} file - The CSV file to be parsed.
   */
  function handleCsvUpload(file) {
    setInvalidFileType(false)
    if (file.type !== 'text/csv') {
      console.error('Only CSV files are allowed')
      setInvalidFileType(true)
      return
    }

    dispatchUploadState({ type: 'uploadInProgress' })

    //TODO(maria) :IMPORTANT: remove timeout when testing is completed
    setTimeout(() => {
      //Add try-catch for unexpected scenarios such as unsupported encoding etc.
      try {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,

          complete: function (results) {
            const resultData = results
            console.log('results:', results)

            if (resultData.data.length === 0) {
              dispatchUploadState({ type: 'error' })
              return
            }

            if (resultData.errors.length > 0) {
              if (
                resultData.errors[0]?.code === 'UndetectableDelimiter' &&
                resultData.errors[1]?.code === 'TooManyFields' &&
                resultData.meta?.fields.length === 1
              ) {
                fallbackParse(file)
              } else {
                dispatchUploadState({ type: 'error' })
              }
              return
            }
            handleUploadedDataAndState(resultData.data, file.name)
          },
        })
      } catch (error) {
        console.error('Error handling CSV file:', error)
        dispatchUploadState({ type: 'error' })
      }
    }, 3000) // simulate a 3-second delay for dev purposes
  }

  const handleDelete = async () => {
    if (!groupEmail || csvData.length === 0) return

    try {
      dispatchUploadState({ type: 'deletionInProgress' })
      const memberList = csvData.map((memberObj) => Object.values(memberObj)[1])

      //getting email and token from local storage is a temporary measure, will change in the future
      const email = window.localStorage.getItem('email')
      console.log('email:', email)

      //N.B.the token validity is 1 hour, when started getting the 401 error, sign out and sign in back
      const token = localStorage.getItem('jwtToken')
      console.log('TOKEN', token)

      const response = await axios.delete(
        `http://localhost:4000/api/groups/group/${groupEmail}/members/?userEmail=${email}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
          },
          data: { memberEmails: memberList },
        }
      )
      console.log('RESPONSE FROM BE', response)
      setDeletionResult(response.data)
    } catch (err) {
      console.log('error', err)

      //error 400 means that the deletion was attempted, but failed for all members. The most probable cause is that the user uploaded a wrong file where all email addresses are not members of the target group.
      //for all other scenarios, display a generic error(for now)
      if (err.status === 400 && err.response.data) {
        setDeletionResult(err.response.data)
      } else {
        setDeletionResult({ message: 'Something went wrong' })
      }
    } finally {
      setTimeout(() => {
        dispatchUploadState({ type: 'showDeletionResult' })
      }, 3000) //imitate a 3 second delay
    }
  }

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default">Delete Members via CSV</Button>
        </DialogTrigger>

        <CustomWidthDialogContent aria-describedby={undefined}>
          <div className="flex flex-col p-4 space-y-7">
            <DialogHeader>
              <DialogTitle className="font-semibold text-2xl/8">Remove multiple group members</DialogTitle>
              <DialogDescription>
                You are about to remove multiple group member(s) from
                <span className="font-semibold"> {`${groupName} (${groupEmail})`}</span>.
              </DialogDescription>
            </DialogHeader>

            <div
              className={`${groupsStyles.roundBorder} flex flex-col space-y-8 ${
                uploadState.status === 'showBadge' ? '' : 'h-[534px]'
              } w-[768px] p-8`}
            >
              <div className="flex flex-col gap-y-4">
                <div className="flex flex-col gap-y-1">
                  <div className="font-semibold text-2xl/8">
                    {uploadState.status === 'showTable' ? 'Confirm list' : 'Upload CSV'}
                  </div>
                  <div className="text-muted-foreground text-sm/5">
                    {uploadState.status === 'showTable'
                      ? 'Review the list of members set for removal.'
                      : 'Upload a CSV file and review the list of member(s) who will be removed.'}
                  </div>
                </div>
                <CsvTemplateDownloader
                  hiddenClass={
                    uploadState.status === 'showBadge' ||
                    uploadState.status === 'showTable' ||
                    uploadState.status === 'showDeletionResult'
                      ? 'hidden'
                      : ''
                  }
                />
                {invalidFileType && (
                  <div className="text-destructive text-sm/5">
                    Invalid file type. Only CSV files are allowed. Please upload a file with extension .csv.
                  </div>
                )}
                {uploadState.status === 'showBadge' && warning && <Warning />}
                {csvData && (
                  <CsvFileBadge
                    hiddenClass={uploadState.status === 'showBadge' ? '' : 'hidden'}
                    fileName={fileName}
                    setCsvData={setCsvData}
                    dispatchUploadState={dispatchUploadState}
                    setWarning={setWarning}
                  />
                )}
              </div>
              {uploadState !== null && (
                <>
                  {uploadState.status === 'empty' && (
                    <div
                      className={`${groupsStyles.uploadArea} border-dashed hover:bg-accent focus:bg-accent`}
                      onDragOver={(e) => {
                        e.preventDefault()
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        //  if (e.dataTransfer.files[0].type !== 'text/csv') return false //removed on purpose because it's not user friendly
                        handleCsvUpload(e.dataTransfer.files[0])
                      }}
                    >
                      <CloudUpload size={80} className="stroke-muted-foreground" strokeWidth={1} />
                      <Button
                        className={groupsStyles.buttonPadding}
                        onClick={() => document.getElementById('file-upload-delete-members').click()}
                        variant="outline"
                      >
                        Select a CSV file to upload
                      </Button>
                      <span>or</span>
                      <span>Drag and drop it here</span>
                      <input
                        accept=".csv"
                        id="file-upload-delete-members" //N.B. the id must be unique or it will clash with other compoments
                        onChange={(e) => {
                          handleCsvUpload(e.target.files[0])
                        }}
                        type="file"
                        className="hidden"
                      />
                    </div>
                  )}
                  {uploadState.status === 'uploadInProgress' && (
                    <div className={`${groupsStyles.uploadArea} border-dashed hover:bg-accent focus:bg-accent`}>
                      <Image src={TempSpinner} alt="temorary spinner placeholder" width="80px" height="80px" />
                      <p>Upload in progress</p>
                    </div>
                  )}
                  {uploadState.status === 'error' && (
                    <div>
                      <p className="text-red-600">Upload failed.</p>
                      <p className="text-red-600">
                        Please check that the file data is in the same format as the template provided and try again.
                      </p>
                    </div>
                  )}
                  {uploadState.status === 'complete' && (
                    <div
                      className={`${groupsStyles.uploadArea} border-green-500 flex flex-col items-center justify-center gap-y-2`}
                    >
                      <Check size={80} className="stroke-green-500" strokeWidth={1} />
                      <p>Upload complete</p>
                    </div>
                  )}
                  {uploadState.status === 'showTable' && <CsvTable csvData={csvData} />}
                  {uploadState.status === 'deletionInProgress' && <Loader />}
                  {uploadState.status === 'showDeletionResult' && (
                    <div>
                      <p className="text-red-600">Deletion result</p>
                      <div>{deletionResult && JSON.stringify(deletionResult)}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {uploadState.status !== 'showTable' && uploadState.status !== 'showDeletionResult' && (
            <DialogFooter>
              <Button
                className={groupsStyles.buttonPaddingWide}
                onClick={() => {
                  dispatchUploadState({ type: 'showTable' })
                }}
                disabled={uploadState.status !== 'showBadge' && uploadState.status !== 'showTable'}
              >
                Next
              </Button>
            </DialogFooter>
          )}
          {(uploadState.status === 'showTable' || uploadState.status === 'showDeletionResult') && (
            <DialogFooter className="xs:justify-end md:justify-between">
              <Button
                className={`${groupsStyles.buttonPaddingWide}`}
                type="button"
                variant="outline"
                onClick={() => {
                  setCsvData([])
                  setFileName('')
                  setDeletionResult([])
                  setWarning(false)
                  dispatchUploadState({ type: 'empty' })
                }}
              >
                Back
              </Button>
              {uploadState.status === 'showTable' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className={groupsStyles.buttonPaddingWide}>Remove</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{`Are you sure you want to remove ${csvData.length} member(s) from ${groupName} (${groupEmail})?`}</AlertDialogTitle>
                      <AlertDialogDescription>
                        You can always bulk-add members back to the group via the Google Workspace Admin Console.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className={groupsStyles.buttonPaddingWide}>Cancel</AlertDialogCancel>
                      <AlertDialogAction className={groupsStyles.buttonPaddingWide} onClick={handleDelete}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DialogFooter>
          )}
        </CustomWidthDialogContent>
      </Dialog>
    </div>
  )
}

export default DeleteMembersViaCsvDialog

function CsvTemplateDownloader({ hiddenClass }) {
  return (
    <div>
      <a
        href="/templates/members-list-sample.csv"
        download="members-list-sample.csv"
        className={`w-fit flex text-sm/5 gap-x-2.5 ${groupsStyles.secondaryTextChart5} ${hiddenClass}`}
      >
        <Download size={20} />
        <span> Download blank CSV template</span>
      </a>
    </div>
  )
}

function CsvFileBadge({ fileName, setCsvData, hiddenClass, dispatchUploadState, setWarning }) {
  if (!fileName) return

  return (
    <div className={`flex items-center py-2 gap-x-3 ${hiddenClass}`}>
      <Badge className="text-base/6 font-normal py-1 px-6">{`Delete ${fileName} `}</Badge>
      <span
        role="button"
        onClick={() => {
          setCsvData([])
          setWarning(false)
          dispatchUploadState({ type: 'empty' })
        }}
      >
        <X size={24} className="stroke-muted-foreground cursor-pointer" />
      </span>
    </div>
  )
}

function Loader() {
  return (
    <>
      {/* temporary loader */}
      <div className="text-purple-500 text-center">.......Temporary Loader.......</div>
    </>
  )
}

function Warning() {
  return (
    <Alert variant="destructive">
      <AlertTitle>Some of member addresses were not uploaded.</AlertTitle>
      <AlertDescription>
        <p>Possible reasons: duplicate or invalid email address, or empty email address column.</p>
        <p>Click "Next" to see the list of successfully uploaded email addresses.</p>
      </AlertDescription>
    </Alert>
  )
}

function CsvTable({ csvData }) {
  const tableRef = useRef(null)

  useEffect(() => {
    if (tableRef.current) {
      const scrollArea = tableRef.current.parentElement.parentElement.parentElement.children[1]
      scrollArea.parentElement.classList.remove('h-[200px]')

      //11 rows can fit into the screen, so if there are more than 11 rows, we need to set the fixed height and the rest will be scrollable
      if (csvData.length >= 11) {
        scrollArea.parentElement.classList.add('h-[392px]')
      } else {
        //otherwise, the height will be based on the number of rows in the table(32px per row) + header(40px)
        scrollArea.parentElement.classList.add(`h-[${40 + csvData.length * 32}px]`)
      }
    }
  }, [])
  return (
    <>
      <CustomTable ref={tableRef}>
        <CustomTableHeader>
          <CustomTableRow className="text-nowrap text-sm/4">
            <CustomTableHead className="font-semibold">Member name</CustomTableHead>
            <CustomTableHead className="font-semibold">Member email</CustomTableHead>
          </CustomTableRow>
        </CustomTableHeader>
        <CustomTableBody>
          {csvData &&
            csvData.map((memberObj) => {
              const values = Object.values(memberObj)
              return (
                <CustomTableRow className="text-xs/4 text-nowrap rounded-none" key={values[1]}>
                  <CustomTableCell>{values[0]}</CustomTableCell>
                  <CustomTableCell>{values[1]}</CustomTableCell>
                </CustomTableRow>
              )
            })}
        </CustomTableBody>
      </CustomTable>
    </>
  )
}
