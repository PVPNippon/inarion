/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'

/**
 * Displays file details for a given file ID and impersonating email.
 *
 * Calls the `/api/drive/file/:fileId` API endpoint to fetch the file details.
 *
 * @param {string} fileId The ID of the file to display details for.
 * @param {string} emailToImpersonate The email of the user to impersonate.
 *
 * @returns {React.ReactElement} The JSX element with the file details or a loading message.
 */
function FileSettings({ fileId, emailToImpersonate }) {
  const [fileDetails, setFileDetails] = useState([])
  const { email } = useContext(LoggedInUserContext) // Get the email from the context

  useEffect(() => {
    if (!fileId || !emailToImpersonate) {
      console.warn('File ID or email is undefined.')
      return // Exit if fileId or email is not yet available
    }

    /**
     * Fetches the file details for the given fileId and impersonating email.
     *
     * Makes a POST request to the `/api/drive/file/:fileId` API endpoint with
     * the email and emailToImpersonate as the request body. The request is sent
     * with the `withCredentials` option set to true, which includes the session
     * cookies in the request.
     *
     * If the request is successful, it sets the fileDetails state to the
     * response data. If there is an error, it logs the error to the console.
     */
    const fetchFileDetails = async () => {
      try {
        const response = await axios.post(
          `http://localhost:4000/api/drive/file/${fileId}`,
          {
            email: email,
            emailToImpersonate: emailToImpersonate, // Impersonating email
          },
          {
            withCredentials: true,
          }
        )
        setFileDetails(response.data)
      } catch (err) {
        console.error('Error fetching file details:', err)
      }
    }

    fetchFileDetails()
  }, [fileId, email, emailToImpersonate]) // Only run when fileId, email, or emailToImpersonate change

  // Render the file details or loading state
  return (
    <div>
      {fileId && emailToImpersonate ? <div>{JSON.stringify(fileDetails)}</div> : <p>Loading file details...</p>}
    </div>
  )
}

export default FileSettings
