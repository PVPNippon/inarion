'use client';
import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link'; // Correct import for Next.js Link component
import { CSVLink } from 'react-csv'; // Import CSVLink from react-csv
import axios from 'axios';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';

function ListMyDriveFiles() {
  const [filesData, setFilesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { email } = useContext(LoggedInUserContext);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.post('http://localhost:4000/api/drive/personal-drives', {
          userEmail: email,
        }, {
          withCredentials: true,
        });
        console.log(response.data);
        setFilesData(response.data);
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

  // Prepare data for CSV export
  const csvData = filesData.flatMap(userFiles => 
    userFiles.files.map(file => ({
      email: userFiles.email,
      fileName: file.name,
      mimeType: file.mimeType,
      fileId: file.id,
    }))
  );

  return (
    <div>
      <h2>Google Drive Files</h2>
      {filesData.length === 0 ? (
        <p>No files found.</p>
      ) : (
        <div>
          {filesData.map((userFiles, index) => (
            <div key={index}>
              <h3>User Email: {userFiles.email}</h3>
              {userFiles.files.length > 0 ? (
                <ul>
                  {userFiles.files.map((file, idx) => (
                    <li key={idx}>
                      <strong>{file.name}</strong> ({file.mimeType}) 
                      {/* Use href instead of to */}
                      <Link href={`/mydrive-files/file-settings/${file.id}?email=${userFiles.email}`}>
                        File ID: {file.id}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No files available for this user.</p>
              )}
            </div>
          ))}
        </div>
      )}
       {/* CSV export button */}
       <CSVLink data={csvData} filename="drive_files.csv" className="btn btn-primary">
        Export to CSV
      </CSVLink>

    </div>
  );
}

export default ListMyDriveFiles;
