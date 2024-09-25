import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';
import { ProjectDataContext } from '../contexts/ProjectDataContext';

const HomePage = () => {
  // const [projectData, setProjectData] = useState(null); // Initially set to null
  const { projectData, setProjectData } = useContext(ProjectDataContext); // Use ProjectDataContext

  const [loading, setLoading] = useState(true); // Loading is initially true
  const [error, setError] = useState(null); // Error initially null
  const { email } = useContext(LoggedInUserContext); // Get email from context
  

  useEffect(() => {

    // If projectData is already available, no need to fetch
    if (projectData) {
      setLoading(false);
      console.log('Project data already present, no need to fetch');
      return; // Exit early
    } 

     // Ensure email is available before making the request
     if (!email) {
      setError('Email is missing from context');
      setLoading(false);
      return;
    }

    const fetchProjectData = async () => {
      try {
        console.log('Fetching data from Backend');

        // Ensure email is available before making the request
        // if (!email) {
        //   throw new Error('Email is missing from context');
        // }

        const response = await axios.post(
          'http://localhost:4000/project/get-project-data',
          {
            userEmail: email,
          },
          {
            withCredentials: true, // Ensure cookies/session are sent
          }
        );

        let data = response.data;

        // Ensure data is an object
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }

        setProjectData(data); // Set the fetched data
        console.log(data);
        setLoading(false); // Set loading to false once the data is fetched
      } catch (err) {
        setError(err.message); // Set the error message if there's an issue
        setLoading(false); // Stop loading even if there's an error
      }
    };

    fetchProjectData();
  }, [email, projectData, setProjectData]); // Fetch the data whenever email changes

  // Display loading spinner
  if (loading) return <p>Loading...</p>;

  // Display error message if an error occurs
  if (error) return <p>Error: {error}</p>;

  // If there's no error and the data has been fetched, display it
  return (
    <div>
      <h1>Project Data</h1>
      <pre>{JSON.stringify(projectData, null, 2)}</pre> {/* Display JSON formatted */}
    </div>
  );
};

export default HomePage;
