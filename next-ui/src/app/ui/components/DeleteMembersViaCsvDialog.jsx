/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'
import React, { useState, useEffect, useRef, useReducer } from 'react'

//shadcn and custom components
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
import { CustomSpinner } from '@/components/ui/custom-spinner'

//icons
import { Download, CloudUpload, X, Check, CircleX, TriangleAlert, CircleAlert } from 'lucide-react'

//utility functions and custom hooks
import { classListHandler, customTableHandler } from '@/utils/virtualDOMHackers'

//variables
import { groupsStyles, groupStrings, groupElementIds, emailRegex } from '@/app/ui/variables/group-variables'

//third party libraries
import axios from 'axios'
import Papa from 'papaparse'

//constants
//upload state array for the "Back button"(states which are not needed to be returned to via Back btn(such as "uploadInProgress" etc) are omitted)
const uploadStateArray = [
  groupStrings.uploadStates.empty,
  groupStrings.uploadStates.uploadComplete,
  groupStrings.uploadStates.showBadge,
  groupStrings.uploadStates.showTable,
  groupStrings.uploadStates.showDeletionResult,
]
const email = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL //temporarily bypass login and jwttoken check

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
//the reason the parsed data comes in 2 different formats is because of macOS csvexport where a user might check the  "Include table names" checkbox
function mapAndFilterCsvData(data, setFilteredOutData) {
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

  //if the length of the data array is greater than the unique data array, extract the filtered out data
  //we need the data to display a separate table with the reason for each filtered out item
  if (data.length > uniqueDataArray.length) {
    const allEmails = mappedData.map((item) => item.email).filter((email) => email !== '')

    filteredOut = mappedData.reduce((acc, item) => {
      if ((item.email === '' && item.name === '') || item.email.includes('Member Email')) return acc //skip empty rows and headers

      //calculate the reason for the filtered out item
      if (!uniqueDataArray.includes(item)) {
        item.invalidReason = calculateReason(allEmails, item)
        acc.push(item)
      }
      return acc
    }, [])

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

/**
 * A Dialog component for deleting multiple group members via a CSV file.
 * @param {object} props - The component props.
 * @param {string} props.groupName - The name of the group.
 * @param {string} props.groupEmail - The email address of the group.
 * @returns {ReactElement} The DeleteMembersViaCsvDialog component.
 */
function DeleteMembersViaCsvDialog({ groupName, groupEmail }) {
  const [deletionResult, setDeletionResult] = useState([]) //state for the deletion result
  const [csvData, setCsvData] = useState([]) //state for the parsed CSV data
  const [fileName, setFileName] = useState('') //state for the name of the CSV file
  const [invalidFileType, setInvalidFileType] = useState(false) //state for invalid file type error message, displayed when non-csv file upload is attempted
  const [filteredOutData, setFilteredOutData] = useState([]) //state for the filtered out incorrect csv data(empty or invalid email addresses, duplicates etc)
  const [uploadError, setUploadError] = useState(false) //state for upload error message(if any) diplayed when csv file is not parsed correctly
  const [dragState, setDragState] = useState(false) //state for the drag and drop area to trigger event when a file is being dragged over
  const dragRef = useRef(null) //reference to the drag and drop area
  const initialState = {
    status: groupStrings.uploadStates.empty, //initial upload state(start screen)
  }

  /**
   * Handles the state of the upload process, such as whether the upload is in progress, complete, or showing a badge or table.
   * @param {object} state - The current state of the upload.
   * @param {object} action - The action to take on the state.
   * @returns {object} The new state after taking the action.
   */
  //Note: action type(case) names and status names do not need to be the same, I just unified them for simplicity
  const uploadReducer = (state, action) => {
    switch (action.type) {
      case groupStrings.uploadStates.empty: //start screen
        return initialState

      case groupStrings.uploadStates.uploadInProgress: //upload in progress (spinner)
        return { status: groupStrings.uploadStates.uploadInProgress }

      case groupStrings.uploadStates.uploadComplete: //upload complete(green check)
        return { status: groupStrings.uploadStates.uploadComplete }

      case groupStrings.uploadStates.showBadge: //display a removable badge with the file name
        return { status: groupStrings.uploadStates.showBadge }

      case groupStrings.uploadStates.showTable: //display the parsed csv data as a table
        return { status: groupStrings.uploadStates.showTable }

      case groupStrings.uploadStates.deletionInProgress: //deletion in progress (spinner2)
        return { status: groupStrings.uploadStates.deletionInProgress }

      case groupStrings.uploadStates.showDeletionResult: //display the deletion result, which has 4 possible outcomes: success, partial success, nw error or group does not exist anymore
        return { status: groupStrings.uploadStates.showDeletionResult }

      default:
        return state
    }
  }

  const [uploadState, dispatchUploadState] = useReducer(uploadReducer, initialState) //state for the upload process

  //a listener to add or remove the bg-accent class to the drag and drop area when a file is being dragged over
  useEffect(() => {
    if (dragState === true) {
      classListHandler({ componentRef: dragRef, classesToAdd: 'bg-accent' })
    } else {
      classListHandler({ componentRef: dragRef, classesToRemove: 'bg-accent' })
    }
  }, [dragState])

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
    dispatchUploadState({ type: groupStrings.uploadStates.empty })
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

    //if filteredData is empty, it means the data format is incorrect or all data is invalid, so display upload error and return
    if (filteredData.length === 0) {
      setFilteredOutData([])
      setUploadError(true)
      dispatchUploadState({ type: groupStrings.uploadStates.empty })
      return
    }

    //otherwise, set the filtered and filtered out data to correstponding states and update the upload state
    //we need to store the filtered out data to display a separate table with the reason for each filtered out item
    setCsvData(filteredData)
    setFilteredOutData(filteredOut)
    setFileName(fileName)
    dispatchUploadState({ type: groupStrings.uploadStates.uploadComplete })

    //display the green check for 1 second, then display the badge with the filename
    setTimeout(() => {
      dispatchUploadState({ type: groupStrings.uploadStates.showBadge })
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
      "Member Email [ required ]": "group@yourdomain.com"
  },
  {
      "Member Name [ optional ]": "Group2",
      "Member Email [ required ]": "group2@yourdomain.com"
  }
]) 

  However, checking the checkbox returns a completely different format of data, so we need to handle it separately. It's an array of arrays where
  the first array has length 1 and contains the table name(i.e. the name of the file which were exported), the second array has length 2 and contains table headers.
  The rest of arrays have length 2 and contain a table row data.
  Note that we only need the member email (second column) for the deletion. First column (name) can be empty or has an incorrect(i.e. not matching the actual user name) value. Third or more columns(if present) will be ignored.
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
          dispatchUploadState({ type: groupStrings.uploadStates.empty })
          return
        }

        //if parsed data passes validation, remove the table name and table headers and further the data for mapping and filtering
        //otherwise, display upload error
        if (validateParsedDataArray(resultDataArray) === true) {
          const tableDataArrays = resultDataArray.slice(2) //remove table name and table headers
          handleUploadedDataAndState(tableDataArrays, file.name)
        } else {
          setUploadError(true)
          dispatchUploadState({ type: groupStrings.uploadStates.empty })
        }
      },
    })
  }

  /**
   * Function to parse a CSV file and set the component state with the parsed data.
   * @param {File} file - The CSV file to be parsed.
   */
  function handleCsvUpload(file) {
    //clear errors
    setInvalidFileType(false)
    setUploadError(false)

    //check file type and display error message if not csv
    if (file.type !== 'text/csv') {
      setInvalidFileType(true)
      return
    }

    //display spinner
    dispatchUploadState({ type: groupStrings.uploadStates.uploadInProgress })

    setTimeout(() => {
      //Add try-catch for unexpected scenarios such as unsupported encoding etc.
      try {
        //attempt parsing the file in a normal way
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,

          complete: function (results) {
            const resultData = results

            //if data is empty, return and display upload error
            if (resultData.data.length === 0) {
              setUploadError(true)
              dispatchUploadState({ type: groupStrings.uploadStates.empty })
              return
            }

            //if the error array is not empty and it contains specific errors, attempt at fallback parse. Otherwise, display upload error
            if (resultData.errors.length > 0) {
              if (
                resultData.errors[0]?.code === 'UndetectableDelimiter' &&
                resultData.errors[1]?.code === 'TooManyFields' &&
                resultData.meta?.fields.length === 1
              ) {
                fallbackParse(file)
              } else {
                setUploadError(true)
                dispatchUploadState({ type: groupStrings.uploadStates.empty })
              }
              return
            }
            handleUploadedDataAndState(resultData.data, file.name)
          },
        })
      } catch (error) {
        setUploadError(true)
        dispatchUploadState({ type: groupStrings.uploadStates.empty })
      }
    }, 1000) // simulate upload time
  }

  /**
   * A function to delete the members in the CSV file from the specified group.
   * It takes the group email and the parsed CSV data as parameters.
   * It first checks if the group exists and if the CSV data is not empty.
   * If the checks pass, it sends a DELETE request to the API with the group email and the list of member emails in the CSV file.
   * It then sets the component state with the response from the API.
   * If there is an error, it catches the error and sets the component state with the error details.
   * Finally, it imitates a 3 second delay before displaying the deletion result.
   */
  const handleDelete = async () => {
    if (!groupEmail || csvData.length === 0) return

    try {
      dispatchUploadState({ type: groupStrings.uploadStates.deletionInProgress }) //display spinner

      //make sure the group still exists
      //I added this check in case someone else has deleted the group unbeknowst to the admin, but it's still displayed in UI due to timelag or cached data
      //It will help to reduce API calls since each member is deleted individually
      const groupResponse = await axios.get(`http://localhost:4000/api/groups/group/${groupEmail}/?userEmail=${email}`)

      //if the group still exists, proceed wih the 2nd API call to delete the members
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
        //if all members have been deleted successfully, the backend will send a 200 response. If deletion was successfull partially, it will send a 207 response.
        //  Set the component state accordingly.
        setDeletionResult({ status: groupStrings.deletionResultStatuses.success, responseData: response.data })
      }
    } catch (err) {
      console.log('error', err)

      //error 404 means that the group no longer exists
      //error 400 means that the deletion was attempted, but failed for all members. The most probable cause is that the user uploaded a wrong file where all email addresses are not members of the target group.
      //for all other scenarios, display a generic error(for now)
      if (err.status === 404) {
        setDeletionResult({ status: groupStrings.deletionResultStatuses.error, errorStatus: 404, errorDetails: err })
      } else if (err.status === 400 && err.response.data) {
        setDeletionResult({ status: groupStrings.deletionResultStatuses.failure, responseData: err.response.data })
      } else {
        setDeletionResult({ status: groupStrings.deletionResultStatuses.error, errorStatus: 500, errorDetails: err })
      }
    } finally {
      setTimeout(() => {
        dispatchUploadState({ type: groupStrings.uploadStates.showDeletionResult })
      }, 1000) //imitate a 1 second delay
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
                //set fixed height so that all related screens look consistent
                'h-[538px]'
              } w-[768px] p-8`}
            >
              {uploadState.status !== groupStrings.uploadStates.deletionInProgress &&
                uploadState.status !== groupStrings.uploadStates.showDeletionResult && (
                  <div className="flex flex-col gap-y-4">
                    <div className="flex flex-col gap-y-4">
                      <div className="flex flex-col gap-y-1">
                        <div className="font-semibold text-2xl/8">
                          {uploadState.status === groupStrings.uploadStates.showTable ? 'Confirm list' : 'Upload CSV'}
                        </div>
                        <div className="text-muted-foreground text-sm/5">
                          {uploadState.status === groupStrings.uploadStates.showTable
                            ? 'Review the list of members set for removal.'
                            : 'Upload a CSV file and review the list of member(s) who will be removed.'}
                        </div>
                      </div>

                      {/* Download csv template link */}
                      {uploadStateArray.indexOf(uploadState.status) <= 1 && <CsvTemplateDownloader />}

                      {/* Error messages */}
                      {invalidFileType && (
                        <div className="text-destructive text-sm/5">
                          Invalid file type. Only CSV files are allowed. Please upload a file with extension .csv.
                        </div>
                      )}

                      {uploadError && (
                        <div className="text-destructive text-sm/5">
                          Upload failed. Please check that the data in your CSV file is formatted correctly and try
                          again.
                        </div>
                      )}

                      {/* Warning component if there is a filtered out data */}
                      {uploadState.status === groupStrings.uploadStates.showTable &&
                        filteredOutData &&
                        filteredOutData.length > 0 && <Warning filteredOutData={filteredOutData} />}

                      {/* CSV file badge */}
                      {csvData && uploadState.status === groupStrings.uploadStates.showBadge && (
                        <CsvFileBadge
                          fileName={fileName}
                          dispatchUploadState={dispatchUploadState}
                          resetStates={resetStates}
                        />
                      )}
                    </div>
                  </div>
                )}

              {/* Upload area */}
              {uploadState.status === groupStrings.uploadStates.empty && (
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
                    //  if (e.dataTransfer.files[0].type !== 'text/csv') return false //removed on purpose because it's not user friendly(keep it for no for the case we decide to add it back)
                    handleCsvUpload(e.dataTransfer.files[0])
                  }}
                >
                  <CloudUpload size={80} className="stroke-muted-foreground" strokeWidth={1} />
                  <Button
                    className={groupsStyles.buttonPadding}
                    onClick={() => document.getElementById(groupElementIds.deleteMembersByCsvFileInput).click()}
                    variant="outline"
                  >
                    Select a CSV file to upload
                  </Button>
                  <span>or</span>
                  <span>Drag and drop it here</span>
                  <input
                    accept=".csv"
                    id={groupElementIds.deleteMembersByCsvFileInput}
                    onChange={(e) => {
                      handleCsvUpload(e.target.files[0])
                    }}
                    type="file"
                    className="hidden"
                  />
                </div>
              )}

              {/* Upload in progress spinner */}
              {uploadState.status === groupStrings.uploadStates.uploadInProgress && (
                <div className={`${groupsStyles.uploadArea} border-dashed`}>
                  <CustomSpinner />
                  <p>Upload in progress</p>
                </div>
              )}

              {/* Upload complete message and green check icon */}
              {uploadState.status === groupStrings.uploadStates.uploadComplete && (
                <div
                  className={`${groupsStyles.uploadArea} border-[#37B705] flex flex-col items-center justify-center gap-y-2`}
                >
                  <Check size={80} color={groupsStyles.semanticLightModeSuccess} strokeWidth={1} />
                  <p>Upload complete</p>
                </div>
              )}

              {/* CSV table with parsed data */}
              {uploadState.status === groupStrings.uploadStates.showTable && <CsvTable csvData={csvData} />}

              {/* Deletion in progress spinner */}
              {uploadState.status === groupStrings.uploadStates.deletionInProgress && <Loader />}

              {/* Deletion result table or error */}
              {uploadState.status === groupStrings.uploadStates.showDeletionResult && (
                <div>
                  {/* Deletion error screen */}
                  {/* Comes in 2 variants: group no longer exists or internal error */}
                  {deletionResult && deletionResult.status === groupStrings.deletionResultStatuses.error && (
                    <DeletionError deletionResult={deletionResult} />
                  )}

                  {/* Deletion result screen */}
                  {/* Comes in 2 variants: success(all members deleted) or failure(some/all members not deleted) */}
                  {deletionResult &&
                    (deletionResult.status === groupStrings.deletionResultStatuses.success ||
                      deletionResult.status === groupStrings.deletionResultStatuses.failure) && (
                      <DeletionResultScreen deletionResult={deletionResult} />
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Dialog footer with Next button */}
          {uploadState.status !== groupStrings.uploadStates.showTable &&
            uploadState.status !== groupStrings.uploadStates.deletionInProgress &&
            uploadState.status !== groupStrings.uploadStates.showDeletionResult && (
              <DialogFooter>
                <Button
                  className={groupsStyles.buttonPaddingWide}
                  onClick={() => {
                    dispatchUploadState({ type: groupStrings.uploadStates.showTable })
                  }}
                  disabled={
                    uploadState.status !== groupStrings.uploadStates.showBadge &&
                    uploadState.status !== groupStrings.uploadStates.showTable
                  }
                >
                  Next
                </Button>
              </DialogFooter>
            )}

          {/* Dialog footer with Back and Remove/Close buttons */}
          {(uploadState.status === groupStrings.uploadStates.showTable ||
            uploadState.status === groupStrings.uploadStates.deletionInProgress ||
            uploadState.status === groupStrings.uploadStates.showDeletionResult) && (
            <DialogFooter
              className={
                uploadState.status === groupStrings.uploadStates.deletionInProgress ||
                (uploadState.status === groupStrings.uploadStates.showDeletionResult &&
                  deletionResult.status === groupStrings.deletionResultStatuses.error)
                  ? 'md:justify-end'
                  : 'md:justify-between'
              }
            >
              {(uploadState.status === groupStrings.uploadStates.showTable ||
                (uploadState.status === groupStrings.uploadStates.showDeletionResult &&
                  deletionResult.status !== groupStrings.deletionResultStatuses.error)) && (
                // Back button
                <Button
                  className={`${groupsStyles.buttonPaddingWide}`}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // The Back button leads back to the previous upload state(or initial state if the previous state is not found in the uploadStateArray)
                    const previousUploadStateStatus =
                      uploadStateArray[
                        uploadStateArray.indexOf(uploadState.status) > 0
                          ? uploadStateArray.indexOf(uploadState.status) - 1
                          : 0
                      ]

                    //Clear the state if the previous state is the initial state
                    if (previousUploadStateStatus === groupStrings.uploadStates.empty) resetStates()
                    dispatchUploadState({ type: previousUploadStateStatus })
                  }}
                >
                  Back
                </Button>
              )}

              {/* Remove button, triggers deletion confirmation dialog */}
              {(uploadState.status === groupStrings.uploadStates.showTable ||
                uploadState.status === groupStrings.uploadStates.deletionInProgress) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className={groupsStyles.buttonPaddingWide}
                      disabled={uploadState.status === groupStrings.uploadStates.deletionInProgress}
                    >
                      Remove
                    </Button>
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

              {/* Close button */}
              {uploadState.status === groupStrings.uploadStates.showDeletionResult && (
                <DialogClose asChild>
                  <Button onClick={() => resetStates()} className={`${groupsStyles.buttonPaddingWide}`}>
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

/**
 * A component for downloading a blank CSV template for removing members from a group.
 *
 * @returns {JSX.Element} A `div` containing a link to download the template and a tooltip with important information.
 */
function CsvTemplateDownloader() {
  return (
    <div className={`flex text-sm/5 gap-x-2.5 items-center  h-[36px]`}>
      <a
        href={groupStrings.deleteMembersByCsvTemplateLink}
        download={groupStrings.deleteMembersByCsvTemplateFileName}
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

/**
 * A component to display a badge containing the name of a CSV file uploaded for deleting members from a group.
 *
 * The badge has a close button which, when clicked, resets the component states and sets the upload state to 'empty'.
 *
 * @param {string} fileName - The name of the uploaded CSV file.
 * @param {React.Dispatch<UploadState>} dispatchUploadState - The dispatch function for the upload state reducer.
 * @param {function} resetStates - The function to reset the component states.
 * @returns {JSX.Element} A `div` containing a badge with the file name and a close button.
 */
function CsvFileBadge({ fileName, dispatchUploadState, resetStates }) {
  if (!fileName) return

  return (
    <div className={`flex items-center py-2 gap-x-3`}>
      <Badge className="text-base/6 font-normal py-1 px-6">{`Delete ${fileName} `}</Badge>
      <span
        role="button"
        onClick={() => {
          resetStates()
          dispatchUploadState({ type: groupStrings.uploadStates.empty })
        }}
      >
        <X size={24} className="stroke-muted-foreground cursor-pointer" />
      </span>
    </div>
  )
}

/**
 * A component for displaying a loading animation while members are being removed from a group.
 *
 * Contains a dashed border, a loading animation, and a message indicating that the removal is in progress.
 *
 * @returns {JSX.Element} A `div` containing the loading animation and message.
 */
function Loader() {
  return (
    <div className={`${groupsStyles.uploadAreaExtended} border-dashed`}>
      <CustomSpinner />
      <p>Removal in progress</p>
    </div>
  )
}

/**
 * A component to display a warning about the number of entries in a CSV file that were excluded from the list of users to be removed from a group.
 *
 * The component displays a message indicating the number of excluded entries and a link to see the details of which entries were excluded. When the link is clicked, a dialog opens to show the excluded entries.
 *
 * @param {object[]} filteredOutData - An array of objects containing the excluded entries, where each object has a name, email, and reason for exclusion.
 * @returns {JSX.Element} A `div` containing the warning message and link to see the details.
 */
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
                    {/* Column 1 displays the email address or name of the member if email is empty */}
                    <CustomTableCell className="px-6">{values[1] === '' ? values[0] : values[1]}</CustomTableCell>
                    {/* Column 2 displays the reason for exclusion */}
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

/**
 * A table component to display CSV data.
 *
 * The component takes a 2D array of CSV data as a prop and displays it in a table.
 * The table's height is adjusted based on the number of rows in the data.
 * If the number of rows is less than 11, the table's height is set to 392px.
 * If the number of rows is 11 or more, the table's height is set to a value that is
 * calculated based on the number of rows, such that each row is 32px tall, plus
 * an additional 40px for the table's header and padding.
 *
 * @param {{ csvData: object[][] }} props - The component props.
 * @prop {object[][]} csvData - The CSV data to be displayed in the table.
 * @returns {JSX.Element} The `CsvTable` component.
 */
function CsvTable({ csvData }) {
  const tableRef = useRef(null)

  //To understand what the heck is happening here, read the docstring above, "Cody" explained it well.
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

/**
 * A component to display an error message when the deletion of members fails due to internal error or group not found.
 * The difference between this component and DeletionResultScreen(status: "failure") is that this component is displayed for errors which occured before the actual deletion was even attempted(i.e. before the actual API call to the member deletion endpoint was made.)
 * The component visually indicates an error using a styling class and an icon.
 * It provides specific messages based on the error status code from the deletion result:
 * - If the error status is 500, it suggests an internal error and advises retrying later.
 * - If the error status is 404, it indicates that the group no longer exists.
 *
 * @param {object} deletionResult - The result object containing error details.
 * @param {number} deletionResult.errorStatus - The status code of the error encountered.
 * @returns {JSX.Element} A `div` containing the error message and icon.
 */
function DeletionError({ deletionResult }) {
  return (
    <div className={`${groupsStyles.uploadAreaExtended} border-destructive`}>
      <CircleX size={80} strokeWidth={1} className="stroke-destructive" />
      <div className="flex flex-col gap-y-4 items-center justify-center text-center">
        <div className="font-semibold text-base/6">There was an error</div>
        {deletionResult.errorStatus === 500 && (
          <div>
            Members could not be removed from the group due to
            <br />
            an internal error. Please wait a while and try again.
          </div>
        )}
        {deletionResult.errorStatus === 404 && (
          <div>
            The group no longer exists, so members could not be
            <br />
            removed.
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * A component to display the results of a group member deletion operation.
 *
 * The component receives the deletion result object as a prop and displays the result
 * in a visually appealing format(Looks like "Cody" thinks our designs are pretty, thank you, "Cody"). It also provides a link to a page with more information
 * if the deletion was not successful for all users.
 *
 * The component displays the number of users that were removed successfully and the number
 * of users that were not removed due to errors.
 *
 * @param {object} deletionResult - The result object containing the details of the deletion operation.
 * @prop {string} deletionResult.status - The status of the deletion operation (success or failure).
 * @prop {object} deletionResult.responseData - An object containing the results of the deletion operation.
 * @prop {number} deletionResult.responseData.deletedMembers - The number of users that were removed successfully.
 * @prop {number} deletionResult.responseData.undeletedMembers - The number of users that were not removed due to errors.
 * @returns {JSX.Element} The rendered component for displaying the deletion result.
 */
function DeletionResultScreen({ deletionResult }) {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-4">
        <div className="font-semibold text-2xl/8">Results</div>
        <div className={`flex text-base gap-x-2 items-center`}>
          {/* Variant 1 of the deletion result: some or all members were not deleted due to errors */}
          {(deletionResult.status === groupStrings.deletionResultStatuses.failure ||
            deletionResult.responseData.undeletedMembers.length > 0) && (
            <>
              <TriangleAlert size={21} color={groupsStyles.semanticDarkModeFailure} strokeWidth={1.5} />
              <div>Removal failed for some users.</div>
              <a className={groupsStyles.secondaryTextChart5} href="http://localhost:3000" target="_blank">
                Learn more
              </a>
            </>
          )}

          {/* Variant 2 of the deletion result: all members were deleted successfully */}
          {deletionResult.status === groupStrings.deletionResultStatuses.success &&
            deletionResult.responseData.undeletedMembers.length === 0 && (
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

/**
 * A component to display the results of a group member deletion operation
 * in a table format. The component receives the deletion result object as a
 * prop and displays the result in a table with the following columns:
 * - Email address
 * - Status
 * - Reason for failure
 *
 * The component displays the number of users that were removed successfully
 * and the number of users that were not removed due to errors.
 *
 * @param {object} deletionResult - The result object containing the details of the deletion operation.
 * @prop {string} deletionResult.status - The status of the deletion operation (success or failure).
 * @prop {object} deletionResult.responseData - An object containing the results of the deletion operation.
 * @prop {number} deletionResult.responseData.deletedMembers - The number of users that were removed successfully.
 * @prop {number} deletionResult.responseData.undeletedMembers - The number of users that were not removed due to errors.
 * @returns {JSX.Element} The rendered component for displaying the deletion result in a table format.
 */
function DeletionResultTable({ deletionResult }) {
  const [memberList, setMemberList] = useState([])
  const data = deletionResult.responseData
  let deletedMembersArray = []
  let undeletedMembersArray = []
  const resultTableRef = useRef(null)

  //create column data from deleted member array and undeleted member array(if any)
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

    //as of now there are 2 reasons for undeleted members: not a member or request rate exceeded
    //for any other possible reasons we will show '-'
    //because we don't want to show the error message directly to the user(it's not intuitive, thanks to ggl)
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

  //Adjusts the height of the table based on the number of rows.
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
                {/* Display the appropriate icon based on the status */}
                {member.status === 'Removed successfully' ? (
                  <Check size={16} color={groupsStyles.semanticLightModeSuccess} strokeWidth={1.5} />
                ) : (
                  <CircleX size={16} className="stroke-destructive" strokeWidth={1.5} />
                )}
                {member.status}
              </CustomTableCell>
              {/* Display the reason for failure (or a hyphen if not available) */}
              <CustomTableCell className="px-6">{member.reason}</CustomTableCell>
            </CustomTableRow>
          ))}
      </CustomTableBody>
    </CustomTable>
  )
}
