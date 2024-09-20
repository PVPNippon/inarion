'use client'
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';

  /**
   * A component that fetches project data from the server using the user's email
   * and displays it. If the data is still loading, it displays a loading message.
   * If there's an error, it displays an error message.
   * @returns {JSX.Element} A React component that displays the project data or
   * a loading or error message.
   */
const HomePage = () => {
  const [projectData, setProjectData ] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { email} = useContext(LoggedInUserContext);

  useEffect(() => {
  /**
   * Fetches project data from the server using the user's email and updates the component state.
   * The data is fetched with the user's session cookie.
   * @returns {Promise<void>} - Resolves when the data has been fetched and the state has been updated.
   */
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
