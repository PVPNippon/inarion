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
import { Download, CloudUpload, X, Check, CircleX, TriangleAlert, CircleAlert } from 'lucide-react'
import { CustomWidthDialogContent } from '@/components/ui/custom-dialog-content-width'
import {
  CustomTable,
  CustomTableHeader,
  CustomTableHead,
  CustomTableBody,
  CustomTableRow,
  CustomTableCell,
} from '@/components/ui/custom-table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Papa from 'papaparse'
import { classListHandler, customTableHandler } from '@/utils/virtualDOMHackers'
const uploadStateArray = ['empty', 'uploadComplete', 'showBadge', 'showTable', 'showDeletionResult']
const email = 'testadmin@pvp-test-domain2.com' //TODO:temporary bypass, remove when the apiClient module is ready

/**
 * Returns the number of occurrences of a given value in an array.
 * @param {array} array - the array to search in
 * @param {*} value - the value to search for
 * @returns {number} the number of occurrences
 */
function getOccurrence(array, value) {
  return array.filter((v) => v === value).length
}

/**
 * Calculates the reason for a filtered out item from a CSV data array.
 *
 * @param {array} allDataArray - The array of all data from the CSV file.
 * @param {object} filteredOutItem - The item that was filtered out.
 * @returns {string} The reason for the item being filtered out.
 */
function calculateReason(allDataArray, filteredOutItem) {
  if (filteredOutItem.email === '') {
    return 'Email address empty'
  } else if (getOccurrence(allDataArray, filteredOutItem.email) > 1) {
    return 'Duplicate'
  } else {
    return 'Email address format invalid'
  }
}

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
function mapAndFilterCsvData(data, setFilteredOutData) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  let filteredOut = []

  //handle mapping of different data formats(arrays or objects)
  const mappedData = data.map((item) => {
    const values = Array.isArray(item) ? item : Object.values(item)
    return {
      name: values[0].trim(),
      email: values[1].trim(),
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
    const allEmails = mappedData.map((item) => item.email).filter((email) => email !== '')

    filteredOut = mappedData.reduce((acc, item) => {
      if ((item.email === '' && item.name === '') || item.email.includes('Member Email')) return acc
      if (!uniqueDataArray.includes(item)) {
        item.invalidReason = calculateReason(allEmails, item)
        acc.push(item)
      }
      return acc
    }, [])
    console.log('filteredOutData', filteredOut)
    setFilteredOutData(filteredOut)
  }

  return [uniqueDataArray, filteredOut]
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
  const [invalidFileType, setInvalidFileType] = useState(false)
  const [filteredOutData, setFilteredOutData] = useState([])
  const [uploadError, setUploadError] = useState(false)
  const [dragState, setDragState] = useState(false)
  const dragRef = useRef(null)

  //a listener to add or remove the bg-accent class to the drag and drop area when a file is being dragged over
  useEffect(() => {
    if (dragState === true) {
      classListHandler({ componentRef: dragRef, classesToAdd: 'bg-accent' })
    } else {
      classListHandler({ componentRef: dragRef, classesToRemove: 'bg-accent' })
    }
  }, [dragState])

  const initialState = {
    status: 'empty',
  }

  /**
   * Handles the state of the upload process, such as whether the upload is in progress, complete, or showing a badge or table.
   * @param {object} state - The current state of the upload.
   * @param {object} action - The action to take on the state.
   * @returns {object} The new state after taking the action.
   */
  const uploadReducer = (state, action) => {
    switch (action.type) {
      case 'empty': //start screen
        return initialState

      case 'uploadInProgress': //upload in progress (spinner)
        return { status: 'uploadInProgress' }

      case 'uploadComplete': //upload complete(green checkbox)
        return { status: 'uploadComplete' }

      case 'showBadge': //display a removable badge with the file name
        return { status: 'showBadge' }

      case 'showTable': //display the parsed csv data as a table
        return { status: 'showTable' }

      case 'deletionInProgress': //deletion in progress (spinner2)
        return { status: 'deletionInProgress' }

      case 'showDeletionResult': //display the deletion result, which has 4 possible outcomes: success, partial success, nw error or group does not exist
        return { status: 'showDeletionResult' }

      default:
        return state
    }
  }

  const [uploadState, dispatchUploadState] = useReducer(uploadReducer, initialState)

  /**
   * Resets the component states to their initial values.
   *
   * This function clears the CSV data, file name, and filtered out data,
   * resets any file type and upload errors, clears the deletion result,
   * and sets the upload state to 'empty'.
   */
  function resetStates() {
    setCsvData([])
    setFileName('')
    setInvalidFileType(false)
    setFilteredOutData([])
    setUploadError(false)
    setDeletionResult([])
    dispatchUploadState({ type: 'empty' })
  }

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
    const [filteredData, filteredOut] = mapAndFilterCsvData(data, setFilteredOutData)

    //if filteredData is empty, it means the file wasn't parsed correctly, so display upload error and return
    if (filteredData.length === 0) {
      setFilteredOutData([])
      setUploadError(true)
      dispatchUploadState({ type: 'empty' })
      return
    }

    //otherwise, set the filtered and filtered out data to correstponding states and update the upload state
    //we need to store the filtered out data to display a separate table with the reason for each filtered out item
    setCsvData(filteredData)
    setFilteredOutData(filteredOut)
    setFileName(fileName)
    dispatchUploadState({ type: 'uploadComplete' })

    setTimeout(() => {
      dispatchUploadState({ type: 'showBadge' })
    }, 1000)
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
        let resultDataArray = results.data
        if (resultDataArray.length <= 2) {
          //the first 2 arrays are table name and table headers, so if there is no other data, it's not a valid CSV
          setUploadError(true)
          dispatchUploadState({ type: 'empty' })
          return
        }

        if (validateParsedDataArray) {
          const tableDataArrays = resultDataArray.slice(2) //remove table name and table headers
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
    setUploadError(false)
    if (file.type !== 'text/csv') {
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
              setUploadError(true)
              dispatchUploadState({ type: 'empty' })
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
                setUploadError(true)
                dispatchUploadState({ type: 'empty' })
              }
              return
            }
            handleUploadedDataAndState(resultData.data, file.name)
          },
        })
      } catch (error) {
        setUploadError(true)
        dispatchUploadState({ type: 'empty' })
      }
    }, 3000) // simulate a 3-second delay for dev purposes
  }

  const handleDelete = async () => {
    if (!groupEmail || csvData.length === 0) return

    try {
      dispatchUploadState({ type: 'deletionInProgress' })

      // try {
      const groupResponse = await axios.get(`http://localhost:4000/api/groups/group/${groupEmail}/?userEmail=${email}`)

      if (groupResponse.status === 200) {
        const memberList = csvData.map((memberObj) => Object.values(memberObj)[1])

        const response = await axios.delete(
          `http://localhost:4000/api/groups/group/${groupEmail}/members/?userEmail=${email}`,
          {
            headers: {
              //  Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            },
            data: { memberEmails: memberList },
          }
        )
        console.log('RESPONSE FROM BACKEND for status 200', response)
        setDeletionResult({ status: 'success', responseData: response.data })
      }
    } catch (err) {
      console.log('error', err)

      //error 400 means that the deletion was attempted, but failed for all members. The most probable cause is that the user uploaded a wrong file where all email addresses are not members of the target group.
      //for all other scenarios, display a generic error(for now)
      if (err.status === 404) {
        setDeletionResult({ status: 'error', errorStatus: 404, errorDetails: err })
      } else if (err.status === 400 && err.response.data) {
        setDeletionResult({ status: 'failure', responseData: err.response.data })
      } else {
        setDeletionResult({ status: 'error', errorStatus: 500, errorDetails: err })
      }
    } finally {
      setTimeout(() => {
        dispatchUploadState({ type: 'showDeletionResult' })
      }, 3000) //imitate a 3 second delay
    }
  }

  return (
    <div>
      <Dialog onOpenChange={() => resetStates()}>
        <DialogTrigger asChild>
          <Button variant="default">Delete Members via CSV</Button>
        </DialogTrigger>

        <CustomWidthDialogContent
          aria-describedby={undefined}
          customHeight="h-[826px]"
          customWidth="w-[880px]"
          customDialogCloseClassName="right-4 top-[-38px]"
          className="space-y-14"
          onInteractOutside={(e) => {
            resetStates()
          }}
        >
          <div className="flex flex-col p-4 space-y-7">
            <DialogHeader>
              <DialogTitle className="font-semibold text-2xl/8">Remove multiple group members</DialogTitle>
              <DialogDescription>
                You are about to remove multiple group member(s) from
                <span className="font-semibold"> {`${groupName} (${groupEmail})`}</span>.
              </DialogDescription>
            </DialogHeader>

            <div
              className={`${groupsStyles.roundBorder} ${groupsStyles.thinShadow} flex flex-col space-y-6 ${
                //temporarily set same height for all related screens
                'h-[538px]'
              } w-[768px] p-8`}
            >
              {uploadState.status !== 'deletionInProgress' && uploadState.status !== 'showDeletionResult' && (
                <div className="flex flex-col gap-y-4">
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
                    {uploadStateArray.indexOf(uploadState.status) <= 1 && <CsvTemplateDownloader />}
                    {invalidFileType && (
                      <div className="text-destructive text-sm/5">
                        Invalid file type. Only CSV files are allowed. Please upload a file with extension .csv.
                      </div>
                    )}
                    {uploadError && (
                      <div className="text-destructive text-sm/5">
                        Upload failed. Please check that the data in your CSV file is formatted correctly and try again.
                      </div>
                    )}
                    {uploadState.status === 'showTable' && filteredOutData && filteredOutData.length > 0 && (
                      <Warning filteredOutData={filteredOutData} />
                    )}
                    {csvData && uploadState.status === 'showBadge' && (
                      <CsvFileBadge
                        fileName={fileName}
                        setCsvData={setCsvData}
                        dispatchUploadState={dispatchUploadState}
                        setFilteredOutData={setFilteredOutData}
                      />
                    )}
                  </div>
                </div>
              )}

              {uploadState.status === 'empty' && (
                <div
                  ref={dragRef}
                  className={`${groupsStyles.uploadArea} border-dashed`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragState(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setDragState(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragState(false)
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
                <div className={`${groupsStyles.uploadArea} border-dashed`}>
                  <div className="loader"></div>
                  <p>Upload in progress</p>
                </div>
              )}
              {uploadState.status === 'uploadComplete' && (
                <div
                  className={`${groupsStyles.uploadArea} border-[#37B705] flex flex-col items-center justify-center gap-y-2`}
                >
                  <Check size={80} color={groupsStyles.semanticLightModeSuccess} strokeWidth={1} />
                  <p>Upload complete</p>
                </div>
              )}
              {uploadState.status === 'showTable' && <CsvTable csvData={csvData} />}
              {uploadState.status === 'deletionInProgress' && <Loader />}
              {uploadState.status === 'showDeletionResult' && (
                <div>
                  <div>
                    {deletionResult && deletionResult.status === 'error' && (
                      <DeletionError deletionResult={deletionResult} />
                    )}

                    {deletionResult && (deletionResult.status === 'success' || deletionResult.status === 'failure') && (
                      <DeletionResultScreen deletionResult={deletionResult} />
                    )}
                  </div>
                </div>
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
            <DialogFooter
              className={
                uploadState.status === 'showDeletionResult' && deletionResult.status === 'error'
                  ? 'md:justify-end'
                  : 'md:justify-between'
              }
            >
              {(uploadState.status === 'showTable' ||
                (uploadState.status === 'showDeletionResult' && deletionResult.status !== 'error')) && (
                <Button
                  className={`${groupsStyles.buttonPaddingWide}`}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const previousUploadStateStatus =
                      uploadStateArray[
                        uploadStateArray.indexOf(uploadState.status) > 0
                          ? uploadStateArray.indexOf(uploadState.status) - 1
                          : 0
                      ]

                    if (previousUploadStateStatus === 'empty') {
                      setCsvData([])
                      setFileName('')
                      setDeletionResult([])
                      setFilteredOutData([])
                    }
                    dispatchUploadState({ type: previousUploadStateStatus })
                  }}
                >
                  Back
                </Button>
              )}
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
              {uploadState.status === 'showDeletionResult' && (
                <DialogClose asChild>
                  <Button onClick={() => resetStates()} className={`${groupsStyles.buttonPaddingWide} `}>
                    Close
                  </Button>
                </DialogClose>
              )}
            </DialogFooter>
          )}
        </CustomWidthDialogContent>
      </Dialog>
    </div>
  )
}

export default DeleteMembersViaCsvDialog

function CsvTemplateDownloader() {
  return (
    <div className={`flex text-sm/5 gap-x-2.5 items-center  h-[36px]`}>
      <a
        href="/templates/members-list-sample.csv"
        download="members-list-sample.csv"
        className={`w-fit flex text-sm/5 gap-x-2.5 ${groupsStyles.secondaryTextChart5}`}
      >
        <Download size={20} />
        <span> Download blank CSV template</span>
      </a>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger tabIndex="-1">
            <CircleAlert size={16} className="stroke-destructive" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{`Important: Do not delete the header row in the template.`}</p>
            <p>{`These headings help make sure that the right members are`}</p>
            <p>{`removed from the group.`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

function CsvFileBadge({ fileName, setCsvData, hiddenClass, dispatchUploadState, setFilteredOutData }) {
  if (!fileName) return

  return (
    <div className={`flex items-center py-2 gap-x-3 ${hiddenClass}`}>
      <Badge className="text-base/6 font-normal py-1 px-6">{`Delete ${fileName} `}</Badge>
      <span
        role="button"
        onClick={() => {
          setCsvData([])
          setFilteredOutData([])
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
      <div className={`${groupsStyles.uploadAreaExtended} border-dashed`}>
        <div className="loader"></div>
        <p>Removal in progress</p>
      </div>
    </>
  )
}

function Warning({ filteredOutData }) {
  return (
    <Dialog>
      <div className="flex flex-row text-sm/5 gap-x-1">
        <div className="text-destructive">
          {`${filteredOutData.length} entries in the uploaded file were excluded from the list.`}
        </div>
        <DialogTrigger asChild>
          <div className={`w-fit ${groupsStyles.secondaryTextChart5} cursor-pointer `}>See details</div>
        </DialogTrigger>
      </div>
      <CustomWidthDialogContent customDialogCloseClassName="right-4 top-4" className="min-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            <span className="leading-7">Exclusion details</span>
          </DialogTitle>
          <DialogDescription>
            <span className="text-xs">The following entries were excluded from the list of users set for removal.</span>
          </DialogDescription>
        </DialogHeader>
        <CustomTable>
          <CustomTableHeader>
            <CustomTableRow className="text-nowrap text-xs/4">
              <CustomTableHead className="font-semibold px-6">Email address or name</CustomTableHead>
              <CustomTableHead className="font-semibold px-6">Reason for exclusion</CustomTableHead>
            </CustomTableRow>
          </CustomTableHeader>
          <CustomTableBody>
            {filteredOutData &&
              filteredOutData.map((memberObj, index) => {
                const values = Object.values(memberObj)
                return (
                  <CustomTableRow className="text-xs/4 text-nowrap rounded-none" key={index}>
                    <CustomTableCell className="px-6">{values[1] === '' ? values[0] : values[1]}</CustomTableCell>
                    <CustomTableCell className="px-6">{values[2]}</CustomTableCell>
                  </CustomTableRow>
                )
              })}
          </CustomTableBody>
        </CustomTable>
      </CustomWidthDialogContent>
    </Dialog>
  )
}

function CsvTable({ csvData }) {
  const tableRef = useRef(null)

  useEffect(() => {
    if (csvData.length === 0) return
    const condition = csvData.length >= 11
    customTableHandler({
      tableRef,
      classesToRemove: 'h-[200px]',
      classesToAdd1: 'h-[392px]',
      classesToAdd2: `h-[${40 + csvData.length * 32}px]`,
      condition: condition,
    })
  }, [csvData])
  return (
    <>
      <CustomTable ref={tableRef}>
        <CustomTableHeader>
          <CustomTableRow className="text-nowrap text-sm/4">
            <CustomTableHead className="font-semibold px-6">Member name</CustomTableHead>
            <CustomTableHead className="font-semibold px-6">Member email</CustomTableHead>
          </CustomTableRow>
        </CustomTableHeader>
        <CustomTableBody>
          {csvData &&
            csvData.map((memberObj) => {
              const values = Object.values(memberObj)
              return (
                <CustomTableRow className="text-xs/4 text-nowrap rounded-none" key={values[1]}>
                  <CustomTableCell className="px-6">{values[0]}</CustomTableCell>
                  <CustomTableCell className="px-6">{values[1]}</CustomTableCell>
                </CustomTableRow>
              )
            })}
        </CustomTableBody>
      </CustomTable>
    </>
  )
}

function DeletionError({ deletionResult }) {
  return (
    <>
      <div className={`${groupsStyles.uploadAreaExtended} border-destructive`}>
        <CircleX size={80} strokeWidth={1} className="stroke-destructive" />
        <div className="flex flex-col gap-y-4 items-center justify-center text-center">
          <div className="font-semibold text-base/6">There was an error</div>
          {deletionResult.errorStatus === 500 && (
            <div>
              {' '}
              Members could not be removed from the group due to
              <br />
              an internal error. Please wait a while and try again.
            </div>
          )}
          {deletionResult.errorStatus === 404 && (
            <div>
              {' '}
              The group no longer exists, so members could not be
              <br />
              removed.
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function DeletionResultScreen({ deletionResult }) {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-4">
        <div className="font-semibold text-2xl/8">Results</div>
        <div className={`flex text-base gap-x-2  items-center `}>
          {(deletionResult.status === 'failure' || deletionResult.responseData.undeletedMembers.length > 0) && (
            <>
              <TriangleAlert size={21} color={groupsStyles.semanticDarkModeFailure} strokeWidth={1.5} />
              <div>Removal failed for some users.</div>
              <a className={groupsStyles.secondaryTextChart5} href="http://localhost:3000" target="_blank">
                Learn more
              </a>
            </>
          )}
          {deletionResult.status === 'success' && deletionResult.responseData.undeletedMembers.length === 0 && (
            <>
              <Check size={21} color={groupsStyles.semanticLightModeSuccess} strokeWidth={1.5} />
              <div>{`${deletionResult.responseData.deletedMembers.length} member(s) were removed successfully`}</div>
            </>
          )}
        </div>
      </div>
      <DeletionResultTable deletionResult={deletionResult} />
    </div>
  )
}

function DeletionResultTable({ deletionResult }) {
  const [memberList, setMemberList] = useState([])
  const data = deletionResult.responseData
  let deletedMembersArray = []
  let undeletedMembersArray = []
  const resultTableRef = useRef(null)

  useEffect(() => {
    if (data.deletedMembers.length > 0) {
      deletedMembersArray = data.deletedMembers.map((member) => {
        return {
          email: member.email,
          status: 'Removed successfully',
          reason: '-',
        }
      })
    }

    if (data.undeletedMembers.length > 0) {
      undeletedMembersArray = data.undeletedMembers.map((member) => {
        let reason
        if (member.statusCode === 400 || member.statusCode === 404) {
          reason = 'Not a member'
        } else if (member.statusCode === 403 && member.errorMessage.includes('Request rate higher than configured')) {
          reason = 'Request rate exceeded'
        } else {
          reason = '-'
        }
        return {
          email: member.email,
          status: 'Removal failed',
          reason,
        }
      })
    }

    setMemberList([...deletedMembersArray, ...undeletedMembersArray])
  }, [])

  useEffect(() => {
    if (memberList.length === 0) return
    const condition = memberList.length >= 10
    customTableHandler({
      tableRef: resultTableRef,
      classesToRemove: 'h-[200px]',
      classesToAdd1: 'h-[360px]',
      classesToAdd2: `h-[${40 + memberList.length * 32}px]`,
      condition: condition,
    })
  }, [memberList])

  return (
    <CustomTable ref={resultTableRef}>
      <CustomTableHeader>
        <CustomTableRow className="text-nowrap text-sm/4">
          <CustomTableHead className="font-semibold px-6">Email address</CustomTableHead>
          <CustomTableHead className="font-semibold px-6">Status</CustomTableHead>
          <CustomTableHead className="font-semibold px-6">Reason for failure</CustomTableHead>
        </CustomTableRow>
      </CustomTableHeader>
      <CustomTableBody>
        {memberList &&
          memberList.map((member, index) => (
            <CustomTableRow className="text-xs/4 text-nowrap rounded-none" key={index + member.email}>
              <CustomTableCell className="px-6">{member.email}</CustomTableCell>
              <CustomTableCell className="px-6 flex items-center gap-x-2">
                {member.status === 'Removed successfully' ? (
                  <Check size={16} color={groupsStyles.semanticLightModeSuccess} strokeWidth={1.5} />
                ) : (
                  <CircleX size={16} className="stroke-destructive" strokeWidth={1.5} />
                )}
                {member.status}
              </CustomTableCell>
              <CustomTableCell className="px-6">{member.reason}</CustomTableCell>
            </CustomTableRow>
          ))}
      </CustomTableBody>
    </CustomTable>
  )
}
