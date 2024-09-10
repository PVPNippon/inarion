'use client'
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';

const HomePage = () => {
  const [projectData, setProjectData ] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { email} = useContext(LoggedInUserContext);

  useEffect(() => {
    const fetchProjectData = async (req, res) =>{
      const response = await axios.post('http://localhost:4000/project/get-project-data', {
          userEmail : email, 
      }, {withCredentials: true},
  );

    setProjectData(response.data);
  };

    fetchProjectData();
  }, [email]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return <div>Project data has been stored successfully!</div>;
};

export default HomePage;
