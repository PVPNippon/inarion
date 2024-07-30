import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const ProjectDisplay = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectData, setProjectData] = useState(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      const urlParams = new URLSearchParams(location.search);
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

    fetchProjectData();
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
