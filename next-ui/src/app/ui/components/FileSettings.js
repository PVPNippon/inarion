'use client'
import axios from 'axios';
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'next/navigation';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';


function FileSettings () {

    const { id } = useParams(); // Get the dynamic route parameter
    const [fileDetails, setFileDetails] = useState(null);
    const { email } = useContext(LoggedInUserContext);

    useEffect(() =>{
        const fetchFileDetails = async () => {
            const response = await axios.post(`http://localhost:4000/drive/file/${id}`, {
                email: email,
            },
            {
                withCredentials: true,
            }
        );
        setFileDetails(response.data);
        };
        fetchFileDetails();
    }, [id, email]);


    return (
        <div>
            <h2>File Details</h2>
            {fileDetails ? (
                <pre>{JSON.stringify(fileDetails, null, 2)}</pre>
            ) : (
                <p>Loading file details...</p>
            )}
        </div>
    );
    
}

export default FileSettings;