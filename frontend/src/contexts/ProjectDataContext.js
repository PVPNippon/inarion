// contexts/ProjectDataContext.js
import React, { createContext, useState, useEffect  } from 'react';

export const ProjectDataContext = createContext();

export const ProjectDataProvider = ({ children }) => {
    console.log('Inside Project Data context');

  const [projectData, setProjectData] = useState(()=>{
    const storedData = window.localStorage.getItem('projectData');
    return storedData ? JSON.parse(storedData) : null; // Parse the JSON string

    // return window.localStorage.getItem('projectData') || '';

  });

  useEffect(() => {
    // Update localStorage whenever projectData changes
    if (projectData) {
        window.localStorage.setItem('projectData', JSON.stringify(projectData));
    } else {
        window.localStorage.removeItem('projectData');
    }
  }, [projectData]);

  return (
    <ProjectDataContext.Provider value={{ projectData, setProjectData }}>
      {children}
    </ProjectDataContext.Provider>
  );
};
