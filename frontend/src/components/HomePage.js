import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';

const HomePage = () => {
  const [projectData, setProjectData] = useState(null); // Initially set to null
  const [loading, setLoading] = useState(true); // Loading is initially true
  const [error, setError] = useState(null); // Error initially null
  const { email } = useContext(LoggedInUserContext); // Get email from context

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        console.log(`Context Email Value: ${email}`);

        // Ensure email is available before making the request
        if (!email) {
          throw new Error('Email is missing from context');
        }

        const response = await axios.post(
          'http://localhost:4000/project/get-project-data',
          {
            userEmail: email,
          },
          {
            withCredentials: true, // Ensure cookies/session are sent
          }
        );

        setProjectData(response.data); // Set the fetched data
        console.log(projectData);
        setLoading(false); // Set loading to false once the data is fetched
      } catch (err) {
        setError(err.message); // Set the error message if there's an issue
        setLoading(false); // Stop loading even if there's an error
      }
    };

    fetchProjectData();
  }, [email]); // Fetch the data whenever email changes

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
