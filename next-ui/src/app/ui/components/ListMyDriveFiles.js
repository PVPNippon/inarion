'use client'
import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';

import axios from 'axios';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';

function ListMyDriveFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { email} = useContext(LoggedInUserContext);

  useEffect(() => {

    const fetchFiles = async () => {
      try {
        const response = await axios.post('http://localhost:4000/drive/list-files', {
          userEmail : email, 
        }, 
      {
        withCredentials: true,
      });
        setFiles(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchFiles();
  }, [email]);

  if (loading) return <p>Loading files...</p>;
  if (error) return <p>Error loading files: {error.message}</p>;

  return (
    <div>
      <h2>Google Drive Files</h2>
      <ul>
        {files.map(file => (
          <li key={file.id}>
            {file.name} ({file.mimeType}) <Link href={`/drive/mydrive-files/file-settings/${file.id}`}>{file.id}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ListMyDriveFiles;
