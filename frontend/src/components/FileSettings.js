import axios from 'axios';
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';


function FileSettings () {

    const {fileId} = useParams();
    const [fileDetails, setFileDetails] = useState([]);
    const { email} = useContext(LoggedInUserContext);

    useEffect(() =>{
        const fetchFileDetails = async () => {
            const response = await axios.post(`http://localhost:4000/drive/file/${fileId}`, {
                email: email,
            },
            {
                withCredentials: true,
            }
        );
        setFileDetails(response.data);
        };
        fetchFileDetails();
    }, [fileId]);


    return (
        <div>
            {JSON.stringify(fileDetails)}
        </div>
    );
    
}

export default FileSettings;