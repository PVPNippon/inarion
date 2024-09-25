'use client'
import React, { useEffect, useState } from 'react';
// import { useLocation } from 'react-router-dom';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';

  /**
   * A component that fetches project data from the server using the user's email
   * and project name from the URL, and displays it. If the data is still loading,
   * it displays a loading message. If there's an error, it displays an error message.
   * @returns {JSX.Element} A React component that displays the project data or
   * a loading or error message.
   */
const ProjectDisplay = () => {
  // const location = useLocation();
  const location = useRouter();
  const [email, setEmail] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectData, setProjectData] = useState(null);

  useEffect(() => {
    /**
     * Fetches project data from the server using the user's email and project name
     * from the URL. If the request is successful, it sets the projectData state to
     * the response data. If there is an error, it logs the error to the console.
     */
    const FetchProjectData = async () => {
      // const urlParams = new URLSearchParams(location.search);
      const urlParams = useSearchParams();
      const email = urlParams.get('email');
      const projectName = urlParams.get('projectName');

      setEmail(email);
      setProjectName(projectName);

      try {
        const response = await axios.get('http://localhost:4000/project/get-project-data', {
          params: {
            email,
            projectName
          },
          withCredentials: true,
        });
        setProjectData(response.data);
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };

    FetchProjectData();
  }, [location]);

  if (!projectData) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Project Details</h1>
      <p>Email: {email}</p>
      <p>Project Name: {projectName}</p>
      <pre>{JSON.stringify(projectData, null, 2)}</pre>
    </div>
  );
};

export default ProjectDisplay;
