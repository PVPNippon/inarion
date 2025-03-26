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

//icons
import { Download, CloudUpload, X, Check, CircleX, TriangleAlert, CircleAlert } from 'lucide-react'

//utility functions and custom hooks
import { classListHandler, customTableHandler } from '@/utils/virtualDOMHackers'

//variables
// import { groupsStyles, groupStrings, groupElementIds, emailRegex } from '@/app/ui/variables/group-variables'

// user variables
import { userStyles, userStrings, userElementIds, emailRegex } from '@/app/ui/variables/user-variables'

//third party libraries
import axios from 'axios'
import Papa from 'papaparse'

//constants
//upload state array for the "Back button"(states which are not needed to be returned to via Back btn(such as "uploadInProgress" etc) are omitted)
const uploadStateArray = [
  userStrings.uploadStates.empty,
  userStrings.uploadStates.uploadComplete,
  userStrings.uploadStates.showBadge,
  userStrings.uploadStates.showTable,
  userStrings.uploadStates.showDeletionResult,
]
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
  //Note: we cannot filter out potential non-users or misspelled emails if they pass regex, it will only be known after the API call
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
      if ((item.email === '' && item.name === '') || item.email.includes('User Email')) return acc //skip empty rows and headers

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
 * Validates a parsed CSV data array.
 *
 * This function checks if the provided data is a valid structure for CSV parsing.
 * It ensures that the data is an array of arrays and that each sub-array (except the first)
 * contains at least two elements. This function is typically used for CSV data where
 * the first sub-array represents metadata or headers, and subsequent sub-arrays represent
 * rows of data with at least a name and email.
 *
 * @param {Array} data - The parsed CSV data to validate.
 * @returns {boolean} - Returns true if the data is valid, otherwise false.
 */
function validateParsedDataArray(data) {
  return (
    Array.isArray(data) && data.every((item) => Array.isArray(item)) && data.slice(1).every((item) => item.length >= 2)
  )
}
/**
 * A dialog component for turning off 2-step verification for multiple users.
 * @prop {import('react').Dispatch<import('react').SetStateAction<import('./turn-off-2sv-via-csv.types').TurnOffResult>>}
 *     setTurnOffResult - A state to store the result of turning off 2-step verification.
 * @prop {import('react').Dispatch<import('react').SetStateAction<import('./turn-off-2sv-via-csv.types').UploadState>>}
 *     dispatchUploadState - A state to store the upload state.
 * @prop {import('react').Dispatch<import('react').SetStateAction<string>>} setFileName - A state to store the name of the uploaded CSV file.
 * @prop {import('react').Dispatch<import('react').SetStateAction<boolean>>} setInvalidFileType - A state to set an error message if the uploaded file is not a CSV file.
 * @prop {import('react').Dispatch<import('react').SetStateAction<boolean>>} setUploadError - A state to set an error message if the upload fails.
 * @prop {import('react').Dispatch<import('react').SetStateAction<import('./turn-off-2sv-via-csv.types').FilteredOutData>>}
 *     setFilteredOutData - A state to store the filtered out data.
 * @prop {import('react').Dispatch<import('react').SetStateAction<import('./turn-off-2sv-via-csv.types').CsvData>>} setCsvData - A state to store the parsed CSV data.
 * @prop {import('react').Dispatch<import('react').SetStateAction<boolean>>} setDragState - A state to set a boolean indicating whether a file is being dragged over the drag and drop area.
 * @prop {React.MutableRefObject<null | HTMLElement>} dragRef - A reference to the drag and drop area.
 */
function TurnOff2svViaCsvDialog() {
  const [turnOffResult, setTurnOffResult] = useState([]) //state for the turn-off result
  const [csvData, setCsvData] = useState([]) //state for the parsed CSV data
  const [fileName, setFileName] = useState('') //state for the name of the CSV file
  const [invalidFileType, setInvalidFileType] = useState(false) //state for invalid file type error message, displayed when non-csv file upload is attempted
  const [filteredOutData, setFilteredOutData] = useState([]) //state for the filtered out incorrect csv data(empty or invalid email addresses, duplicates etc)
  const [uploadError, setUploadError] = useState(false) //state for upload error message(if any) diplayed when csv file is not parsed correctly
  const [dragState, setDragState] = useState(false) //state for the drag and drop area to trigger event when a file is being dragged over
  const dragRef = useRef(null) //reference to the drag and drop area
  const initialState = {
    status: userStrings.uploadStates.empty, //initial upload state(start screen)
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
      case userStrings.uploadStates.empty: //start screen
        return initialState

      case userStrings.uploadStates.uploadInProgress: //upload in progress (spinner)
        return { status: userStrings.uploadStates.uploadInProgress }

      case userStrings.uploadStates.uploadComplete: //upload complete(green check)
        return { status: userStrings.uploadStates.uploadComplete }

      case userStrings.uploadStates.showBadge: //display a removable badge with the file name
        return { status: userStrings.uploadStates.showBadge }

      case userStrings.uploadStates.showTable: //display the parsed csv data as a table
        return { status: userStrings.uploadStates.showTable }

      case userStrings.uploadStates.deletionInProgress: //deletion in progress (spinner2)
        return { status: userStrings.uploadStates.deletionInProgress }

      case userStrings.uploadStates.showDeletionResult: //display the deletion result, which has 4 possible outcomes: success, partial success, nw error or user does not exist anymore
        return { status: userStrings.uploadStates.showDeletionResult }

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
   * resets any file type and upload errors, clears the turn off result,
   * and sets the upload state to 'empty'.
   */
  function resetStates() {
    setCsvData([])
    setFileName('')
    setInvalidFileType(false)
    setFilteredOutData([])
    setUploadError(false)
    setTurnOffResult([])
    dispatchUploadState({ type: userStrings.uploadStates.empty })
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
      dispatchUploadState({ type: userStrings.uploadStates.empty })
      return
    }

    //otherwise, set the filtered and filtered out data to correstponding states and update the upload state
    //we need to store the filtered out data to display a separate table with the reason for each filtered out item
    setCsvData(filteredData)
    setFilteredOutData(filteredOut)
    setFileName(fileName)
    dispatchUploadState({ type: userStrings.uploadStates.uploadComplete })

    //display the green check for 1 second, then display the badge with the filename
    setTimeout(() => {
      dispatchUploadState({ type: userStrings.uploadStates.showBadge })
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
  function fallbackParse(file) {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        let resultDataArray = results.data
        if (resultDataArray.length <= 2) {
          //the first 2 arrays are table name and table headers, so if there is no other data, it's not a valid CSV
          setUploadError(true)
          dispatchUploadState({ type: userStrings.uploadStates.empty })
          return
        }

        //if parsed data passes validation, remove the table name and table headers and further the data for mapping and filtering
        //otherwise, display upload error
        if (validateParsedDataArray(resultDataArray) === true) {
          const tableDataArrays = resultDataArray.slice(2) //remove table name and table headers
          handleUploadedDataAndState(tableDataArrays, file.name)
        } else {
          setUploadError(true)
          dispatchUploadState({ type: userStrings.uploadStates.empty })
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
    dispatchUploadState({ type: userStrings.uploadStates.uploadInProgress })

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
              dispatchUploadState({ type: userStrings.uploadStates.empty })
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
                dispatchUploadState({ type: userStrings.uploadStates.empty })
              }
              return
            }
            handleUploadedDataAndState(resultData.data, file.name)
          },
        })
      } catch (error) {
        console.log('error', error)
        setUploadError(true)
        dispatchUploadState({ type: userStrings.uploadStates.empty })
      }
    }, 1000) // simulate upload time
  }

  const handleTurnOff = async () => {
    if (csvData.length === 0) return

    try {
      dispatchUploadState({ type: userStrings.uploadStates.deletionInProgress }) //display spinner

      const userList = csvData.map((userObj) => Object.values(userObj)[1])

      const response = await axios.post(
        `http://localhost:4000/api/users/2sv-off`,
        {
          twoSVUserEmails: userList, // This is the request body
        },
        {
          headers: {
            // Authorization: `Bearer ${token}`,
          },
          params: {
            userEmail: email,
          },
        }
      )
      //if all users have been turned off successfully, the backend will send a 200 response. If turn-off was successful partially, it will send a 207 response.
      //  Set the component state accordingly.
      setTurnOffResult({ status: userStrings.deletionResultStatuses.success, responseData: response.data })
    } catch (err) {
      console.log('error', err)

      // error 400 means that the deletion was attempted, but failed for all users.
      if (err.response.status === 400 && err.response.data) {
        setTurnOffResult({ status: userStrings.deletionResultStatuses.failure, responseData: err.response.data })
      } else {
        setTurnOffResult({ status: userStrings.deletionResultStatuses.error, errorStatus: 500, errorDetails: err })
      }
    } finally {
      setTimeout(() => {
        dispatchUploadState({ type: userStrings.uploadStates.showDeletionResult })
      }, 1000) //imitate a 1 second delay
    }
  }

  return (
    <div>
      <Dialog onOpenChange={() => resetStates()}>
        <DialogTrigger asChild>
          <Button variant="default">Turn off 2sv for multiple users</Button>
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
              <DialogTitle className="font-semibold text-2xl/8">Turn off 2sv for multiple users</DialogTitle>
              <DialogDescription>
                You are about to turn off 2-step verification for multiple user(s) from your domain.
              </DialogDescription>
            </DialogHeader>

            <div
              className={`${userStyles.roundBorder} ${userStyles.thinShadow} flex flex-col space-y-6 ${
                //set fixed height so that all related screens look consistent
                'h-[538px]'
              } w-[768px] p-8`}
            >
              {uploadState.status !== userStrings.uploadStates.deletionInProgress &&
                uploadState.status !== userStrings.uploadStates.showDeletionResult && (
                  <div className="flex flex-col gap-y-4">
                    <div className="flex flex-col gap-y-4">
                      <div className="flex flex-col gap-y-1">
                        <div className="font-semibold text-2xl/8">
                          {uploadState.status === userStrings.uploadStates.showTable ? 'Confirm list' : 'Upload CSV'}
                        </div>
                        <div className="text-muted-foreground text-sm/5">
                          {uploadState.status === userStrings.uploadStates.showTable
                            ? 'Review the list of users set for removal.'
                            : 'Upload a CSV file and review the list of users who will have 2-step verification turned off.'}
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
                      {uploadState.status === userStrings.uploadStates.showTable &&
                        filteredOutData &&
                        filteredOutData.length > 0 && <Warning filteredOutData={filteredOutData} />}

                      {/* CSV file badge */}
                      {csvData && uploadState.status === userStrings.uploadStates.showBadge && (
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
              {uploadState.status === userStrings.uploadStates.empty && (
                <div
                  ref={dragRef}
                  className={`${userStyles.uploadArea} border-dashed`}
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
                    className={userStyles.buttonPadding}
                    onClick={() => document.getElementById(userElementIds.deleteMembersByCsvFileInput).click()}
                    variant="outline"
                  >
                    Select a CSV file to upload
                  </Button>
                  <span>or</span>
                  <span>Drag and drop it here</span>
                  <input
                    accept=".csv"
                    id={userElementIds.deleteMembersByCsvFileInput}
                    onChange={(e) => {
                      handleCsvUpload(e.target.files[0])
                    }}
                    type="file"
                    className="hidden"
                  />
                </div>
              )}

              {/* Upload in progress spinner */}
              {uploadState.status === userStrings.uploadStates.uploadInProgress && (
                <div className={`${userStyles.uploadArea} border-dashed`}>
                  <div className="spinner-wrapper">
                    <svg className="spinner" viewBox="0 0 50 50">
                      <circle className="path" cx="25" cy="25" r="20" fill="none" stroke="#ef5039" stroke-width="4" />
                    </svg>
                  </div>
                  <p>Upload in progress</p>
                </div>
              )}

              {/* Upload complete message and green check icon */}
              {uploadState.status === userStrings.uploadStates.uploadComplete && (
                <div
                  className={`${userStyles.uploadArea} border-[#37B705] flex flex-col items-center justify-center gap-y-2`}
                >
                  <Check size={80} color={userStyles.semanticLightModeSuccess} strokeWidth={1} />
                  <p>Upload complete</p>
                </div>
              )}

              {/* CSV table with parsed data */}
              {uploadState.status === userStrings.uploadStates.showTable && <CsvTable csvData={csvData} />}

              {/* Deletion in progress spinner */}
              {uploadState.status === userStrings.uploadStates.deletionInProgress && <Loader />}

              {/* Deletion result table or error */}
              {uploadState.status === userStrings.uploadStates.showDeletionResult && (
                <div>
                  {/* Deletion error screen */}
                  {/* Comes in 2 variants: internal error */}
                  {turnOffResult && turnOffResult.status === userStrings.deletionResultStatuses.error && (
                    <TurnOffError turnOffResult={turnOffResult} />
                  )}

                  {/* Deletion result screen */}
                  {/* Comes in 2 variants: success(all users deleted) or failure(some/all users not deleted) */}
                  {turnOffResult &&
                    (turnOffResult.status === userStrings.deletionResultStatuses.success ||
                      turnOffResult.status === userStrings.deletionResultStatuses.failure) && (
                      <TurnOffResultScreen turnOffResult={turnOffResult} />
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Dialog footer with Next button */}
          {uploadState.status !== userStrings.uploadStates.showTable &&
            uploadState.status !== userStrings.uploadStates.deletionInProgress &&
            uploadState.status !== userStrings.uploadStates.showDeletionResult && (
              <DialogFooter>
                <Button
                  className={userStyles.buttonPaddingWide}
                  onClick={() => {
                    dispatchUploadState({ type: userStrings.uploadStates.showTable })
                  }}
                  disabled={
                    uploadState.status !== userStrings.uploadStates.showBadge &&
                    uploadState.status !== userStrings.uploadStates.showTable
                  }
                >
                  Next
                </Button>
              </DialogFooter>
            )}

          {/* Dialog footer with Back and Remove/Close buttons */}
          {(uploadState.status === userStrings.uploadStates.showTable ||
            uploadState.status === userStrings.uploadStates.deletionInProgress ||
            uploadState.status === userStrings.uploadStates.showDeletionResult) && (
            <DialogFooter
              className={
                uploadState.status === userStrings.uploadStates.deletionInProgress ||
                (uploadState.status === userStrings.uploadStates.showDeletionResult &&
                  turnOffResult.status === userStrings.deletionResultStatuses.error)
                  ? 'md:justify-end'
                  : 'md:justify-between'
              }
            >
              {(uploadState.status === userStrings.uploadStates.showTable ||
                (uploadState.status === userStrings.uploadStates.showDeletionResult &&
                  turnOffResult.status !== userStrings.deletionResultStatuses.error)) && (
                // Back button
                <Button
                  className={`${userStyles.buttonPaddingWide}`}
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
                    if (previousUploadStateStatus === userStrings.uploadStates.empty) resetStates()
                    dispatchUploadState({ type: previousUploadStateStatus })
                  }}
                >
                  Back
                </Button>
              )}

              {/* Remove button, triggers deletion confirmation dialog */}
              {(uploadState.status === userStrings.uploadStates.showTable ||
                uploadState.status === userStrings.uploadStates.deletionInProgress) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className={userStyles.buttonPaddingWide}
                      disabled={uploadState.status === userStrings.uploadStates.deletionInProgress}
                    >
                      Turn off
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{`Are you sure you want to turn off 2-step verification for ${csvData.length} user?`}</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be reversed in bulk.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className={userStyles.buttonPaddingWide}>Cancel</AlertDialogCancel>
                      <AlertDialogAction className={userStyles.buttonPaddingWide} onClick={handleTurnOff}>
                        Turn off
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Close button */}
              {uploadState.status === userStrings.uploadStates.showDeletionResult && (
                <DialogClose asChild>
                  <Button onClick={() => resetStates()} className={`${userStyles.buttonPaddingWide}`}>
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

export default TurnOff2svViaCsvDialog

/**
 * A component for downloading a blank CSV template for removing users from the organization.
 *
 * @returns {JSX.Element} A `div` containing a link to download the template and a tooltip with important information.
 */
function CsvTemplateDownloader() {
  return (
    <div className={`flex text-sm/5 gap-x-2.5 items-center  h-[36px]`}>
      <a
        href={userStrings.UsersCsvTemplateLink}
        download={userStrings.UsersCsvTemplateFileName}
        className={`w-fit flex text-sm/5 gap-x-2.5 ${userStyles.secondaryTextChart5}`}
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
            <p>{`These headings help make sure that 2-step verification is`}</p>
            <p>{`turned off for the right users.`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

/**
 * A component that displays a badge containing the name of a CSV file uploaded for deleting users from the organization.
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
          dispatchUploadState({ type: userStrings.uploadStates.empty })
        }}
      >
        <X size={24} className="stroke-muted-foreground cursor-pointer" />
      </span>
    </div>
  )
}

/**
 * A component for displaying a loading animation while users are being removed from the organization.
 *
 * Contains a dashed border, a loading animation, and a message indicating that the removal is in progress.
 *
 * @returns {JSX.Element} A `div` containing the loading animation and message.
 */
function Loader() {
  return (
    <div className={`${userStyles.uploadAreaExtended} border-dashed`}>
      <div className="spinner-wrapper">
        <svg className="spinner" viewBox="0 0 50 50">
          <circle className="path" cx="25" cy="25" r="20" fill="none" stroke="#ef5039" stroke-width="4" />
        </svg>
      </div>
      <p>Removal in progress</p>
    </div>
  )
}

/**
 * A component that displays a warning about the number of entries in a CSV file that were excluded from the list of users to be removed from a group.
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
          <div className={`w-fit ${userStyles.secondaryTextChart5} cursor-pointer `}>See details</div>
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
              filteredOutData.map((userObj, index) => {
                const values = Object.values(userObj)
                return (
                  <CustomTableRow className="text-xs/4 text-nowrap rounded-none" key={index}>
                    {/* Column 1 displays the email address or name of the user if email is empty */}
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
            <CustomTableHead className="font-semibold px-6">User name</CustomTableHead>
            <CustomTableHead className="font-semibold px-6">User email</CustomTableHead>
          </CustomTableRow>
        </CustomTableHeader>
        <CustomTableBody>
          {csvData &&
            csvData.map((userObj) => {
              const values = Object.values(userObj)
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
 * A component to display an error message when there was an error while
 * turning off 2sv for users.
 *
 * The component takes a `turnOffResult` prop, which is an object with a
 * `status` property. If the `status` is `error`, the component displays an
 * error message.
 *
 * If the `errorStatus` is 500, the component displays a message indicating
 * that an internal error occurred and that the user should wait a while and
 * try again.
 *
 * @param {{ turnOffResult: { status: string, errorStatus: number } }} props - The component props.
 * @returns {JSX.Element} The `TurnOffError` component.
 */
function TurnOffError({ turnOffResult }) {
  return (
    <div className={`${userStyles.uploadAreaExtended} border-destructive`}>
      <CircleX size={80} strokeWidth={1} className="stroke-destructive" />
      <div className="flex flex-col gap-y-4 items-center justify-center text-center">
        <div className="font-semibold text-base/6">There was an error</div>
        {turnOffResult.errorStatus === 500 && (
          <div>
            Users could not be removed from the organization due to
            <br />
            an internal error. Please wait a while and try again.
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * A component to display the results of a 2sv turn-off operation.
 *
 * The component takes a `turnOffResult` prop, which is an object with a `status` property.
 * If the `status` is `failure`, the component displays an error message and a link to a page with more information.
 * If the `status` is `success`, the component displays a success message and a table with the results of the operation.
 *
 * @param {{ turnOffResult: { status: string, responseData: { succeededUsers: number[], failedUsers: number[] } } }} props - The component props.
 * @returns {JSX.Element} The `TurnOffResultScreen` component.
 */
function TurnOffResultScreen({ turnOffResult }) {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-4">
        <div className="font-semibold text-2xl/8">Results</div>
        <div className={`flex text-base gap-x-2 items-center`}>
          {/* Variant 1 of the deletion result: some or all users were not deleted due to errors */}
          {(turnOffResult.status === userStrings.deletionResultStatuses.failure ||
            turnOffResult.responseData.failedUsers.length > 0) && (
            <>
              <TriangleAlert size={21} color={userStyles.semanticDarkModeFailure} strokeWidth={1.5} />
              <div>Turn-off 2sv failed for some users.</div>
              <a className={userStyles.secondaryTextChart5} href="http://localhost:3000" target="_blank">
                Learn more
              </a>
            </>
          )}

          {/* Variant 2 of the deletion result: all users were deleted successfully */}
          {turnOffResult.status === userStrings.deletionResultStatuses.success &&
            turnOffResult.responseData.failedUsers.length === 0 && (
              <>
                <Check size={21} color={userStyles.semanticLightModeSuccess} strokeWidth={1.5} />
                <div>{`${turnOffResult.responseData.succeededUsers.length} user(s) were turned off 2sv successfully`}</div>
              </>
            )}
        </div>
      </div>
      <TurnOffResultTable turnOffResult={turnOffResult} />
    </div>
  )
}

/**
 * A component to display the results of a 2sv turn-off operation in a table format. The component receives the deletion result object as a prop and displays the result in a table with the following columns: Email address, Status and Reason for failure.
 *
 * @param {{ turnOffResult: { status: string, responseData: { succeededUsers: number[], failedUsers: number[] } } }} props - The component props.
 * @returns {JSX.Element} The rendered component for displaying the deletion result in a table format.
 */
function TurnOffResultTable({ turnOffResult }) {
  const [userList, setUserList] = useState([])
  const data = turnOffResult.responseData
  let succeededUsersArray = []
  let failedUsersArray = []
  const resultTableRef = useRef(null)

  useEffect(() => {
    if (data.succeededUsers.length > 0) {
      succeededUsersArray = data.succeededUsers.map((user) => {
        return {
          email: user.email,
          status: 'Turned off successfully',
          reason: '-',
        }
      })
    }

    if (data.failedUsers.length > 0) {
      failedUsersArray = data.failedUsers.map((user) => {
        let reason
        if (user.statusCode === 400 && user.errorMessage.includes('user not enrolled in 2-Step Verification')) {
          reason = 'User is not enrolled in 2sv'
        } else if (
          user.statusCode === 400 &&
          user.errorMessage.includes('user is required by admin policy to have 2-Step Verification ("enforced")')
        ) {
          reason = 'Blocked due to admin policy'
        } else if (user.statusCode === 400 && user.errorMessage.includes('Type not supported: userKey')) {
          reason = 'Not a user in your domain'
        } else if (user.statusCode === 404 || user.statusCode === 403) {
          reason = 'Not a user in your domain'
        } else {
          reason = '-'
        }
        return {
          email: user.email,
          status: 'Failed to turn off',
          reason,
        }
      })
    }

    setUserList([...succeededUsersArray, ...failedUsersArray])
  }, [])

  //Adjusts the height of the table based on the number of rows.
  useEffect(() => {
    if (userList.length === 0) return
    const condition = userList.length >= 10
    customTableHandler({
      tableRef: resultTableRef,
      classesToRemove: 'h-[200px]',
      classesToAdd1: 'h-[360px]',
      classesToAdd2: `h-[${40 + userList.length * 32}px]`,
      condition: condition,
    })
  }, [userList])

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
        {userList &&
          userList.map((user, index) => (
            <CustomTableRow className="text-xs/4 text-nowrap rounded-none" key={index + user.email}>
              <CustomTableCell className="px-6">{user.email}</CustomTableCell>
              <CustomTableCell className="px-6 flex items-center gap-x-2">
                {/* Display the appropriate icon based on the status */}
                {user.status === 'Removed successfully' ? (
                  <Check size={16} color={userStyles.semanticLightModeSuccess} strokeWidth={1.5} />
                ) : (
                  <CircleX size={16} className="stroke-destructive" strokeWidth={1.5} />
                )}
                {user.status}
              </CustomTableCell>
              {/* Display the reason for failure (or a hyphen if not available) */}
              <CustomTableCell className="px-6">{user.reason}</CustomTableCell>
            </CustomTableRow>
          ))}
      </CustomTableBody>
    </CustomTable>
  )
}
