'use client';
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';

function FileSettings({ fileId, emailToImpersonate }) {
  const [fileDetails, setFileDetails] = useState([]);
  const { email } = useContext(LoggedInUserContext); // Get the email from the context

  useEffect(() => {
    if (!fileId || !emailToImpersonate) {
      console.warn("File ID or email is undefined.");
      return; // Exit if fileId or email is not yet available
    }

    const fetchFileDetails = async () => {
      try {
        const response = await axios.post(`http://localhost:4000/api/drive/file/${fileId}`, {
          email: email,
          emailToImpersonate: emailToImpersonate, // Impersonating email
        }, {
          withCredentials: true,
        });
        setFileDetails(response.data);
      } catch (err) {
        console.error("Error fetching file details:", err);
      }
    };

    fetchFileDetails();
  }, [fileId, email, emailToImpersonate]); // Only run when fileId, email, or emailToImpersonate change

  // Render the file details or loading state
  return (
    <div>
      {fileId && emailToImpersonate ? (
        <div>{JSON.stringify(fileDetails)}</div>
      ) : (
        <p>Loading file details...</p>
      )}
    </div>
  );
}

export default FileSettings;
